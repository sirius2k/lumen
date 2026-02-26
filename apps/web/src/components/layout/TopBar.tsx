'use client';

import { useState } from 'react';
import { Search, Sparkles, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* 전체 검색 */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="전체 검색..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* AI 버튼 */}
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI에게 물어보기
        </Button>

        {/* 빠른 캡처 */}
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          빠른 캡처
        </Button>

        {/* 사용자 아바타 */}
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
