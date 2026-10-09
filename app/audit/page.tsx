'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auditService } from '@/lib/services';
import type { AuditLog } from '@/types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getLogs().then((l) => {
      setLogs(l);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Auditoria"
        description="Registro de acciones realizadas en el sistema."
      />
      <div className="space-y-4 p-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accion</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Entidad ID</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 animate-pulse rounded bg-muted/40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {l.action}
                    </TableCell>
                    <TableCell className="text-sm">{l.entityType}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.entityId}
                    </TableCell>
                    <TableCell className="text-sm">{l.userName ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.ipAddress ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString('es-MX')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
