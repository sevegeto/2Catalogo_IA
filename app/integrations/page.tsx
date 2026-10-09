'use client';

import { Plug, Store, FileSpreadsheet, HardDrive, Chrome, Cpu } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Integration {
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'demo';
  statusLabel: string;
}

const integrations: Integration[] = [
  {
    name: 'MercadoLibre — MITIENDOTA',
    description: 'Sincronizacion de publicaciones, inventario y errores.',
    icon: Store,
    status: 'demo',
    statusLabel: 'Demo',
  },
  {
    name: 'Google Sheets',
    description: 'Interfaz operativa complementaria para revision masiva.',
    icon: FileSpreadsheet,
    status: 'disconnected',
    statusLabel: 'No configurado',
  },
  {
    name: 'Google Drive',
    description: 'Almacenamiento maestro de imagenes y documentos.',
    icon: HardDrive,
    status: 'disconnected',
    statusLabel: 'No configurado',
  },
  {
    name: 'Extension Chrome',
    description: 'Captura de productos desde paginas web.',
    icon: Chrome,
    status: 'disconnected',
    statusLabel: 'No instalada',
  },
  {
    name: 'Ollama Worker (Fedora)',
    description: 'Procesamiento local de IA para matching y contenido.',
    icon: Cpu,
    status: 'disconnected',
    statusLabel: 'Desconectado',
  },
];

const statusColor: Record<Integration['status'], string> = {
  connected: 'text-emerald-600',
  disconnected: 'text-muted-foreground',
  demo: 'text-amber-600',
};

const statusDot: Record<Integration['status'], string> = {
  connected: 'bg-emerald-500',
  disconnected: 'bg-slate-400',
  demo: 'bg-amber-500',
};

export default function IntegrationsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Integraciones"
        description="Conexiones con marketplaces, Google Workspace, Ollama y extension Chrome."
      />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {integrations.map((int) => {
            const Icon = int.icon;
            return (
              <Card key={int.name}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{int.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {int.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${statusDot[int.status]}`}
                      />
                      <span
                        className={`text-xs font-medium ${statusColor[int.status]}`}
                      >
                        {int.statusLabel}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled>
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
