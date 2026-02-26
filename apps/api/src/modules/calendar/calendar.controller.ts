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
import { CalendarService } from './calendar.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.calendarService.findAll(user.id, start, end);
  }

  @Post()
  create(
    @Body() body: {
      title: string;
      description?: string;
      startAt: string;
      endAt: string;
      allDay?: boolean;
      color?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.calendarService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      allDay?: boolean;
      color?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.calendarService.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.calendarService.remove(id, user.id);
  }
}
