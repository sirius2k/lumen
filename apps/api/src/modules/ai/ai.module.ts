import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TasksModule } from '../tasks/tasks.module';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [TasksModule, NotesModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
