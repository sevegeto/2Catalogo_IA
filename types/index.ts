// ============================================================
// CatalogAI - Core Domain Types
// ============================================================

// ---- Users & Roles ----

export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'CATALOG_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'REVIEWER'
  | 'OPERATOR'
  | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Brands ----

export type BrandStatus = 'ACTIVE' | 'INACTIVE' | 'MERGED';

export interface Brand {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- Categories ----

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string;
  active: boolean;
}

export interface ProductCategoryAssignment {
  productId: string;
  categoryId: string;
  isPrimary: boolean;
}

// ---- Products ----

export type ProductCondition = 'NEW' | 'USED' | 'REFURBISHED' | 'OPEN_BOX';
export type ProductStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'IN_REVIEW'
  | 'ARCHIVED'
  | 'REJECTED';

export interface Product {
  id: string;
  internalProductNumber: string;
  titleMaster: string;
  normalizedTitle: string;
  descriptionMaster: string;
  brandId: string;
  brandName: string;
  model: string;
  manufacturer: string;
  productType: string;
  condition: ProductCondition;
  status: ProductStatus;
  launchDate: string | null;
  taxProductCode: string | null;
  taxUnitCode: string | null;
  taxObjectCode: string | null;
  defaultVariantId: string | null;
  primaryImageUrl: string | null;
  variantCount: number;
  totalInventory: number;
  listingCount: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

// ---- Variants ----

export interface ProductVariant {
  id: string;
  productId: string;
  internalSku: string;
  skuAlias: string;
  variantName: string;
  color: string | null;
  size: string | null;
  material: string | null;
  capacity: string | null;
  packageQuantity: number | null;
  unitOfMeasure: string | null;
  packageWeightGrams: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
  purchaseCost: number | null;
  retailPrice: number | null;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Identifiers ----

export type IdentifierType =
  | 'UPC_A'
  | 'UPC_E'
  | 'EAN_8'
  | 'EAN_13'
  | 'GTIN_12'
  | 'GTIN_13'
  | 'GTIN_14'
  | 'ISBN'
  | 'ASIN'
  | 'MPN'
  | 'MANUFACTURER_CODE'
  | 'SUPPLIER_CODE'
  | 'INTERNAL_BARCODE'
  | 'OTHER';

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'VERIFIED'
  | 'CONFLICT'
  | 'REJECTED';

export interface ProductIdentifier {
  id: string;
  productId: string;
  variantId: string | null;
  identifierType: IdentifierType;
  identifierValue: string;
  normalizedValue: string;
  countryCode: string | null;
  source: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationNotes: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Aliases ----

export interface ProductAlias {
  id: string;
  productId: string;
  variantId: string | null;
  alias: string;
  normalizedAlias: string;
  language: string;
  source: string;
  active: boolean;
  createdAt: string;
}

// ---- Captures ----

export type CaptureSourceType =
  | 'CHROME_EXTENSION'
  | 'GOOGLE_SHEETS'
  | 'MANUAL'
  | 'FILE_IMPORT'
  | 'API';

export type CaptureStatus =
  | 'RECEIVED'
  | 'NORMALIZING'
  | 'MATCHING'
  | 'POSSIBLE_MATCH'
  | 'MATCHED'
  | 'NEW_PRODUCT_CANDIDATE'
  | 'NEEDS_REVIEW'
  | 'REJECTED'
  | 'COMPLETED'
  | 'ERROR';

export interface Capture {
  id: string;
  sourceType: CaptureSourceType;
  sourceUrl: string;
  sourceDomain: string;
  externalReference: string | null;
  capturedTitle: string;
  capturedDescription: string;
  capturedBrand: string | null;
  capturedModel: string | null;
  capturedMpn: string | null;
  capturedUpc: string | null;
  capturedAsin: string | null;
  capturedPrice: number | null;
  capturedCurrency: string | null;
  capturedAttributes: Record<string, string>;
  capturedImages: string[];
  rawPayload: Record<string, unknown> | null;
  status: CaptureStatus;
  assignedProductId: string | null;
  assignedVariantId: string | null;
  bestMatchProductId: string | null;
  bestMatchConfidence: number | null;
  bestMatchRecommendation: MatchRecommendation | null;
  capturedBy: string | null;
  capturedAt: string;
  processedAt: string | null;
}

// ---- Matching ----

export type MatchRecommendation =
  | 'LINK_EXISTING_PRODUCT'
  | 'LINK_EXISTING_VARIANT'
  | 'CREATE_NEW_PRODUCT'
  | 'CREATE_NEW_VARIANT'
  | 'POSSIBLE_DUPLICATE'
  | 'NEEDS_HUMAN_REVIEW'
  | 'REJECT_CAPTURE';

export type MatchDecision =
  | 'PENDING'
  | 'AUTO_APPROVED'
  | 'HUMAN_APPROVED'
  | 'REJECTED'
  | 'NOT_SAME_PRODUCT'
  | 'NEEDS_MORE_INFORMATION';

export interface ProductMatch {
  id: string;
  captureId: string;
  captureTitle: string;
  captureSourceDomain: string;
  captureUpc: string | null;
  captureBrand: string | null;
  captureModel: string | null;
  captureImageUrl: string | null;
  candidateProductId: string;
  candidateVariantId: string | null;
  candidateTitle: string;
  candidateBrand: string | null;
  candidateModel: string | null;
  candidateUpc: string | null;
  candidateImageUrl: string | null;
  totalScore: number;
  confidencePercentage: number;
  identifierScore: number;
  brandScore: number;
  modelScore: number;
  attributeScore: number;
  textScore: number;
  imageScore: number;
  aiScore: number;
  matchReasons: string[];
  conflicts: string[];
  missingFields: string[];
  positiveEvidence: string[];
  decision: MatchDecision;
  decisionSource: 'SYSTEM' | 'AI' | 'HUMAN';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  recommendation: MatchRecommendation;
  requiresHumanReview: boolean;
}

// ---- Marketplaces ----

export type Marketplace = 'MERCADOLIBRE' | 'AMAZON' | 'SHOPIFY';

export interface MarketplaceAccount {
  id: string;
  marketplace: Marketplace;
  accountName: string;
  sellerIdentifier: string;
  active: boolean;
  configuration: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type ListingStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'DRAFT'
  | 'ERROR'
  | 'UNDER_REVIEW';

export interface MarketplaceListing {
  id: string;
  productId: string;
  variantId: string | null;
  accountId: string;
  accountName: string;
  marketplace: Marketplace;
  marketplaceListingId: string;
  marketplaceCatalogId: string | null;
  sellerSku: string | null;
  listingTitle: string;
  listingUrl: string | null;
  listingStatus: ListingStatus;
  marketplaceCategoryId: string | null;
  price: number;
  currency: string;
  availableQuantity: number | null;
  listingType: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingVariantMapping {
  id: string;
  listingId: string;
  variantId: string;
  marketplaceVariantId: string | null;
  sellerSku: string | null;
  attributeValues: Record<string, string>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Warehouses ----

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  isDefault: boolean;
  active: boolean;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  locationCode: string;
  aisle: string;
  shelf: string;
  bin: string;
  description: string | null;
  active: boolean;
}

// ---- Inventory ----

export interface InventoryBalance {
  id: string;
  variantId: string;
  variantSku: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string | null;
  locationCode: string | null;
  onHand: number;
  available: number;
  reserved: number;
  occupied: number;
  damaged: number;
  incoming: number;
  updatedAt: string;
}

export type InventoryMovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RESERVATION'
  | 'RELEASE_RESERVATION'
  | 'DAMAGE'
  | 'INITIAL_BALANCE';

export interface InventoryMovement {
  id: string;
  variantId: string;
  variantSku: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string | null;
  movementType: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

// ---- Suppliers ----

export interface Supplier {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSupplier {
  id: string;
  productId: string;
  variantId: string | null;
  supplierId: string;
  supplierName: string;
  supplierSku: string | null;
  supplierUrl: string | null;
  purchaseCost: number;
  currency: string;
  minimumOrderQuantity: number | null;
  purchaseMultiple: number | null;
  leadTimeDays: number | null;
  isDefault: boolean;
  active: boolean;
  updatedAt: string;
}

// ---- Images ----

export type ImageType =
  | 'MAIN'
  | 'ALTERNATE'
  | 'DETAIL'
  | 'DIMENSIONS'
  | 'LIFESTYLE'
  | 'PACKAGING'
  | 'VARIANT'
  | 'GENERATED'
  | 'DOCUMENT';

export type ImageStatus =
  | 'URL_CAPTURED'
  | 'QUEUED'
  | 'DOWNLOADING'
  | 'DOWNLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'REJECTED'
  | 'ERROR';

export interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  originalUrl: string;
  storageProvider: string;
  storageFileId: string | null;
  storagePath: string | null;
  publicDeliveryUrl: string | null;
  mimeType: string;
  originalFilename: string;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  sha256: string | null;
  perceptualHash: string | null;
  imageType: ImageType;
  displayOrder: number;
  altText: string | null;
  source: string;
  status: ImageStatus;
  approved: boolean;
  generatedByAi: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Jobs ----

export type JobType =
  | 'NORMALIZE_PRODUCT'
  | 'MATCH_PRODUCT'
  | 'DETECT_DUPLICATES'
  | 'GENERATE_EMBEDDING'
  | 'COMPARE_IMAGES'
  | 'IMPROVE_TITLE'
  | 'IMPROVE_DESCRIPTION'
  | 'GENERATE_MARKETPLACE_CONTENT'
  | 'DOWNLOAD_IMAGE'
  | 'PROCESS_IMAGE'
  | 'SYNC_GOOGLE_SHEETS'
  | 'SYNC_MARKETPLACE_LISTINGS'
  | 'AUDIT_LISTING'
  | 'FIND_MISSING_IDENTIFIERS';

export type JobStatus =
  | 'PENDING'
  | 'CLAIMED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMEOUT';

export interface Job {
  id: string;
  jobType: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  assignedWorker: string | null;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  heartbeatAt: string | null;
  errorMessage: string | null;
  entityLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- AI Reviews ----

export interface AiReview {
  id: string;
  productId: string | null;
  variantId: string | null;
  captureId: string | null;
  listingId: string | null;
  jobId: string | null;
  provider: string;
  model: string;
  promptVersion: string;
  inputHash: string;
  response: Record<string, unknown>;
  confidence: number;
  requiresHumanReview: boolean;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

// ---- Audit Logs ----

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ---- Dashboard ----

export interface DashboardStats {
  newCaptures: number;
  pendingIdentification: number;
  pendingMatches: number;
  possibleDuplicates: number;
  productsWithoutUpc: number;
  productsWithoutImages: number;
  activeListings: number;
  listingsWithErrors: number;
  pendingJobs: number;
  failedJobs: number;
  inventoryAlerts: number;
}

export interface DashboardActivity {
  id: string;
  type: 'CAPTURE' | 'MATCH' | 'PRODUCT' | 'LISTING' | 'JOB' | 'INVENTORY';
  description: string;
  timestamp: string;
  user: string | null;
}
