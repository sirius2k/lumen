import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotebooksService } from './notebooks.service';

@Controller('notebooks')
@UseGuards(JwtAuthGuard)
export class NotebooksController {
  constructor(private notebooksService: NotebooksService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.notebooksService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notebooksService.findOne(id, user.id);
  }

  @Post()
  create(@Body() body: { title: string; description?: string }, @CurrentUser() user: any) {
    return this.notebooksService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.notebooksService.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notebooksService.remove(id, user.id);
  }
}
