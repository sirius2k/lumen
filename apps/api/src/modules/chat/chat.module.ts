import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { SourcesModule } from '../sources/sources.module';

@Module({
  imports: [EmbeddingsModule, SourcesModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
