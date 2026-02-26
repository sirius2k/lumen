import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, filter?: { status?: TaskStatus; today?: boolean }) {
    const where: any = { userId };
    if (filter?.status) where.status = filter.status;
    if (filter?.today) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 86400000);
      where.dueDate = { gte: todayStart, lt: todayEnd };
    }

    return this.prisma.task.findMany({
      where,
      include: { project: true, tags: true },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string;
      projectId?: string;
      tagIds?: string[];
    },
  ) {
    const { tagIds, dueDate, ...rest } = data;
    return this.prisma.task.create({
      data: {
        ...rest,
        userId,
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        ...(tagIds ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: { project: true, tags: true },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      dueDate?: string;
      projectId?: string;
      tagIds?: string[];
    },
  ) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('태스크를 찾을 수 없습니다.');
    if (task.userId !== userId) throw new ForbiddenException();

    const { tagIds, dueDate, ...rest } = data;
    return this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(tagIds !== undefined
          ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
      include: { project: true, tags: true },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException();
    if (task.userId !== userId) throw new ForbiddenException();
    await this.prisma.task.delete({ where: { id } });
  }

  async getTodayTasks(userId: string) {
    return this.findAll(userId, { today: true });
  }
}
