'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Package,
  GitCompareArrows,
  Copy,
  Barcode,
  ImageIcon,
  Store,
  AlertTriangle,
  Cpu,
  XCircle,
  Boxes,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService, productService, integrationService } from '@/lib/services';
import type { DashboardActivity, DashboardStats, Product } from '@/types';
import type { IntegrationConfig } from '@/lib/services';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  href: string;
  accent: string;
}

function StatCard({ label, value, icon: Icon, href, accent }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              accent
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </CardContent>
      </Card>
    </Link>
  );
}

const activityIcon: Record<DashboardActivity['type'], React.ElementType> = {
  CAPTURE: Camera,
  MATCH: GitCompareArrows,
  PRODUCT: Package,
  LISTING: Store,
  JOB: Cpu,
  INVENTORY: Boxes,
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date('2026-10-06T10:00:00Z');
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  const mins = Math.floor(diffMs / (1000 * 60));
  return `hace ${mins}m`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.getStats(), dashboardService.getActivity(), productService.getProducts(), integrationService.getAll()])
      .then(([s, a, p, ints]) => {
        setStats(s);
        setActivity(a);
        setProductCount(p.length);
        setIntegrations(ints);
      })
      .finally(() => setLoading(false));
  }, []);

  const sysInt = (id: string) => integrations.find((i) => i.id === id);
  const ollama = sysInt('ollama_worker');
  const sheets = sysInt('google_sheets');
  const ml = sysInt('mercadolibre');
  const drive = sysInt('google_drive');
  const chrome = sysInt('chrome_extension');

  const renderStatus = (int: IntegrationConfig | undefined, label: string, inactiveText: string) => {
    if (!int || (!int.enabled && !int.lastConnectedAt)) {
      return (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {inactiveText}
          </span>
        </div>
      );
    }
    if (int.enabled) {
      return (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Conectado
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-1.5 font-medium text-amber-600">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Inactivo
        </span>
      </div>
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Resumen general del estado del catalogo, capturas y trabajos."
      />

      <div className="space-y-6 p-6">
        {loading || !stats ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <StatCard
              label="Capturas nuevas"
              value={stats.newCaptures}
              icon={Camera}
              href="/captures"
              accent="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
            />
            <StatCard
              label="Sin identificar"
              value={stats.pendingIdentification}
              icon={Package}
              href="/products"
              accent="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
            />
            <StatCard
              label="Coincidencias pendientes"
              value={stats.pendingMatches}
              icon={GitCompareArrows}
              href="/matches"
              accent="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
            />
            <StatCard
              label="Posibles duplicados"
              value={stats.possibleDuplicates}
              icon={Copy}
              href="/duplicates"
              accent="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
            />
            <StatCard
              label="Sin UPC"
              value={stats.productsWithoutUpc}
              icon={Barcode}
              href="/products"
              accent="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            />
            <StatCard
              label="Sin imagenes"
              value={stats.productsWithoutImages}
              icon={ImageIcon}
              href="/images"
              accent="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
            />
            <StatCard
              label="Publicaciones activas"
              value={stats.activeListings}
              icon={Store}
              href="/listings"
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            />
            <StatCard
              label="Publicaciones con error"
              value={stats.listingsWithErrors}
              icon={AlertTriangle}
              href="/listings"
              accent="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            />
            <StatCard
              label="Trabajos pendientes"
              value={stats.pendingJobs}
              icon={Cpu}
              href="/jobs"
              accent="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"
            />
            <StatCard
              label="Trabajos fallidos"
              value={stats.failedJobs}
              icon={XCircle}
              href="/jobs"
              accent="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            />
            <StatCard
              label="Alertas de inventario"
              value={stats.inventoryAlerts}
              icon={Boxes}
              href="/inventory"
              accent="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
            />
            <StatCard
              label="Productos totales"
              value={productCount}
              icon={Package}
              href="/products"
              accent="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Actividad reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-md bg-muted/40"
                    />
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {activity.map((a) => {
                    const Icon = activityIcon[a.type] ?? Activity;
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm">{a.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.user} — {formatRelativeTime(a.timestamp)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado del sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderStatus(ollama, 'Worker Fedora/Ollama', 'No configurado')}
              {renderStatus(sheets, 'Sincronizacion Google Sheets', 'No configurada')}
              {renderStatus(ml, 'MercadoLibre - MITIENDOTA', 'No configurado')}
              {renderStatus(drive, 'Google Drive Storage', 'No configurado')}
              {renderStatus(chrome, 'Extension Chrome', 'No instalada')}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
