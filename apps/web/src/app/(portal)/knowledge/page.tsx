'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Brain, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { notebooksApi } from '@/lib/api/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function KnowledgePage() {
  const queryClient = useQueryClient();
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
            지식 베이스
          </h1>
          <p className="text-muted-foreground mt-1">
            문서를 업로드하고 AI와 대화하세요
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 노트북
        </Button>
      </div>

      {/* 새 노트북 생성 인라인 */}
      {isCreating && (
        <Card className="border-primary/50">
          <CardContent className="flex items-center gap-3 pt-4">
            <Input
              placeholder="노트북 제목..."
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
              만들기
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewTitle('');
              }}
            >
              취소
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
          <h3 className="text-lg font-medium mb-2">노트북이 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            첫 번째 노트북을 만들어 문서를 분석해보세요
          </p>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            새 노트북 만들기
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
                    <span>{notebook.sourceCount}개 소스</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notebook.updatedAt), 'MM/dd', { locale: ko })}
                  </span>
                </div>
                <Link href={`/knowledge/${notebook.id}`}>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    열기 →
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
