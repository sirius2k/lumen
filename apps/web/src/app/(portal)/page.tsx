'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckSquare, FileText, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tasksApi, notesApi, aiApi } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = new Date();
  const dateStr = format(today, 'yyyy.MM.dd (EEE)', { locale: ko });

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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">
          안녕하세요, {user?.name}님 👋
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
              오늘 할일
              <Badge variant="secondary" className="ml-auto">
                {todayTasks.filter((t: any) => t.status !== 'DONE').length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">오늘 마감 태스크가 없습니다.</p>
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
                전체 보기 →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 최근 노트 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              최근 노트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 노트가 없습니다.</p>
            ) : (
              recentNotes.slice(0, 5).map((note: any) => (
                <Link
                  key={note.id}
                  href={`/notes`}
                  className="block rounded p-2 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {note.content?.slice(0, 60) || '내용 없음'}
                  </p>
                </Link>
              ))
            )}
            <Link href="/notes">
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs">
                전체 보기 →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Daily Briefing */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Daily Briefing
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
                브리핑 생성 중...
              </div>
            ) : briefing ? (
              <p className="text-sm leading-relaxed">{briefing.briefingText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                브리핑을 생성하려면 클릭하세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 빠른 링크 */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { href: '/knowledge', label: '지식 베이스', icon: '🧠', desc: '노트북 & AI 채팅' },
          { href: '/tasks', label: '태스크', icon: '✅', desc: '할일 관리' },
          { href: '/calendar', label: '캘린더', icon: '📅', desc: '일정 관리' },
          { href: '/bookmarks', label: '북마크', icon: '🔖', desc: 'URL 저장 & AI 요약' },
        ].map(({ href, label, icon, desc }) => (
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
