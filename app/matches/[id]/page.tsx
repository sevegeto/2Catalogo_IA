'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  X,
  GitMerge,
  PackagePlus,
  Clock,
  Cpu,
  Image as ImageIcon,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import {
  MatchDecisionBadge,
  ConfidenceBadge,
} from '@/components/layout/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { matchService, matchMutations } from '@/lib/services';
import type { ProductMatch } from '@/types';

interface PageProps {
  params: { id: string };
}

function CompareRow({
  label,
  captureValue,
  candidateValue,
}: {
  label: string;
  captureValue: string | null;
  candidateValue: string | null;
}) {
  const match =
    captureValue &&
    candidateValue &&
    captureValue.toLowerCase() === candidateValue.toLowerCase();
  const conflict =
    captureValue &&
    candidateValue &&
    captureValue.toLowerCase() !== candidateValue.toLowerCase();

  return (
    <div className="grid grid-cols-[180px_1fr_1fr] gap-2 border-b py-2 text-sm last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        {captureValue ?? <span className="text-muted-foreground">—</span>}
        {match && <Check className="h-3.5 w-3.5 text-emerald-500" />}
        {conflict && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
      </span>
      <span className="flex items-center gap-1.5">
        {candidateValue ?? <span className="text-muted-foreground">—</span>}
        {match && <Check className="h-3.5 w-3.5 text-emerald-500" />}
        {conflict && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
      </span>
    </div>
  );
}

export default function MatchDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [match, setMatch] = useState<ProductMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    matchService.getMatch(params.id)
      .then((m) => setMatch(m))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [params.id]);

  const handleAction = async (
    decision: ProductMatch['decision'],
    linkProduct: boolean = false,
  ) => {
    if (!match) return;
    setActing(true);
    try {
      await matchMutations.updateDecision(match.id, decision);
      if (linkProduct && match.candidateProductId) {
        await matchMutations.linkCaptureToProduct(match.captureId, match.candidateProductId, match.candidateVariantId);
      }
      router.push('/matches');
    } catch {
      setActing(false);
    }
  };

  if (error) {
    return (
      <AppShell>
        <PageHeader title="Error" />
        <div className="p-6">
          <ErrorState onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted/40" />
          <div className="h-64 w-full animate-pulse rounded bg-muted/40" />
        </div>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell>
        <PageHeader title="Coincidencia no encontrada" />
        <div className="p-6">
          <Link href="/matches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Volver a coincidencias
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isPending = match.decision === 'PENDING';

  return (
    <AppShell>
      <PageHeader
        title="Comparacion de coincidencia"
        description={`Captura ${match.captureId} vs producto ${match.candidateProductId}`}
        actions={
          <Link href="/matches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confianza:</span>
            <ConfidenceBadge confidence={match.confidencePercentage} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Decision:</span>
            <MatchDecisionBadge decision={match.decision} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Recomendacion:</span>
            <span className="font-mono text-xs font-medium">
              {match.recommendation}
            </span>
          </div>
          {match.requiresHumanReview && (
            <span className="flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Requiere revision humana
            </span>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comparacion lado a lado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[180px_1fr_1fr] gap-2 border-b pb-2 mb-2">
              <span className="text-xs font-bold text-muted-foreground">Campo</span>
              <span className="text-xs font-bold">Captura</span>
              <span className="text-xs font-bold">Candidato</span>
            </div>

            <div className="grid grid-cols-[180px_1fr_1fr] gap-2 border-b py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Imagen
              </span>
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                {match.captureImageUrl ? (
                  <img
                    src={match.captureImageUrl}
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                {match.candidateImageUrl ? (
                  <img
                    src={match.candidateImageUrl}
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            </div>

            <CompareRow label="Titulo" captureValue={match.captureTitle} candidateValue={match.candidateTitle} />
            <CompareRow label="Marca" captureValue={match.captureBrand} candidateValue={match.candidateBrand} />
            <CompareRow label="Modelo" captureValue={match.captureModel} candidateValue={match.candidateModel} />
            <CompareRow label="UPC" captureValue={match.captureUpc} candidateValue={match.candidateUpc} />
            <CompareRow label="Dominio origen" captureValue={match.captureSourceDomain} candidateValue={null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Desglose de puntuacion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
              {[
                { label: 'Identificador', value: match.identifierScore },
                { label: 'Marca', value: match.brandScore },
                { label: 'Modelo', value: match.modelScore },
                { label: 'Atributos', value: match.attributeScore },
                { label: 'Texto', value: match.textScore },
                { label: 'Imagen', value: match.imageScore },
                { label: 'IA', value: match.aiScore },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p
                    className={
                      'mt-1 text-xl font-bold ' +
                      (s.value >= 80
                        ? 'text-emerald-600'
                        : s.value >= 50
                          ? 'text-amber-600'
                          : 'text-red-600')
                    }
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                Evidencia positiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match.positiveEvidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin evidencia positiva.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {match.positiveEvidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Conflictos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match.conflicts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin conflictos detectados.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {match.conflicts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campos faltantes</CardTitle>
            </CardHeader>
            <CardContent>
              {match.missingFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No faltan campos.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {match.missingFields.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-4">
          <span className="text-sm font-medium mr-2">Acciones:</span>
          <Button
            size="sm"
            variant="default"
            disabled={acting || !isPending}
            onClick={() => handleAction('HUMAN_APPROVED', true)}
          >
            <Check className="mr-1.5 h-4 w-4" />
            Confirmar mismo producto
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acting || !isPending}
            onClick={() => handleAction('HUMAN_APPROVED', true)}
          >
            <GitMerge className="mr-1.5 h-4 w-4" />
            Confirmar misma variante
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acting || !isPending}
            onClick={() => handleAction('NEEDS_MORE_INFORMATION')}
          >
            <PackagePlus className="mr-1.5 h-4 w-4" />
            Crear variante nueva
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acting || !isPending}
            onClick={() => handleAction('NEEDS_MORE_INFORMATION')}
          >
            <PackagePlus className="mr-1.5 h-4 w-4" />
            Crear producto nuevo
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acting || !isPending}
            onClick={() => handleAction('NOT_SAME_PRODUCT')}
          >
            <X className="mr-1.5 h-4 w-4" />
            No son iguales
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acting || !isPending}
            onClick={() => handleAction('NEEDS_MORE_INFORMATION')}
          >
            <Cpu className="mr-1.5 h-4 w-4" />
            Solicitar analisis IA
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={acting || !isPending}
            onClick={() => handleAction('PENDING')}
          >
            <Clock className="mr-1.5 h-4 w-4" />
            Posponer
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
