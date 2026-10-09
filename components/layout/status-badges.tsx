import { cn } from '@/lib/utils';
import type {
  CaptureStatus,
  ImageStatus,
  JobStatus,
  ListingStatus,
  MatchDecision,
  ProductStatus,
  VerificationStatus,
} from '@/types';

type BadgeColor =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

const badgeStyles: Record<BadgeColor, string> = {
  default: 'bg-muted text-muted-foreground',
  success:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function Badge({
  label,
  color,
  className,
}: {
  label: string;
  color: BadgeColor;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        badgeStyles[color],
        className
      )}
    >
      {label}
    </span>
  );
}

// ---- Product Status ----

const productStatusMap: Record<ProductStatus, { color: BadgeColor; label: string }> = {
  DRAFT: { color: 'neutral', label: 'Borrador' },
  ACTIVE: { color: 'success', label: 'Activo' },
  IN_REVIEW: { color: 'warning', label: 'En revision' },
  ARCHIVED: { color: 'neutral', label: 'Archivado' },
  REJECTED: { color: 'error', label: 'Rechazado' },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const m = productStatusMap[status];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Capture Status ----

const captureStatusMap: Record<CaptureStatus, { color: BadgeColor; label: string }> = {
  RECEIVED: { color: 'info', label: 'Recibida' },
  NORMALIZING: { color: 'info', label: 'Normalizando' },
  MATCHING: { color: 'info', label: 'Buscando' },
  POSSIBLE_MATCH: { color: 'warning', label: 'Posible coincidencia' },
  MATCHED: { color: 'success', label: 'Coincidencia' },
  NEW_PRODUCT_CANDIDATE: { color: 'warning', label: 'Nuevo candidato' },
  NEEDS_REVIEW: { color: 'warning', label: 'Requiere revision' },
  REJECTED: { color: 'error', label: 'Rechazada' },
  COMPLETED: { color: 'success', label: 'Completada' },
  ERROR: { color: 'error', label: 'Error' },
};

export function CaptureStatusBadge({ status }: { status: CaptureStatus }) {
  const m = captureStatusMap[status];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Match Decision ----

const matchDecisionMap: Record<MatchDecision, { color: BadgeColor; label: string }> = {
  PENDING: { color: 'warning', label: 'Pendiente' },
  AUTO_APPROVED: { color: 'success', label: 'Auto-aprobado' },
  HUMAN_APPROVED: { color: 'success', label: 'Aprobado' },
  REJECTED: { color: 'error', label: 'Rechazado' },
  NOT_SAME_PRODUCT: { color: 'neutral', label: 'No es el mismo' },
  NEEDS_MORE_INFORMATION: { color: 'warning', label: 'Falta informacion' },
};

export function MatchDecisionBadge({ decision }: { decision: MatchDecision }) {
  const m = matchDecisionMap[decision];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Listing Status ----

const listingStatusMap: Record<ListingStatus, { color: BadgeColor; label: string }> = {
  ACTIVE: { color: 'success', label: 'Activa' },
  PAUSED: { color: 'warning', label: 'Pausada' },
  CLOSED: { color: 'neutral', label: 'Cerrada' },
  DRAFT: { color: 'neutral', label: 'Borrador' },
  ERROR: { color: 'error', label: 'Error' },
  UNDER_REVIEW: { color: 'warning', label: 'En revision' },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const m = listingStatusMap[status];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Job Status ----

const jobStatusMap: Record<JobStatus, { color: BadgeColor; label: string }> = {
  PENDING: { color: 'neutral', label: 'Pendiente' },
  CLAIMED: { color: 'info', label: 'Reclamado' },
  RUNNING: { color: 'info', label: 'En ejecucion' },
  COMPLETED: { color: 'success', label: 'Completado' },
  FAILED: { color: 'error', label: 'Fallido' },
  CANCELLED: { color: 'neutral', label: 'Cancelado' },
  TIMEOUT: { color: 'error', label: 'Timeout' },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const m = jobStatusMap[status];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Verification Status ----

const verificationStatusMap: Record<VerificationStatus, { color: BadgeColor; label: string }> = {
  UNVERIFIED: { color: 'neutral', label: 'Sin verificar' },
  VERIFIED: { color: 'success', label: 'Verificado' },
  CONFLICT: { color: 'error', label: 'Conflicto' },
  REJECTED: { color: 'error', label: 'Rechazado' },
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const m = verificationStatusMap[status];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Image Status ----

const imageStatusMap: Record<ImageStatus, { color: BadgeColor; label: string }> = {
  URL_CAPTURED: { color: 'neutral', label: 'URL capturada' },
  QUEUED: { color: 'info', label: 'En cola' },
  DOWNLOADING: { color: 'info', label: 'Descargando' },
  DOWNLOADED: { color: 'info', label: 'Descargada' },
  PROCESSING: { color: 'info', label: 'Procesando' },
  READY: { color: 'success', label: 'Lista' },
  REJECTED: { color: 'error', label: 'Rechazada' },
  ERROR: { color: 'error', label: 'Error' },
};

export function ImageStatusBadge({ status }: { status: ImageStatus }) {
  const m = imageStatusMap[status];
  return <Badge label={m.label} color={m.color} />;
}

// ---- Confidence Badge ----

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color: BadgeColor =
    confidence >= 95 ? 'success' : confidence >= 80 ? 'warning' : 'error';
  return <Badge label={`${confidence.toFixed(1)}%`} color={color} />;
}
