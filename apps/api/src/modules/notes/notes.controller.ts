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
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('notebookId') notebookId?: string) {
    return this.notesService.findAll(user.id, notebookId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.findOne(id, user.id);
  }

  @Post()
  create(
    @Body() body: { title: string; content?: string; notebookId?: string; tagIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.notesService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; tagIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.notesService.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.remove(id, user.id);
  }
}
