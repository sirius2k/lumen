'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bookmark, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bookmarksApi } from '@/lib/api/client';

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', filterUnread],
    queryFn: () => bookmarksApi.list(filterUnread ? { isRead: false } : undefined),
  });

  const createBookmark = useMutation({
    mutationFn: bookmarksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setNewUrl('');
      setIsAdding(false);
    },
  });

  const updateBookmark = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bookmarksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const deleteBookmark = useMutation({
    mutationFn: bookmarksApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const handleAddBookmark = () => {
    if (!newUrl.trim()) return;
    createBookmark.mutate({ url: newUrl.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-primary" />
          북마크
        </h1>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          URL 추가
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <Button
          variant={!filterUnread ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterUnread(false)}
        >
          전체
        </Button>
        <Button
          variant={filterUnread ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterUnread(true)}
        >
          미읽음
        </Button>
      </div>

      {/* URL 추가 입력 */}
      {isAdding && (
        <Card className="border-primary/50">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Input
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
              autoFocus
              className="flex-1"
            />
            <Button
              onClick={handleAddBookmark}
              disabled={!newUrl.trim() || createBookmark.isPending}
            >
              {createBookmark.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  AI 요약 중...
                </>
              ) : (
                '추가'
              )}
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>취소</Button>
          </CardContent>
        </Card>
      )}

      {/* 북마크 그리드 */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Bookmark className="h-12 w-12 mb-4 opacity-50" />
          <p className="font-medium">저장된 북마크가 없습니다</p>
          <p className="text-sm mt-1">URL을 추가하면 AI가 자동으로 요약해드립니다</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark: any) => (
            <Card
              key={bookmark.id}
              className="group hover:border-primary/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  {bookmark.favicon ? (
                    <img
                      src={bookmark.favicon}
                      alt=""
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                    />
                  ) : (
                    <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                    >
                      {bookmark.title}
                    </a>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {new URL(bookmark.url).hostname}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteBookmark.mutate(bookmark.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {bookmark.aiSummary && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                    {bookmark.aiSummary}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {bookmark.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {bookmark.tags.map((tag: any) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] py-0">
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() =>
                      updateBookmark.mutate({
                        id: bookmark.id,
                        data: { isRead: !bookmark.isRead },
                      })
                    }
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {bookmark.isRead ? '읽음 ✓' : '미읽음'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
