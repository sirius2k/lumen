import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, data: { name: string; color?: string }) {
    return this.prisma.project.create({ data: { ...data, userId } });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException();
    if (project.userId !== userId) throw new ForbiddenException();
    await this.prisma.project.delete({ where: { id } });
  }
}
