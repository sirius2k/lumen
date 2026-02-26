'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckSquare, FileText, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tasksApi, notesApi, aiApi } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useI18n } from '@/i18n/i18n.context';
import { getDateLocale } from '@/i18n/dateLocale';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t, locale } = useI18n();
  const today = new Date();
  const dateStr = format(today, 'yyyy.MM.dd (EEE)', { locale: getDateLocale(locale) });

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksApi.list({ today: true }),
  });

  const { data: recentNotes = [] } = useQuery({
    queryKey: ['notes', 'recent'],
    queryFn: () => notesApi.list(),
  });

  const {
    data: briefing,
    mutate: generateBriefing,
    isPending: isLoadingBriefing,
  } = useMutation({
    mutationFn: aiApi.briefing,
  });

  useEffect(() => {
    generateBriefing();
  }, []);

  const updateTask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.update(id, { status }),
  });

  const quickLinks = [
    { href: '/knowledge', label: t('dashboard.knowledge'), icon: '🧠', desc: t('dashboard.knowledgeDesc') },
    { href: '/tasks', label: t('dashboard.tasks'), icon: '✅', desc: t('dashboard.tasksDesc') },
    { href: '/calendar', label: t('dashboard.calendar'), icon: '📅', desc: t('dashboard.calendarDesc') },
    { href: '/bookmarks', label: t('dashboard.bookmarks'), icon: '🔖', desc: t('dashboard.bookmarksDesc') },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('dashboard.greeting', { name: user?.name ?? '' })}
        </h1>
        <p className="text-muted-foreground">{dateStr}</p>
      </div>

      {/* 위젯 그리드 */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* 오늘 할일 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4 text-primary" />
              {t('dashboard.todayTasks')}
              <Badge variant="secondary" className="ml-auto">
                {todayTasks.filter((t: any) => t.status !== 'DONE').length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noTodayTasks')}</p>
            ) : (
              todayTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateTask.mutate({
                        id: task.id,
                        status: task.status === 'DONE' ? 'TODO' : 'DONE',
                      })
                    }
                    className="flex h-4 w-4 items-center justify-center rounded border border-muted-foreground/40 hover:border-primary transition-colors"
                  >
                    {task.status === 'DONE' && (
                      <div className="h-2 w-2 rounded-sm bg-primary" />
                    )}
                  </button>
                  <span
                    className={`text-sm flex-1 truncate ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.title}
                  </span>
                </div>
              ))
            )}
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs">
                {t('common.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 최근 노트 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              {t('dashboard.recentNotes')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noNotes')}</p>
            ) : (
              recentNotes.slice(0, 5).map((note: any) => (
                <Link
                  key={note.id}
                  href={`/notes`}
                  className="block rounded p-2 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {note.content?.slice(0, 60) || t('notes.noContent')}
                  </p>
                </Link>
              ))
            )}
            <Link href="/notes">
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs">
                {t('common.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Daily Briefing */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              {t('dashboard.briefingTitle')}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={() => generateBriefing()}
                disabled={isLoadingBriefing}
              >
                {isLoadingBriefing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-xs">↻</span>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBriefing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('dashboard.briefingLoading')}
              </div>
            ) : briefing ? (
              <p className="text-sm leading-relaxed">{briefing.briefingText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.briefingEmpty')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 빠른 링크 */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickLinks.map(({ href, label, icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
