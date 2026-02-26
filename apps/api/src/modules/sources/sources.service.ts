import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
  ) {}

  async addFileSource(notebookId: string, file: Express.Multer.File) {
    const type = file.mimetype === 'application/pdf' ? 'PDF' : 'TXT';
    const source = await this.prisma.source.create({
      data: {
        notebookId,
        type,
        title: file.originalname,
        filePath: file.path,
        status: 'PENDING',
      },
    });

    // 비동기 처리
    this.processSource(source.id).catch((err) =>
      this.logger.error(`Source ${source.id} 처리 실패: ${err.message}`),
    );

    return source;
  }

  async addUrlSource(notebookId: string, url: string, title?: string) {
    const source = await this.prisma.source.create({
      data: {
        notebookId,
        type: 'URL',
        title: title || url,
        url,
        status: 'PENDING',
      },
    });

    this.processSource(source.id).catch((err) =>
      this.logger.error(`Source ${source.id} 처리 실패: ${err.message}`),
    );

    return source;
  }

  async processSource(sourceId: string) {
    const source = await this.prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) return;

    await this.prisma.source.update({
      where: { id: sourceId },
      data: { status: 'PROCESSING' },
    });

    try {
      let content = '';

      if (source.type === 'PDF' && source.filePath) {
        content = await this.extractPdfText(source.filePath);
      } else if (source.type === 'TXT' && source.filePath) {
        content = fs.readFileSync(source.filePath, 'utf-8');
      } else if (source.type === 'URL' && source.url) {
        content = await this.extractUrlContent(source.url);
      }

      if (!content) throw new Error('컨텐츠 추출 실패');

      const chunks = this.embeddings.chunkText(content);
      const embeddingVectors = await this.embeddings.embedBatch(chunks);

      // 청크 저장 (pgvector)
      await this.prisma.chunk.deleteMany({ where: { sourceId } });

      for (let i = 0; i < chunks.length; i++) {
        const embedding = embeddingVectors[i];
        await this.prisma.$executeRaw`
          INSERT INTO "Chunk" (id, "sourceId", content, embedding, index, "createdAt")
          VALUES (gen_random_uuid(), ${sourceId}, ${chunks[i]}, ${`[${embedding.join(',')}]`}::vector, ${i}, NOW())
        `;
      }

      await this.prisma.source.update({
        where: { id: sourceId },
        data: { status: 'READY', content: content.slice(0, 50000) },
      });

      this.logger.log(`Source ${sourceId} 처리 완료: ${chunks.length}개 청크`);
    } catch (err) {
      this.logger.error(`Source ${sourceId} 처리 오류: ${err.message}`);
      await this.prisma.source.update({
        where: { id: sourceId },
        data: { status: 'ERROR', errorMsg: err.message },
      });
    }
  }

  async searchSimilarChunks(notebookId: string, queryEmbedding: number[], limit = 5) {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const results = await this.prisma.$queryRaw<
      Array<{ id: string; content: string; sourceId: string; similarity: number }>
    >`
      SELECT c.id, c.content, c."sourceId",
             1 - (c.embedding <=> ${embeddingStr}::vector) AS similarity
      FROM "Chunk" c
      JOIN "Source" s ON s.id = c."sourceId"
      WHERE s."notebookId" = ${notebookId}
        AND s.status = 'READY'
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;
    return results;
  }

  async remove(sourceId: string) {
    const source = await this.prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) throw new NotFoundException('소스를 찾을 수 없습니다.');

    if (source.filePath && fs.existsSync(source.filePath)) {
      fs.unlinkSync(source.filePath);
    }

    await this.prisma.source.delete({ where: { id: sourceId } });
  }

  private async extractPdfText(filePath: string): Promise<string> {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractUrlContent(url: string): Promise<string> {
    const cheerio = await import('cheerio');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LumenBot/1.0)' },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // 불필요 요소 제거
    $('script, style, nav, footer, header, aside, .ad, #ad').remove();

    // 제목 + 본문 추출
    const title = $('title').text() || $('h1').first().text();
    const body = $('article, main, .content, .post-content, body').first().text();

    return `${title}\n\n${body}`.replace(/\s+/g, ' ').trim();
  }
}
