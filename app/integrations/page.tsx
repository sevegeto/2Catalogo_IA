'use client';

import { useEffect, useState } from 'react';
import {
  Store, FileSpreadsheet, HardDrive, Chrome, Cpu,
  RefreshCw, Loader2, Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { integrationService, type IntegrationConfig } from '@/lib/services';

const iconMap: Record<string, React.ElementType> = {
  mercadolibre: Store,
  google_sheets: FileSpreadsheet,
  google_drive: HardDrive,
  chrome_extension: Chrome,
  ollama_worker: Cpu,
};

const categoryLabel: Record<string, string> = {
  marketplace: 'Marketplace',
  sheets: 'Hojas de calculo',
  storage: 'Almacenamiento',
  extension: 'Captura',
  ai_worker: 'IA local',
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    integrationService.getAll().then((ints) => {
      setIntegrations(ints);
      setLoading(false);
    });
  }, []);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await integrationService.testConnection(id);
      setTestResult((prev) => ({ ...prev, [id]: result }));
      const updated = await integrationService.getAll();
      setIntegrations(updated);
    } catch (_e) {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, message: 'Error de conexion' } }));
    }
    setTestingId(null);
  };

  return (
    <AppShell>
      <PageHeader
        title="Integraciones"
        description="Conexiones con marketplaces, Google Workspace, Ollama y extension Chrome."
        actions={
          <Link href="/settings">
            <Button size="sm" variant="outline">
              <SettingsIcon className="mr-1.5 h-4 w-4" />
              Configurar
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {integrations.map((int) => {
              const Icon = iconMap[int.id] ?? Store;
              return (
                <Card key={int.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{int.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {categoryLabel[int.category] ?? int.category}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${int.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`}
                            />
                            <span
                              className={`text-xs font-medium ${int.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`}
                            >
                              {int.enabled ? 'Conectado' : 'No configurado'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={int.enabled ? 'default' : 'secondary'}>
                        {int.enabled ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    {int.lastConnectedAt && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Ultima conexion: {new Date(int.lastConnectedAt).toLocaleString('es-MX')}
                      </p>
                    )}
                    {int.lastError && (
                      <p className="mt-1 text-xs text-red-600">
                        Error: {int.lastError}
                      </p>
                    )}
                    {testResult[int.id] && (
                      <div
                        className={`mt-3 rounded-md p-2 text-xs ${
                          testResult[int.id].success
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        }`}
                      >
                        {testResult[int.id].message}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 border-t pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(int.id)}
                        disabled={testingId === int.id}
                      >
                        {testingId === int.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Probar
                      </Button>
                      <Link href="/settings">
                        <Button size="sm" variant="ghost">
                          <SettingsIcon className="mr-1.5 h-3.5 w-3.5" />
                          Configurar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
