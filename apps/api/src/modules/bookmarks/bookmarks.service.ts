import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  private anthropic: Anthropic;
  private readonly logger = new Logger(BookmarksService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY') });
  }

  async findAll(userId: string, filter?: { isRead?: boolean; tagId?: string }) {
    const where: any = { userId };
    if (filter?.isRead !== undefined) where.isRead = filter.isRead;
    if (filter?.tagId) where.tags = { some: { id: filter.tagId } };

    return this.prisma.bookmark.findMany({
      where,
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, url: string, tagIds?: string[]) {
    // URL 메타데이터 + 콘텐츠 추출
    let title = url;
    let description = '';
    let favicon = '';
    let content = '';

    try {
      const cheerio = await import('cheerio');
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LumenBot/1.0)' },
        signal: AbortSignal.timeout(10000),
      });
      const html = await response.text();
      const $ = cheerio.load(html);

      title =
        $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        url;
      description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '';
      favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

      $('script, style, nav, footer, header').remove();
      content = $('article, main, .content, body').first().text().slice(0, 5000);
    } catch (err) {
      this.logger.warn(`URL 메타데이터 추출 실패: ${err.message}`);
    }

    // AI 요약 생성
    let aiSummary = '';
    if (content) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `다음 웹페이지 내용을 2-3문장으로 간결하게 요약해주세요:\n\n제목: ${title}\n\n${content}`,
            },
          ],
        });
        aiSummary = (response.content[0] as any).text;
      } catch (err) {
        this.logger.warn(`AI 요약 실패: ${err.message}`);
      }
    }

    return this.prisma.bookmark.create({
      data: {
        url,
        title: title.slice(0, 500),
        description: description.slice(0, 1000),
        aiSummary,
        favicon,
        userId,
        ...(tagIds ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: { tags: true },
    });
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; description?: string; isRead?: boolean; tagIds?: string[] },
  ) {
    const bookmark = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!bookmark) throw new NotFoundException('북마크를 찾을 수 없습니다.');
    if (bookmark.userId !== userId) throw new ForbiddenException();

    const { tagIds, ...rest } = data;
    return this.prisma.bookmark.update({
      where: { id },
      data: {
        ...rest,
        ...(tagIds !== undefined
          ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
      include: { tags: true },
    });
  }

  async remove(id: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!bookmark) throw new NotFoundException();
    if (bookmark.userId !== userId) throw new ForbiddenException();
    await this.prisma.bookmark.delete({ where: { id } });
  }
}
