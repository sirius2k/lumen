'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Brain, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { notebooksApi } from '@/lib/api/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/i18n.context';
import { getDateLocale } from '@/i18n/dateLocale';

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: notebooksApi.list,
  });

  const createNotebook = useMutation({
    mutationFn: notebooksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setIsCreating(false);
      setNewTitle('');
    },
  });

  const deleteNotebook = useMutation({
    mutationFn: notebooksApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks'] }),
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createNotebook.mutate({ title: newTitle.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            {t('knowledge.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('knowledge.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('knowledge.newNotebook')}
        </Button>
      </div>

      {/* 새 노트북 생성 인라인 */}
      {isCreating && (
        <Card className="border-primary/50">
          <CardContent className="flex items-center gap-3 pt-4">
            <Input
              placeholder={t('knowledge.notebookPlaceholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="flex-1"
            />
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || createNotebook.isPending}
            >
              {t('knowledge.create')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewTitle('');
              }}
            >
              {t('knowledge.cancel')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 노트북 그리드 */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : notebooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('knowledge.empty')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('knowledge.emptyHint')}
          </p>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('knowledge.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((notebook: any) => (
            <Card
              key={notebook.id}
              className="group hover:border-primary/50 transition-colors cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{notebook.title}</CardTitle>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteNotebook.mutate(notebook.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {notebook.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notebook.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{t('knowledge.sources', { count: notebook.sourceCount })}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notebook.updatedAt), 'MM/dd', { locale: getDateLocale(locale) })}
                  </span>
                </div>
                <Link href={`/knowledge/${notebook.id}`}>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    {t('knowledge.open')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
