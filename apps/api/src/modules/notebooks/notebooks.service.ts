import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotebooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const notebooks = await this.prisma.notebook.findMany({
      where: { userId },
      include: {
        _count: { select: { sources: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return notebooks.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      userId: n.userId,
      sourceCount: n._count.sources,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  }

  async findOne(id: string, userId: string) {
    const notebook = await this.prisma.notebook.findUnique({
      where: { id },
      include: {
        sources: {
          select: {
            id: true,
            type: true,
            title: true,
            url: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { sources: true } },
      },
    });
    if (!notebook) throw new NotFoundException('노트북을 찾을 수 없습니다.');
    if (notebook.userId !== userId) throw new ForbiddenException();
    return notebook;
  }

  async create(userId: string, data: { title: string; description?: string }) {
    return this.prisma.notebook.create({
      data: { ...data, userId },
    });
  }

  async update(id: string, userId: string, data: { title?: string; description?: string }) {
    await this.findOne(id, userId);
    return this.prisma.notebook.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.notebook.delete({ where: { id } });
  }
}
