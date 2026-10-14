import type { Capture, ProductIdentifier, ProductImage } from '@/types';

export function normalizeIdentifier(value: string): string {
  return value.trim().replace(/[\s-]+/g, '').toUpperCase();
}

export function barcodeType(value: string): ProductIdentifier['identifierType'] {
  const normalized = normalizeIdentifier(value);
  if (!/^\d+$/.test(normalized)) return 'OTHER';
  return ({ 8: 'EAN_8', 12: 'UPC_A', 13: 'EAN_13', 14: 'GTIN_14' } as const)[normalized.length as 8 | 12 | 13 | 14] ?? 'OTHER';
}

export function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? value.trim() : null;
  } catch { return null; }
}

export function captureAssets(capture: Capture, productId: string, variantId: string, now: string) {
  const source = capture.sourceUrl || capture.sourceType;
  const values: [ProductIdentifier['identifierType'], string | null][] = [
    [barcodeType(capture.capturedUpc || ''), capture.capturedUpc],
    ['ASIN', capture.capturedAsin], ['MPN', capture.capturedMpn],
  ];
  const identifiers: ProductIdentifier[] = values.filter(([, value]) => value?.trim()).map(([type, value], index) => ({
    id: `${productId}_identifier_${index}`, productId, variantId,
    identifierType: type, identifierValue: value!.trim(), normalizedValue: normalizeIdentifier(value!),
    countryCode: null, source, verified: false, verificationStatus: 'UNVERIFIED',
    verificationNotes: null, isPrimary: index === 0, createdAt: now, updatedAt: now,
  }));
  const urls = Array.from(new Set(capture.capturedImages.map(safeWebUrl).filter((url): url is string => !!url)));
  const images: ProductImage[] = urls.map((url, index) => ({
    id: `${productId}_image_${index}`, productId, variantId,
    originalUrl: url, storageProvider: 'EXTERNAL_URL', storageFileId: null,
    storagePath: null, publicDeliveryUrl: null, mimeType: '', originalFilename: '',
    fileSizeBytes: null, width: null, height: null, sha256: null, perceptualHash: null,
    imageType: index === 0 ? 'MAIN' : 'ALTERNATE', displayOrder: index,
    altText: capture.capturedTitle, source, status: 'URL_CAPTURED', approved: false,
    generatedByAi: false, createdAt: now, updatedAt: now,
  }));
  return { identifiers, images };
}
