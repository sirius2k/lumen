import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, start?: string, end?: string) {
    const where: any = { userId };
    if (start || end) {
      where.startAt = {};
      if (start) where.startAt.gte = new Date(start);
      if (end) where.startAt.lte = new Date(end);
    }

    return this.prisma.event.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      startAt: string;
      endAt: string;
      allDay?: boolean;
      color?: string;
    },
  ) {
    return this.prisma.event.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      allDay?: boolean;
      color?: string;
    },
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    if (event.userId !== userId) throw new ForbiddenException();

    const { startAt, endAt, ...rest } = data;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
      },
    });
  }

  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException();
    if (event.userId !== userId) throw new ForbiddenException();
    await this.prisma.event.delete({ where: { id } });
  }
}
