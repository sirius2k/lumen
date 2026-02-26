import { Controller, Post, Get, Param, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@Controller('notebooks/:notebookId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('history')
  getHistory(@Param('notebookId') notebookId: string, @CurrentUser() user: any) {
    return this.chatService.getChatHistory(notebookId, user.id);
  }

  @Post()
  async chat(
    @Param('notebookId') notebookId: string,
    @Body() body: { message: string },
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    await this.chatService.streamChat(notebookId, user.id, body.message, res);
  }
}
