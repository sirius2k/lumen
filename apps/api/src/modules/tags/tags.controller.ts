import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TagsService } from './tags.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.tagsService.findAll(user.id);
  }

  @Post()
  create(@Body() body: { name: string; color?: string }, @CurrentUser() user: any) {
    return this.tagsService.create(user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tagsService.remove(id, user.id);
  }
}
