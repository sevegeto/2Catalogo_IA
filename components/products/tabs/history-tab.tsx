'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Props {
  productId: string;
}

export function ProductHistoryTab({ productId }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getLogs().then((all) => {
      setLogs(all.filter((l) => l.entityId === productId));
      setLoading(false);
    });
  }, [productId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Historial y auditoria ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted/40" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin eventos de auditoria para este producto.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accion</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {l.action}
                    </TableCell>
                    <TableCell className="text-sm">{l.entityType}</TableCell>
                    <TableCell className="text-sm">{l.userName ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.ipAddress ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString('es-MX')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
