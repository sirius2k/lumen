import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [TasksController, ProjectsController],
  providers: [TasksService, ProjectsService],
  exports: [TasksService],
})
export class TasksModule {}
