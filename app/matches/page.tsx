'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GitCompareArrows,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import {
  MatchDecisionBadge,
  ConfidenceBadge,
} from '@/components/layout/status-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { matchService } from '@/lib/services';
import { ErrorState } from '@/components/layout/error-state';
import type { ProductMatch } from '@/types';

export default function MatchesPage() {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    matchService
      .getMatches()
      .then((m) => setMatches(m))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Coincidencias"
        description="Comparacion entre capturas y productos existentes en el catalogo."
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {matches.filter((m) => m.decision === 'PENDING').length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Aprobadas</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {matches.filter(
                (m) =>
                  m.decision === 'AUTO_APPROVED' ||
                  m.decision === 'HUMAN_APPROVED'
              ).length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">
                Requiere revision
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {matches.filter((m) => m.requiresHumanReview).length}
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState onRetry={load} />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Captura</TableHead>
                  <TableHead>Candidato</TableHead>
                  <TableHead className="text-center">Confianza</TableHead>
                  <TableHead>Razon principal</TableHead>
                  <TableHead className="text-center">Conflictos</TableHead>
                  <TableHead>Recomendacion</TableHead>
                  <TableHead>Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-5 animate-pulse rounded bg-muted/40" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Sin coincidencias registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Link
                          href={`/matches/${m.id}`}
                          className="font-medium hover:underline"
                        >
                          {m.captureTitle}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {m.captureSourceDomain}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.candidateTitle}
                      </TableCell>
                      <TableCell className="text-center">
                        <ConfidenceBadge confidence={m.confidencePercentage} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.matchReasons[0] ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {m.conflicts.length > 0 ? (
                          <span className="font-medium text-red-600">
                            {m.conflicts.length}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {m.recommendation}
                      </TableCell>
                      <TableCell>
                        <MatchDecisionBadge decision={m.decision} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
