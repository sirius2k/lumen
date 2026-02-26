'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calendarApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/i18n.context';
import { getDateLocale } from '@/i18n/dateLocale';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const { t, tArray, locale } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: events = [] } = useQuery({
    queryKey: ['events', format(monthStart, 'yyyy-MM')],
    queryFn: () =>
      calendarApi.list({
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      }),
  });

  const createEvent = useMutation({
    mutationFn: calendarApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setNewEventTitle('');
      setIsCreating(false);
    },
  });

  const handleCreateEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    const startAt = new Date(selectedDate);
    startAt.setHours(9, 0, 0, 0);
    const endAt = new Date(selectedDate);
    endAt.setHours(10, 0, 0, 0);

    createEvent.mutate({
      title: newEventTitle,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      allDay: true,
    });
  };

  // 달력 날짜 생성
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (date: Date) =>
    events.filter((e: any) => isSameDay(new Date(e.startAt), date));

  const weekDays = tArray('calendar.weekDays');
  const dateLocale = getDateLocale(locale);
  const monthHeader = format(
    currentDate,
    locale === 'ko' ? 'yyyy년 M월' : 'MMMM yyyy',
    { locale: dateLocale },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          {t('calendar.title')}
        </h1>
      </div>

      {/* 달력 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[160px] text-center">
          {monthHeader}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
        >
          {t('calendar.today')}
        </Button>
      </div>

      {/* 달력 그리드 */}
      <div className="rounded-lg border overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className={cn(
                'p-2 text-center text-sm font-medium',
                i === 0 && 'text-red-500',
                i === 6 && 'text-blue-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            const dayEvents = getEventsForDay(date);
            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const dayOfWeek = date.getDay();

            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedDate(date);
                  setIsCreating(true);
                }}
                className={cn(
                  'min-h-[100px] p-1.5 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors',
                  !isCurrentMonth && 'bg-muted/20',
                  isSelected && 'bg-primary/5',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm mb-1',
                    isToday && 'bg-primary text-primary-foreground font-bold',
                    !isToday && dayOfWeek === 0 && 'text-red-500',
                    !isToday && dayOfWeek === 6 && 'text-blue-500',
                    !isCurrentMonth && 'text-muted-foreground',
                  )}
                >
                  {format(date, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event: any) => (
                    <div
                      key={event.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] bg-primary/20 text-primary font-medium"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      {t('calendar.moreEvents', { count: dayEvents.length - 2 })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 이벤트 추가 모달 */}
      {isCreating && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h3 className="font-semibold mb-4">
              {t('calendar.addEventTitle', {
                date: format(
                  selectedDate,
                  locale === 'ko' ? 'M월 d일 (EEE)' : 'MMM d (EEE)',
                  { locale: dateLocale },
                ),
              })}
            </h3>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-4"
              placeholder={t('calendar.eventPlaceholder')}
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewEventTitle('');
                }}
              >
                {t('calendar.cancel')}
              </Button>
              <Button onClick={handleCreateEvent} disabled={!newEventTitle.trim()}>
                {t('calendar.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
