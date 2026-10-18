'use client';

import { Search, Sun, Moon, Bell, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/layout/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { status, user, role, signOut } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto, SKU, UPC, ASIN..."
          className="pl-9 h-9 bg-muted/50 border-0"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        {status === 'ready' ? (
          <div className="ml-2 flex items-center gap-2 border-l pl-3">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:inline" title={user?.email ?? ''}>
              {user?.email}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase">{role}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => void signOut()}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
