import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SourcesService } from '../sources/sources.service';
import { Response } from 'express';

@Injectable()
export class ChatService {
  private anthropic: Anthropic;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private embeddings: EmbeddingsService,
    private sources: SourcesService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY'),
    });
  }

  async getOrCreateChat(notebookId: string, userId: string) {
    let chat = await this.prisma.chat.findFirst({
      where: { notebookId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { notebookId, userId },
        include: { messages: true },
      });
    }

    return chat;
  }

  async streamChat(
    notebookId: string,
    userId: string,
    userMessage: string,
    res: Response,
  ) {
    const chat = await this.getOrCreateChat(notebookId, userId);

    // 사용자 메시지 저장
    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'USER',
        content: userMessage,
      },
    });

    // RAG: 유사 청크 검색
    const queryEmbedding = await this.embeddings.embed(userMessage);
    const similarChunks = await this.sources.searchSimilarChunks(
      notebookId,
      queryEmbedding,
      5,
    );

    // 소스 정보 조회
    const sourceIds = [...new Set(similarChunks.map((c) => c.sourceId))];
    const sourceDocs = await this.prisma.source.findMany({
      where: { id: { in: sourceIds } },
      select: { id: true, title: true },
    });
    const sourceMap = Object.fromEntries(sourceDocs.map((s) => [s.id, s.title]));

    // 컨텍스트 구성
    const contextText = similarChunks
      .map(
        (c, i) =>
          `[출처 ${i + 1}: ${sourceMap[c.sourceId] || '알 수 없음'}]\n${c.content}`,
      )
      .join('\n\n---\n\n');

    // 이전 대화 이력
    const history = await this.prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const messages: Anthropic.MessageParam[] = history.slice(0, -1).map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }));

    messages.push({
      role: 'user',
      content: `다음 컨텍스트를 참고하여 질문에 답하세요. 답변 시 관련 출처를 인용해주세요.

컨텍스트:
${contextText}

질문: ${userMessage}`,
    });

    // SSE 헤더
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let fullContent = '';

    try {
      const stream = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system:
          '당신은 사용자의 문서와 자료를 기반으로 질문에 답변하는 AI 어시스턴트입니다. 항상 제공된 컨텍스트에 근거하여 답변하고, 출처를 명확히 인용하세요.',
        messages,
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullContent += event.delta.text;
          res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`);
        }
      }

      // 인용 정보
      const citations = similarChunks.map((c) => ({
        sourceId: c.sourceId,
        sourceTitle: sourceMap[c.sourceId] || '알 수 없음',
        chunkContent: c.content.slice(0, 200),
      }));

      // AI 메시지 저장
      await this.prisma.message.create({
        data: {
          chatId: chat.id,
          role: 'ASSISTANT',
          content: fullContent,
          citations,
        },
      });

      res.write(
        `data: ${JSON.stringify({ type: 'done', citations })}\n\n`,
      );
      res.end();
    } catch (err) {
      this.logger.error('Chat stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }

  async getChatHistory(notebookId: string, userId: string) {
    const chat = await this.getOrCreateChat(notebookId, userId);
    return chat.messages;
  }
}
