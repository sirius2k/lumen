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
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private bookmarksService: BookmarksService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('isRead') isRead?: string,
    @Query('tagId') tagId?: string,
  ) {
    return this.bookmarksService.findAll(user.id, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      tagId,
    });
  }

  @Post()
  create(
    @Body() body: { url: string; tagIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.bookmarksService.create(user.id, body.url, body.tagIds);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; isRead?: boolean; tagIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.bookmarksService.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookmarksService.remove(id, user.id);
  }
}
