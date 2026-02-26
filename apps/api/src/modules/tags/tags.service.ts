import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, data: { name: string; color?: string }) {
    return this.prisma.tag.upsert({
      where: { name_userId: { name: data.name, userId } },
      update: {},
      create: { ...data, userId },
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.tag.deleteMany({ where: { id, userId } });
  }
}
