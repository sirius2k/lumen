'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Brain,
  FileText,
  CheckSquare,
  Calendar,
  Bookmark,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/knowledge', icon: Brain, label: '지식' },
  { href: '/notes', icon: FileText, label: '노트' },
  { href: '/tasks', icon: CheckSquare, label: '태스크' },
  { href: '/calendar', icon: Calendar, label: '캘린더' },
  { href: '/bookmarks', icon: Bookmark, label: '북마크' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* 로고 */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="text-xl font-bold text-sidebar-primary">◈</span>
        <span className="text-lg font-semibold">Lumen</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 영역 */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          설정
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>

      {/* 사용자 정보 */}
      {user && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
