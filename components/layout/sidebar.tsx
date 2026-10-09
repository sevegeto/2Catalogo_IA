'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Camera,
  Package,
  GitCompareArrows,
  Copy,
  Store,
  Warehouse,
  Building2,
  Truck,
  Image as ImageIcon,
  Cpu,
  Plug,
  ScrollText,
  Settings,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Capturas', href: '/captures', icon: Camera, badge: 3 },
  { label: 'Productos', href: '/products', icon: Package },
  { label: 'Coincidencias', href: '/matches', icon: GitCompareArrows, badge: 1 },
  { label: 'Duplicados', href: '/duplicates', icon: Copy },
  { label: 'Publicaciones', href: '/listings', icon: Store },
  { label: 'Inventario', href: '/inventory', icon: Boxes },
  { label: 'Almacenes', href: '/warehouses', icon: Warehouse },
  { label: 'Proveedores', href: '/suppliers', icon: Truck },
  { label: 'Imagenes', href: '/images', icon: ImageIcon },
  { label: 'Trabajos', href: '/jobs', icon: Cpu, badge: 2 },
  { label: 'Integraciones', href: '/integrations', icon: Plug },
  { label: 'Auditoria', href: '/audit', icon: ScrollText },
  { label: 'Configuracion', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Boxes className="h-5 w-5" />
        </div>
        <span className="text-base font-bold tracking-tight">CatalogAI</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted-foreground/15 text-muted-foreground'
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium">Administrador Demo</p>
            <p className="truncate text-xs text-muted-foreground">
              admin@catalogai.local
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
