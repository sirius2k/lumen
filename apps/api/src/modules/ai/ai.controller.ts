import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('briefing')
  getBriefing(@CurrentUser() user: any) {
    return this.aiService.generateDailyBriefing(user.id);
  }

  @Get('search')
  search(@Query('q') query: string, @CurrentUser() user: any) {
    return this.aiService.globalSearch(user.id, query);
  }
}
