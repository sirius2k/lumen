'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckSquare, Circle, CheckCircle2, Trash2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tasksApi, projectsApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/i18n.context';
import { getDateLocale } from '@/i18n/dateLocale';

type FilterType = 'ALL' | 'TODAY' | 'TODO' | 'DONE';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  const queryParams = {
    status: filter === 'TODO' || filter === 'DONE' ? filter : undefined,
    today: filter === 'TODAY' ? true : undefined,
  };

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', filter],
    queryFn: () => tasksApi.list(queryParams),
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTaskTitle('');
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      title: newTaskTitle.trim(),
      projectId: selectedProjectId,
    });
  };

  const toggleTaskStatus = (task: any) => {
    updateTask.mutate({
      id: task.id,
      data: { status: task.status === 'DONE' ? 'TODO' : 'DONE' },
    });
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'ALL', label: t('tasks.filterAll') },
    { value: 'TODAY', label: t('tasks.filterToday') },
    { value: 'TODO', label: t('tasks.filterTodo') },
    { value: 'DONE', label: t('tasks.filterDone') },
  ];

  // 프로젝트별 그룹화
  const tasksByProject = tasks.reduce((acc: Record<string, any[]>, task: any) => {
    const key = task.projectId || 'none';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          {t('tasks.title')}
        </h1>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2">
        {filters.map(({ value, label }) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 새 태스크 입력 */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-4 pb-4">
          <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder={t('tasks.addPlaceholder')}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
            className="flex-1 border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
          />
          {projects.length > 0 && (
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
              className="text-xs border border-input rounded px-2 py-1 bg-background"
            >
              <option value="">{t('tasks.noProject')}</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
            {t('tasks.addButton')}
          </Button>
        </CardContent>
      </Card>

      {/* 태스크 목록 */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
          <p className="font-medium">{t('tasks.empty')}</p>
          <p className="text-sm mt-1">{t('tasks.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
            const project = projects.find((p: any) => p.id === projectId);
            return (
              <div key={projectId}>
                {projectId !== 'none' && project && (
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{project.name}</span>
                  </div>
                )}
                <div className="space-y-2">
                  {projectTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/30 transition-colors"
                    >
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {task.status === 'DONE' ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            task.status === 'DONE' && 'line-through text-muted-foreground',
                          )}
                        >
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ~{format(new Date(task.dueDate), 'MM/dd (EEE)', { locale: getDateLocale(locale) })}
                          </p>
                        )}
                      </div>

                      {task.status === 'IN_PROGRESS' && (
                        <Badge variant="secondary" className="text-xs">{t('tasks.inProgress')}</Badge>
                      )}

                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
