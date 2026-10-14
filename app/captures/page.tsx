'use client';

import { useEffect, useState } from 'react';
import { Camera, ExternalLink, PackagePlus, X, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { CaptureStatusBadge, ConfidenceBadge } from '@/components/layout/status-badges';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { captureService, captureMutations } from '@/lib/services';
import type { Capture } from '@/types';

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState<Capture | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    captureService.getCaptures()
      .then((c) => setCaptures(c))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePromote = async (capture: Capture) => {
    setActionError('');
    setPromoting(capture.id);
    setSelected(null);
    try {
      const product = await captureMutations.promoteToProduct(capture.id);
      if (product) {
        setPromoted((prev) => ({ ...prev, [capture.id]: product.id }));
        load();
      }
    } catch {
      setActionError('No se pudo crear el producto. Inténtalo de nuevo; no se duplicará si ya fue creado.');
    }
    setPromoting(null);
  };

  const handleDiscard = async (capture: Capture) => {
    setActionError('');
    setSelected(null);
    try {
      await captureMutations.updateCaptureStatus(capture.id, 'REJECTED');
      load();
    } catch (_e) {
      setActionError('No se pudo descartar la captura. Inténtalo de nuevo.');
    }
  };

  const canPromote = (c: Capture) =>
    c.status === 'RECEIVED' || c.status === 'NEW_PRODUCT_CANDIDATE' || c.status === 'NORMALIZING';

  return (
    <AppShell>
      <PageHeader
        title="Capturas"
        description="Informacion capturada por la extension, Sheets o importacion manual."
        actions={
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Actualizar
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
        {error ? (
          <ErrorState onRetry={load} />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-48">Titulo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>UPC / ASIN</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Confianza</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><div className="h-5 animate-pulse rounded bg-muted/40" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : captures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                      Sin capturas registradas. Usa la extension Chrome para capturar productos.
                    </TableCell>
                  </TableRow>
                ) : (
                  captures.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell>
                        {c.capturedImages[0] ? (
                          <img
                            src={c.capturedImages[0]}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-sm font-medium max-w-56">
                        <Link className="line-clamp-2 hover:underline" href={`/captures/${c.id}`}>{c.capturedTitle}</Link>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          {c.sourceDomain}
                          <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </span>
                      </TableCell>

                      <TableCell className="text-sm">{c.capturedBrand ?? '—'}</TableCell>

                      <TableCell className="font-mono text-xs">
                        {c.capturedUpc ? (
                          <span title="UPC">{c.capturedUpc}</span>
                        ) : c.capturedAsin ? (
                          <span title="ASIN" className="text-blue-600 dark:text-blue-400">{c.capturedAsin}</span>
                        ) : '—'}
                      </TableCell>

                      <TableCell className="text-right text-sm">
                        {c.capturedPrice
                          ? `${c.capturedCurrency ?? ''} ${c.capturedPrice.toFixed(2)}`
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

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(c.assignedProductId || promoted[c.id]) ? (
                            <Link href={`/products/${c.assignedProductId || promoted[c.id]}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600">
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Ver producto
                              </Button>
                            </Link>
                          ) : canPromote(c) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setSelected(c)}
                              disabled={promoting === c.id}
                            >
                              {promoting === c.id ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PackagePlus className="mr-1 h-3.5 w-3.5" />
                              )}
                              Crear producto
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Promotion confirmation modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" />
              Crear producto desde captura
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex gap-3">
                {selected.capturedImages[0] && (
                  <img
                    src={selected.capturedImages[0]}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg object-cover border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug">{selected.capturedTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selected.sourceDomain}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs">
                {selected.capturedBrand && (
                  <><span className="text-muted-foreground">Marca</span><span className="font-medium">{selected.capturedBrand}</span></>
                )}
                {selected.capturedModel && (
                  <><span className="text-muted-foreground">Modelo</span><span className="font-medium">{selected.capturedModel}</span></>
                )}
                {selected.capturedMpn && (
                  <><span className="text-muted-foreground">MPN</span><span className="font-mono">{selected.capturedMpn}</span></>
                )}
                {selected.capturedUpc && (
                  <><span className="text-muted-foreground">UPC</span><span className="font-mono">{selected.capturedUpc}</span></>
                )}
                {selected.capturedAsin && (
                  <><span className="text-muted-foreground">ASIN</span><span className="font-mono text-blue-600 dark:text-blue-400">{selected.capturedAsin}</span></>
                )}
                {selected.capturedPrice && (
                  <><span className="text-muted-foreground">Precio</span><span className="font-medium">{selected.capturedCurrency} {selected.capturedPrice.toFixed(2)}</span></>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {selected.capturedImages.slice(0, 5).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Se creara un borrador con una variante y SKU inicial, imágenes e identificadores pendientes de verificar. Podras completar el resto de la informacion desde la ficha del producto.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selected && handleDiscard(selected)}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Descartar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(null)}
            >
              <X className="mr-1.5 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => selected && handlePromote(selected)}
              disabled={!selected || promoting === selected.id}
            >
              {promoting === selected?.id ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="mr-1.5 h-4 w-4" />
              )}
              Crear borrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
