import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('today') today?: string,
  ) {
    return this.tasksService.findAll(user.id, {
      status: status as any,
      today: today === 'true',
    });
  }

  @Post()
  create(
    @Body() body: {
      title: string;
      description?: string;
      dueDate?: string;
      projectId?: string;
      tagIds?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      description?: string;
      status?: string;
      dueDate?: string;
      projectId?: string;
      tagIds?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, user.id, body as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user.id);
  }
}
