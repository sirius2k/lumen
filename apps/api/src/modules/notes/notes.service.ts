import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, notebookId?: string) {
    return this.prisma.note.findMany({
      where: { userId, ...(notebookId ? { notebookId } : {}) },
      include: { tags: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!note) throw new NotFoundException('노트를 찾을 수 없습니다.');
    if (note.userId !== userId) throw new ForbiddenException();
    return note;
  }

  async create(
    userId: string,
    data: {
      title: string;
      content?: string;
      notebookId?: string;
      tagIds?: string[];
      isAiGenerated?: boolean;
    },
  ) {
    const { tagIds, ...rest } = data;
    return this.prisma.note.create({
      data: {
        ...rest,
        userId,
        ...(tagIds ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: { tags: true },
    });
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; content?: string; tagIds?: string[] },
  ) {
    await this.findOne(id, userId);
    const { tagIds, ...rest } = data;
    return this.prisma.note.update({
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
    await this.findOne(id, userId);
    await this.prisma.note.delete({ where: { id } });
  }
}
