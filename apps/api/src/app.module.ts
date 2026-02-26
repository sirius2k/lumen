import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotebooksModule } from './modules/notebooks/notebooks.module';
import { SourcesModule } from './modules/sources/sources.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotesModule } from './modules/notes/notes.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { TagsModule } from './modules/tags/tags.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    NotebooksModule,
    SourcesModule,
    EmbeddingsModule,
    ChatModule,
    NotesModule,
    TasksModule,
    CalendarModule,
    BookmarksModule,
    TagsModule,
    AiModule,
  ],
})
export class AppModule {}
