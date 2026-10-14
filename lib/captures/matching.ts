import { normalizeIdentifier } from './import';
import type { Capture, Product, ProductIdentifier, ProductMatch } from '@/types';

const normalizeText = (value: string | null) => (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const barcodeTypes = ['UPC_A', 'UPC_E', 'EAN_8', 'EAN_13', 'GTIN_12', 'GTIN_13', 'GTIN_14'];
const barcode = (value: string) => {
  const normalized = normalizeIdentifier(value);
  return /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(normalized) ? normalized.padStart(14, '0') : '';
};

// Scores express deterministic evidence, not a calibrated probability or AI result.
export function findCaptureMatches(capture: Capture, products: Product[], identifiers: ProductIdentifier[], now: string): ProductMatch[] {
  const matches: ProductMatch[] = [];
  for (const product of products) {
    if (['ARCHIVED', 'REJECTED'].includes(product.status) || product.archivedAt) continue;
    const ids = identifiers.filter((id) => id.productId === product.id && id.verificationStatus !== 'REJECTED');
    const upcs = ids.filter((id) => barcodeTypes.includes(id.identifierType) && id.identifierType !== 'UPC_E').map((id) => barcode(id.identifierValue)).filter(Boolean);
    const asins = ids.filter((id) => id.identifierType === 'ASIN').map((id) => normalizeIdentifier(id.identifierValue));
    const captureUpc = barcode(capture.capturedUpc || '');
    const captureAsin = normalizeIdentifier(capture.capturedAsin || '');
    const upcMatch = !!captureUpc && upcs.includes(captureUpc);
    const asinMatch = !!captureAsin && asins.includes(captureAsin);
    const brandMatch = !!normalizeText(capture.capturedBrand) && normalizeText(capture.capturedBrand) === normalizeText(product.brandName);
    const modelMatch = !!normalizeText(capture.capturedModel) && normalizeText(capture.capturedModel) === normalizeText(product.model);
    if (!upcMatch && !asinMatch && !(brandMatch && modelMatch)) continue;
    const reasons = [upcMatch && 'UPC / EAN / GTIN exacto', asinMatch && 'ASIN exacto', brandMatch && modelMatch && 'Marca y modelo exactos'].filter((reason): reason is string => !!reason);
    const conflicts: string[] = [];
    if (normalizeText(capture.capturedBrand) && normalizeText(product.brandName) && !brandMatch) conflicts.push('Marca diferente');
    if (normalizeText(capture.capturedModel) && normalizeText(product.model) && !modelMatch) conflicts.push('Modelo diferente');
    if (captureUpc && upcs.length && !upcMatch) conflicts.push('UPC / EAN / GTIN diferente');
    if (captureAsin && asins.length && !asinMatch) conflicts.push('ASIN diferente');
    const score = conflicts.length ? 50 : upcMatch || asinMatch ? 100 : 80;
    matches.push({
      id: `match_${capture.id}_${product.id}`, captureId: capture.id, captureTitle: capture.capturedTitle,
      captureSourceDomain: capture.sourceDomain, captureUpc: capture.capturedUpc,
      captureBrand: capture.capturedBrand, captureModel: capture.capturedModel,
      captureImageUrl: capture.capturedImages[0] || null, candidateProductId: product.id,
      candidateVariantId: null, candidateTitle: product.titleMaster, candidateBrand: product.brandName || null,
      candidateModel: product.model || null, candidateUpc: ids.find((id) => barcodeTypes.includes(id.identifierType))?.identifierValue || null,
      candidateImageUrl: product.primaryImageUrl, totalScore: score, confidencePercentage: score,
      identifierScore: upcMatch || asinMatch ? 100 : 0, brandScore: brandMatch ? 100 : 0,
      modelScore: modelMatch ? 100 : 0, attributeScore: 0, textScore: 0, imageScore: 0, aiScore: 0,
      matchReasons: reasons, positiveEvidence: reasons, conflicts, missingFields: [],
      decision: 'PENDING', decisionSource: 'SYSTEM', reviewedBy: null, reviewedAt: null, createdAt: now,
      recommendation: conflicts.length ? 'NEEDS_HUMAN_REVIEW' : 'LINK_EXISTING_PRODUCT', requiresHumanReview: true,
    });
  }
  return matches.sort((a, b) => b.totalScore - a.totalScore || a.candidateProductId.localeCompare(b.candidateProductId));
}
