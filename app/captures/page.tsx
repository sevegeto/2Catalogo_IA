'use client';

import { useEffect, useState } from 'react';
import { Camera, ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { CaptureStatusBadge, ConfidenceBadge } from '@/components/layout/status-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { captureService } from '@/lib/services';
import type { Capture } from '@/types';

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    captureService.getCaptures().then((c) => {
      setCaptures(c);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Capturas"
        description="Informacion capturada por extension, Sheets o importacion manual."
      />
      <div className="space-y-4 p-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="min-w-48">Titulo capturado</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>UPC</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Confianza</TableHead>
                <TableHead>Recomendacion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 animate-pulse rounded bg-muted/40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                captures.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell>
                      {c.capturedImages[0] ? (
                        <img
                          src={c.capturedImages[0]}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {c.capturedTitle}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-1">
                        {c.sourceDomain}
                        <a
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.capturedUpc ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">{c.capturedBrand ?? '—'}</TableCell>
                    <TableCell className="text-right text-sm">
                      {c.capturedPrice
                        ? `${c.capturedCurrency} ${c.capturedPrice.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.capturedAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <CaptureStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {c.bestMatchConfidence != null ? (
                        <ConfidenceBadge confidence={c.bestMatchConfidence} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.bestMatchRecommendation ?? '—'}
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
