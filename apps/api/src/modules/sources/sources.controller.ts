import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SourcesService } from './sources.service';

@Controller('notebooks/:notebookId/sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('notebookId') notebookId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.sourcesService.addFileSource(notebookId, file);
  }

  @Post('url')
  addUrl(
    @Param('notebookId') notebookId: string,
    @Body() body: { url: string; title?: string },
  ) {
    return this.sourcesService.addUrlSource(notebookId, body.url, body.title);
  }

  @Delete(':sourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('sourceId') sourceId: string) {
    return this.sourcesService.remove(sourceId);
  }
}
