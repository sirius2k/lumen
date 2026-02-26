import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { NotesService } from '../notes/notes.service';

@Injectable()
export class AiService {
  private anthropic: Anthropic;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private tasksService: TasksService,
    private notesService: NotesService,
  ) {
    this.anthropic = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY') });
  }

  async generateDailyBriefing(userId: string) {
    const [todayTasks, recentNotes, recentBookmarks] = await Promise.all([
      this.tasksService.findAll(userId, { today: true }),
      this.notesService.findAll(userId),
      this.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const today = new Date();
    const dateStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    const context = `
오늘 날짜: ${dateStr}
사용자: ${user?.name}

오늘 마감 태스크 (${todayTasks.length}개):
${todayTasks.map((t) => `- [${t.status}] ${t.title}`).join('\n') || '없음'}

최근 노트 (최근 5개):
${recentNotes
  .slice(0, 5)
  .map((n) => `- ${n.title}: ${n.content.slice(0, 100)}...`)
  .join('\n') || '없음'}

최근 저장된 북마크 (최근 3개):
${recentBookmarks
  .map((b) => `- ${b.title}: ${b.aiSummary?.slice(0, 100) || b.description?.slice(0, 100) || ''}`)
  .join('\n') || '없음'}
`.trim();

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `다음 정보를 바탕으로 ${user?.name}님을 위한 오늘의 간결한 브리핑을 작성해주세요. 친근하고 격려하는 톤으로, 3-4문장으로 요약해주세요.\n\n${context}`,
          },
        ],
      });

      return {
        greeting: `안녕하세요, ${user?.name}님`,
        todayTasks,
        recentNotes: recentNotes.slice(0, 3),
        briefingText: (response.content[0] as any).text,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error('Daily briefing 생성 실패:', err);
      return {
        greeting: `안녕하세요, ${user?.name}님`,
        todayTasks,
        recentNotes: recentNotes.slice(0, 3),
        briefingText: `오늘 ${todayTasks.length}개의 태스크가 있습니다.`,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  async globalSearch(userId: string, query: string) {
    const [notes, bookmarks, tasks] = await Promise.all([
      this.prisma.note.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.bookmark.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { aiSummary: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: {
          userId,
          title: { contains: query, mode: 'insensitive' },
        },
        take: 5,
      }),
    ]);

    const results = [
      ...notes.map((n) => ({
        type: 'note' as const,
        id: n.id,
        title: n.title,
        excerpt: n.content.slice(0, 150),
      })),
      ...bookmarks.map((b) => ({
        type: 'bookmark' as const,
        id: b.id,
        title: b.title,
        excerpt: b.aiSummary?.slice(0, 150) || b.description?.slice(0, 150) || b.url,
      })),
      ...tasks.map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        excerpt: t.description?.slice(0, 150) || '',
      })),
    ];

    return results;
  }
}
