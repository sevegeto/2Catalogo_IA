'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { CaptureStatusBadge, ConfidenceBadge } from '@/components/layout/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { captureService, captureMutations, matchService } from '@/lib/services';
import { safeWebUrl } from '@/lib/captures/import';
import type { Capture, ProductMatch } from '@/types';

export default function CaptureDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [capture, setCapture] = useState<Capture | null>(null);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const loadRequest = useRef(0);
  const load = useCallback(() => {
    const request = ++loadRequest.current;
    setLoading(true);
    setLoadError(false);
    return Promise.all([captureService.getCapture(params.id), matchService.getMatchesByCapture(params.id)])
      .then(([c, m]) => { if (request === loadRequest.current) { setCapture(c); setMatches(m); } })
      .catch(() => { if (request === loadRequest.current) setLoadError(true); })
      .finally(() => { if (request === loadRequest.current) setLoading(false); });
  }, [params.id]);
  const cancelLoad = useCallback(() => { loadRequest.current++; }, []);
  useEffect(() => { void load(); return cancelLoad; }, [load, cancelLoad]);

  const promote = async () => {
    if (!capture) return;
    setActing(true);
    setActionError('');
    try {
      const product = await captureMutations.promoteToProduct(capture.id);
      if (product) router.push(`/products/${product.id}`);
    } catch {
      setActionError('No se pudo crear el producto. Inténtalo de nuevo; los reintentos reutilizan el producto creado.');
    } finally { setActing(false); }
  };
  const processMatches = async () => {
    if (!capture) return;
    setActing(true);
    setActionError('');
    try { await captureMutations.processMatches(capture.id); await load(); }
    catch { setActionError('No se pudieron buscar coincidencias. Inténtalo de nuevo.'); }
    finally { setActing(false); }
  };

  const sourceUrl = capture ? safeWebUrl(capture.sourceUrl) : null;
  const canAct = capture && !capture.assignedProductId && !['REJECTED', 'COMPLETED', 'MATCHED'].includes(capture.status);
  return (
    <AppShell>
      <PageHeader title={capture?.capturedTitle || 'Detalle de captura'} description="Revisa la información de origen antes de crear o enlazar un producto."
        actions={<Link href="/captures"><Button variant="outline" size="sm">Volver a capturas</Button></Link>} />
      <div className="space-y-4 p-6">
        {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
        {loadError ? <ErrorState onRetry={load} /> : loading ? <p role="status">Cargando captura…</p> : !capture ? <p>Captura no encontrada.</p> : <>
          <div className="flex flex-wrap items-center gap-3">
            <CaptureStatusBadge status={capture.status} />
            {capture.bestMatchConfidence !== null && <ConfidenceBadge confidence={capture.bestMatchConfidence} />}
            {capture.assignedProductId ? <Link href={`/products/${capture.assignedProductId}`}><Button size="sm">Ver producto</Button></Link> : canAct && <>
              <Button size="sm" onClick={promote} disabled={acting}>{acting ? 'Procesando…' : 'Crear borrador con imágenes e identificadores'}</Button>
              <Button size="sm" variant="outline" onClick={processMatches} disabled={acting}>Buscar coincidencias</Button>
            </>}
          </div>
          <Card><CardHeader><CardTitle className="text-sm">Datos capturados</CardTitle></CardHeader><CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['Marca', capture.capturedBrand], ['Modelo', capture.capturedModel], ['MPN', capture.capturedMpn],
                ['UPC / EAN / GTIN', capture.capturedUpc], ['ASIN', capture.capturedAsin],
                ['Precio', capture.capturedPrice !== null ? `${capture.capturedCurrency || ''} ${capture.capturedPrice.toFixed(2)}` : null],
                ['Origen', capture.sourceDomain], ['Tipo de origen', capture.sourceType],
                ['Referencia externa', capture.externalReference], ['Fecha', new Date(capture.capturedAt).toLocaleString('es-MX')],
              ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm">{value || '—'}</dd></div>)}
            </dl>
            {sourceUrl && <a className="mt-4 block break-all text-sm text-primary underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">Ver página de origen</a>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Descripción completa</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap break-words text-sm">{capture.capturedDescription || 'Sin descripción.'}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Atributos</CardTitle></CardHeader><CardContent>
            {Object.keys(capture.capturedAttributes).length ? <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(capture.capturedAttributes).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{key}</dt><dd className="break-words text-sm">{String(value)}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Sin atributos.</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Imágenes ({capture.capturedImages.length})</CardTitle></CardHeader><CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{capture.capturedImages.map((value, index) => {
              const url = safeWebUrl(value);
              return url ? <a key={`${url}_${index}`} href={url} target="_blank" rel="noopener noreferrer" className="rounded-md border p-2"><Image unoptimized src={url} alt={`${capture.capturedTitle} — imagen ${index + 1}`} width={400} height={400} className="h-64 w-full object-contain" /><span className="mt-2 block text-xs text-primary">Abrir imagen completa {index + 1}</span></a> : null;
            })}</div>
            {!capture.capturedImages.length && <p className="text-sm text-muted-foreground">Sin imágenes capturadas.</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Coincidencias para revisar</CardTitle></CardHeader><CardContent>
            {matches.length ? <ul className="space-y-3">{matches.map((match) => <li key={match.id} className="flex flex-wrap items-center gap-3"><Link className="text-sm text-primary underline" href={`/matches/${match.id}`}>{match.candidateTitle}</Link><ConfidenceBadge confidence={match.confidencePercentage} /><span className="text-xs text-muted-foreground">{match.matchReasons.join(' · ')}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Sin coincidencias registradas.</p>}
            {matches.length > 0 && canAct && <p className="mt-3 text-xs text-muted-foreground">Revisa las coincidencias antes de crear un producto adicional.</p>}
          </CardContent></Card>
          {capture.rawPayload && <details className="rounded-lg border p-4"><summary className="cursor-pointer text-sm">Datos originales de la captura</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(capture.rawPayload, null, 2)}</pre></details>}
        </>}
      </div>
    </AppShell>
  );
}
