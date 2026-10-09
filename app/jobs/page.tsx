'use client';

import { useEffect, useState } from 'react';
import {
  RotateCcw,
  XCircle,
  Clock,
  Code2,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { JobStatusBadge } from '@/components/layout/status-badges';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { jobService } from '@/lib/services';
import type { Job } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    jobService.getJobs().then((j) => {
      setJobs(j);
      setLoading(false);
    });
  }, []);

  const filtered = jobs.filter(
    (j) => statusFilter === 'ALL' || j.status === statusFilter
  );

  const jobTypeLabel: Record<string, string> = {
    NORMALIZE_PRODUCT: 'Normalizar producto',
    MATCH_PRODUCT: 'Buscar coincidencias',
    DETECT_DUPLICATES: 'Detectar duplicados',
    GENERATE_EMBEDDING: 'Generar embedding',
    COMPARE_IMAGES: 'Comparar imagenes',
    IMPROVE_TITLE: 'Mejorar titulo',
    IMPROVE_DESCRIPTION: 'Mejorar descripcion',
    GENERATE_MARKETPLACE_CONTENT: 'Generar contenido marketplace',
    DOWNLOAD_IMAGE: 'Descargar imagen',
    PROCESS_IMAGE: 'Procesar imagen',
    SYNC_GOOGLE_SHEETS: 'Sincronizar Google Sheets',
    SYNC_MARKETPLACE_LISTINGS: 'Sincronizar publicaciones',
    AUDIT_LISTING: 'Auditar publicacion',
    FIND_MISSING_IDENTIFIERS: 'Buscar identificadores faltantes',
  };

  return (
    <AppShell>
      <PageHeader
        title="Trabajos"
        description="Cola de trabajos para procesamiento nocturno y worker de IA."
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {jobs.filter((j) => j.status === 'PENDING').length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Completados</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {jobs.filter((j) => j.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Fallidos</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {jobs.filter((j) => j.status === 'FAILED').length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{jobs.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
              <SelectItem value="FAILED">Fallido</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Prioridad</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead className="text-center">Intentos</TableHead>
                <TableHead>Programado</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 animate-pulse rounded bg-muted/40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                filtered.map((j) => (
                  <TableRow key={j.id} className="hover:bg-muted/40">
                    <TableCell className="text-sm font-medium">
                      {jobTypeLabel[j.jobType] ?? j.jobType}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.entityLabel ?? '—'}
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={j.status} />
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {j.priority}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {j.assignedWorker ?? '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {j.attempts}/{j.maxAttempts}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(j.scheduledAt).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.startedAt
                        ? new Date(j.startedAt).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.completedAt
                        ? new Date(j.completedAt).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-red-600 max-w-32 truncate">
                      {j.errorMessage ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedJob(j)}
                          aria-label="Ver detalle"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                        </Button>
                        {(j.status === 'FAILED' || j.status === 'CANCELLED') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            aria-label="Reintentar"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {j.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            aria-label="Cancelar"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedJob
                ? jobTypeLabel[selectedJob.jobType] ?? selectedJob.jobType
                : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">ID</span>
                  <p className="font-mono text-xs">{selectedJob.id}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <div className="mt-0.5">
                    <JobStatusBadge status={selectedJob.status} />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Worker</span>
                  <p className="font-mono text-xs">
                    {selectedJob.assignedWorker ?? '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Intentos
                  </span>
                  <p>
                    {selectedJob.attempts} / {selectedJob.maxAttempts}
                  </p>
                </div>
              </div>

              {selectedJob.errorMessage && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  <p className="font-medium">Error:</p>
                  <p className="mt-1">{selectedJob.errorMessage}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Payload
                </p>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto font-mono">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>

              {selectedJob.result && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Resultado
                  </p>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
