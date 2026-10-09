// ============================================================
// CatalogAI - Service Layer
// When demo mode is OFF, services query Supabase directly.
// When demo mode is ON, services return mock data from memory.
// ============================================================

import {
  mockAuditLogs,
  mockCaptures,
  mockDashboardActivity,
  mockDashboardStats,
  mockIdentifiers,
  mockImages,
  mockInventory,
  mockJobs,
  mockListings,
  mockMatches,
  mockMovements,
  mockProductSuppliers,
  mockProducts,
  mockSuppliers,
  mockVariants,
  mockWarehouses,
} from '@/lib/mock/data';
import { supabase } from '@/lib/supabase/client';
import type {
  AuditLog,
  Capture,
  DashboardActivity,
  DashboardStats,
  InventoryBalance,
  InventoryMovement,
  Job,
  MarketplaceListing,
  Product,
  ProductImage,
  ProductIdentifier,
  ProductMatch,
  ProductSupplier,
  ProductVariant,
  Supplier,
  Warehouse,
} from '@/types';

// Row type from Supabase (snake_case columns mapped to camelCase)
type DbRow = Record<string, unknown>;

function mapProduct(r: DbRow): Product {
  return {
    id: r.id as string,
    internalProductNumber: r.internal_product_number as string,
    titleMaster: r.title_master as string,
    normalizedTitle: r.normalized_title as string,
    descriptionMaster: r.description_master as string,
    brandId: r.brand_id as string,
    brandName: r.brand_name as string,
    model: r.model as string,
    manufacturer: r.manufacturer as string,
    productType: r.product_type as string,
    condition: r.condition as Product['condition'],
    status: r.status as Product['status'],
    launchDate: (r.launch_date as string) ?? null,
    taxProductCode: (r.tax_product_code as string) ?? null,
    taxUnitCode: (r.tax_unit_code as string) ?? null,
    taxObjectCode: (r.tax_object_code as string) ?? null,
    defaultVariantId: (r.default_variant_id as string) ?? null,
    primaryImageUrl: (r.primary_image_url as string) ?? null,
    variantCount: r.variant_count as number,
    totalInventory: r.total_inventory as number,
    listingCount: r.listing_count as number,
    createdBy: (r.created_by as string) ?? '',
    updatedBy: (r.updated_by as string) ?? '',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    archivedAt: (r.archived_at as string) ?? null,
  };
}

function mapVariant(r: DbRow): ProductVariant {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    internalSku: r.internal_sku as string,
    skuAlias: (r.sku_alias as string) ?? '',
    variantName: (r.variant_name as string) ?? '',
    color: (r.color as string) ?? null,
    size: (r.size as string) ?? null,
    material: (r.material as string) ?? null,
    capacity: (r.capacity as string) ?? null,
    packageQuantity: (r.package_quantity as number) ?? null,
    unitOfMeasure: (r.unit_of_measure as string) ?? null,
    packageWeightGrams: (r.package_weight_grams as number) ?? null,
    packageLengthCm: (r.package_length_cm as number) ?? null,
    packageWidthCm: (r.package_width_cm as number) ?? null,
    packageHeightCm: (r.package_height_cm as number) ?? null,
    purchaseCost: (r.purchase_cost as number) ?? null,
    retailPrice: (r.retail_price as number) ?? null,
    currency: r.currency as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapIdentifier(r: DbRow): ProductIdentifier {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    variantId: (r.variant_id as string) ?? null,
    identifierType: r.identifier_type as ProductIdentifier['identifierType'],
    identifierValue: r.identifier_value as string,
    normalizedValue: (r.normalized_value as string) ?? '',
    countryCode: (r.country_code as string) ?? null,
    source: r.source as string,
    verified: r.verified as boolean,
    verificationStatus: r.verification_status as ProductIdentifier['verificationStatus'],
    verificationNotes: (r.verification_notes as string) ?? null,
    isPrimary: r.is_primary as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapCapture(r: DbRow): Capture {
  return {
    id: r.id as string,
    sourceType: r.source_type as Capture['sourceType'],
    sourceUrl: (r.source_url as string) ?? '',
    sourceDomain: (r.source_domain as string) ?? '',
    externalReference: (r.external_reference as string) ?? null,
    capturedTitle: r.captured_title as string,
    capturedDescription: (r.captured_description as string) ?? '',
    capturedBrand: (r.captured_brand as string) ?? null,
    capturedModel: (r.captured_model as string) ?? null,
    capturedMpn: (r.captured_mpn as string) ?? null,
    capturedUpc: (r.captured_upc as string) ?? null,
    capturedAsin: (r.captured_asin as string) ?? null,
    capturedPrice: (r.captured_price as number) ?? null,
    capturedCurrency: (r.captured_currency as string) ?? null,
    capturedAttributes: (r.captured_attributes as Record<string, string>) ?? {},
    capturedImages: (r.captured_images as string[]) ?? [],
    rawPayload: (r.raw_payload as Record<string, unknown>) ?? null,
    status: r.status as Capture['status'],
    assignedProductId: (r.assigned_product_id as string) ?? null,
    assignedVariantId: (r.assigned_variant_id as string) ?? null,
    bestMatchProductId: (r.best_match_product_id as string) ?? null,
    bestMatchConfidence: (r.best_match_confidence as number) ?? null,
    bestMatchRecommendation: (r.best_match_recommendation as Capture['bestMatchRecommendation']) ?? null,
    capturedBy: (r.captured_by as string) ?? null,
    capturedAt: r.captured_at as string,
    processedAt: (r.processed_at as string) ?? null,
  };
}

function mapMatch(r: DbRow): ProductMatch {
  return {
    id: r.id as string,
    captureId: r.capture_id as string,
    captureTitle: (r.capture_title as string) ?? '',
    captureSourceDomain: (r.capture_source_domain as string) ?? '',
    captureUpc: (r.capture_upc as string) ?? null,
    captureBrand: (r.capture_brand as string) ?? null,
    captureModel: (r.capture_model as string) ?? null,
    captureImageUrl: (r.capture_image_url as string) ?? null,
    candidateProductId: r.candidate_product_id as string,
    candidateVariantId: (r.candidate_variant_id as string) ?? null,
    candidateTitle: (r.candidate_title as string) ?? '',
    candidateBrand: (r.candidate_brand as string) ?? null,
    candidateModel: (r.candidate_model as string) ?? null,
    candidateUpc: (r.candidate_upc as string) ?? null,
    candidateImageUrl: (r.candidate_image_url as string) ?? null,
    totalScore: r.total_score as number,
    confidencePercentage: r.confidence_percentage as number,
    identifierScore: r.identifier_score as number,
    brandScore: r.brand_score as number,
    modelScore: r.model_score as number,
    attributeScore: r.attribute_score as number,
    textScore: r.text_score as number,
    imageScore: r.image_score as number,
    aiScore: (r.ai_score as number) ?? 0,
    matchReasons: (r.match_reasons as string[]) ?? [],
    conflicts: (r.conflicts as string[]) ?? [],
    missingFields: (r.missing_fields as string[]) ?? [],
    positiveEvidence: (r.positive_evidence as string[]) ?? [],
    decision: r.decision as ProductMatch['decision'],
    decisionSource: (r.decision_source as ProductMatch['decisionSource']) ?? 'SYSTEM',
    reviewedBy: (r.reviewed_by as string) ?? null,
    reviewedAt: (r.reviewed_at as string) ?? null,
    createdAt: r.created_at as string,
    recommendation: (r.recommendation as ProductMatch['recommendation']) ?? 'NEEDS_HUMAN_REVIEW',
    requiresHumanReview: r.requires_human_review as boolean,
  };
}

function mapListing(r: DbRow): MarketplaceListing {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    variantId: (r.variant_id as string) ?? null,
    accountId: r.account_id as string,
    accountName: (r.account_name as string) ?? '',
    marketplace: r.marketplace as MarketplaceListing['marketplace'],
    marketplaceListingId: (r.marketplace_listing_id as string) ?? '',
    marketplaceCatalogId: (r.marketplace_catalog_id as string) ?? null,
    sellerSku: (r.seller_sku as string) ?? null,
    listingTitle: (r.listing_title as string) ?? '',
    listingUrl: (r.listing_url as string) ?? null,
    listingStatus: r.listing_status as MarketplaceListing['listingStatus'],
    marketplaceCategoryId: (r.marketplace_category_id as string) ?? null,
    price: r.price as number,
    currency: r.currency as string,
    availableQuantity: (r.available_quantity as number) ?? null,
    listingType: (r.listing_type as string) ?? null,
    lastSyncedAt: (r.last_synced_at as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapInventory(r: DbRow): InventoryBalance {
  return {
    id: r.id as string,
    variantId: r.variant_id as string,
    variantSku: (r.variant_sku as string) ?? '',
    warehouseId: r.warehouse_id as string,
    warehouseName: (r.warehouse_name as string) ?? '',
    locationId: (r.location_id as string) ?? null,
    locationCode: (r.location_code as string) ?? null,
    onHand: r.on_hand as number,
    available: r.available as number,
    reserved: r.reserved as number,
    occupied: r.occupied as number,
    damaged: r.damaged as number,
    incoming: r.incoming as number,
    updatedAt: r.updated_at as string,
  };
}

function mapMovement(r: DbRow): InventoryMovement {
  return {
    id: r.id as string,
    variantId: r.variant_id as string,
    variantSku: (r.variant_sku as string) ?? '',
    warehouseId: r.warehouse_id as string,
    warehouseName: (r.warehouse_name as string) ?? '',
    locationId: (r.location_id as string) ?? null,
    movementType: r.movement_type as InventoryMovement['movementType'],
    quantity: r.quantity as number,
    previousQuantity: (r.previous_quantity as number) ?? null,
    resultingQuantity: (r.resulting_quantity as number) ?? null,
    referenceType: (r.reference_type as string) ?? null,
    referenceId: (r.reference_id as string) ?? null,
    notes: (r.notes as string) ?? null,
    createdBy: (r.created_by as string) ?? '',
    createdAt: r.created_at as string,
  };
}

function mapImage(r: DbRow): ProductImage {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    variantId: (r.variant_id as string) ?? null,
    originalUrl: (r.original_url as string) ?? '',
    storageProvider: (r.storage_provider as string) ?? '',
    storageFileId: (r.storage_file_id as string) ?? null,
    storagePath: (r.storage_path as string) ?? null,
    publicDeliveryUrl: (r.public_delivery_url as string) ?? null,
    mimeType: (r.mime_type as string) ?? '',
    originalFilename: (r.original_filename as string) ?? '',
    fileSizeBytes: (r.file_size_bytes as number) ?? null,
    width: (r.width as number) ?? null,
    height: (r.height as number) ?? null,
    sha256: (r.sha256 as string) ?? null,
    perceptualHash: (r.perceptual_hash as string) ?? null,
    imageType: (r.image_type as ProductImage['imageType']) ?? 'MAIN',
    displayOrder: (r.display_order as number) ?? 0,
    altText: (r.alt_text as string) ?? null,
    source: (r.source as string) ?? '',
    status: (r.status as ProductImage['status']) ?? 'URL_CAPTURED',
    approved: r.approved as boolean,
    generatedByAi: (r.generated_by_ai as boolean) ?? false,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapJob(r: DbRow): Job {
  return {
    id: r.id as string,
    jobType: r.job_type as Job['jobType'],
    status: r.status as Job['status'],
    priority: r.priority as number,
    payload: (r.payload as Record<string, unknown>) ?? {},
    result: (r.result as Record<string, unknown>) ?? null,
    assignedWorker: (r.assigned_worker as string) ?? null,
    attempts: r.attempts as number,
    maxAttempts: r.max_attempts as number,
    scheduledAt: r.scheduled_at as string,
    startedAt: (r.started_at as string) ?? null,
    completedAt: (r.completed_at as string) ?? null,
    heartbeatAt: (r.heartbeat_at as string) ?? null,
    errorMessage: (r.error_message as string) ?? null,
    entityLabel: (r.entity_label as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapSupplier(r: DbRow): Supplier {
  return {
    id: r.id as string,
    companyName: r.company_name as string,
    contactName: (r.contact_name as string) ?? null,
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    website: (r.website as string) ?? null,
    active: r.active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapProductSupplier(r: DbRow): ProductSupplier {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    variantId: (r.variant_id as string) ?? null,
    supplierId: r.supplier_id as string,
    supplierName: (r.supplier_name as string) ?? '',
    supplierSku: (r.supplier_sku as string) ?? null,
    supplierUrl: (r.supplier_url as string) ?? null,
    purchaseCost: r.purchase_cost as number,
    currency: r.currency as string,
    minimumOrderQuantity: (r.minimum_order_quantity as number) ?? null,
    purchaseMultiple: (r.purchase_multiple as number) ?? null,
    leadTimeDays: (r.lead_time_days as number) ?? null,
    isDefault: r.is_default as boolean,
    active: r.active as boolean,
    updatedAt: r.updated_at as string,
  };
}

function mapWarehouse(r: DbRow): Warehouse {
  return {
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
    address: {
      street: (r.street as string) ?? '',
      city: (r.city as string) ?? '',
      state: (r.state as string) ?? '',
      country: (r.country as string) ?? '',
    },
    isDefault: r.is_default as boolean,
    active: r.active as boolean,
  };
}

function mapAuditLog(r: DbRow): AuditLog {
  return {
    id: r.id as string,
    userId: (r.user_id as string) ?? null,
    userName: (r.user_name as string) ?? null,
    action: r.action as string,
    entityType: r.entity_type as string,
    entityId: (r.entity_id as string) ?? null,
    before: (r.before as Record<string, unknown>) ?? null,
    after: (r.after as Record<string, unknown>) ?? null,
    ipAddress: (r.ip_address as string) ?? null,
    userAgent: (r.user_agent as string) ?? null,
    createdAt: r.created_at as string,
  };
}

function mapActivity(r: DbRow): DashboardActivity {
  return {
    id: r.id as string,
    type: r.activity_type as DashboardActivity['type'],
    description: r.description as string,
    timestamp: r.timestamp as string,
    user: (r.user_name as string) ?? null,
  };
}

// Helper: check demo mode flag (set by DemoModeProvider via localStorage)
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('catalogai-demo-mode') === 'true';
}

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// ---- Product Service ----

export const productService = {
  async getProducts(): Promise<Product[]> {
    if (isDemoMode()) {
      await delay();
      return mockProducts;
    }
    const { data, error } = await supabase.from('products').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapProduct);
  },

  async getProduct(id: string): Promise<Product | null> {
    if (isDemoMode()) {
      await delay();
      return mockProducts.find((p) => p.id === id) ?? null;
    }
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data as DbRow) : null;
  },

  async getVariants(productId: string): Promise<ProductVariant[]> {
    if (isDemoMode()) {
      await delay();
      return mockVariants.filter((v) => v.productId === productId);
    }
    const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId);
    if (error) throw error;
    return (data as DbRow[]).map(mapVariant);
  },

  async getIdentifiers(productId: string): Promise<ProductIdentifier[]> {
    if (isDemoMode()) {
      await delay();
      return mockIdentifiers.filter((i) => i.productId === productId);
    }
    const { data, error } = await supabase.from('product_identifiers').select('*').eq('product_id', productId);
    if (error) throw error;
    return (data as DbRow[]).map(mapIdentifier);
  },
};

// ---- Capture Service ----

export const captureService = {
  async getCaptures(): Promise<Capture[]> {
    if (isDemoMode()) {
      await delay();
      return mockCaptures;
    }
    const { data, error } = await supabase.from('captures').select('*').order('captured_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapCapture);
  },

  async getCapture(id: string): Promise<Capture | null> {
    if (isDemoMode()) {
      await delay();
      return mockCaptures.find((c) => c.id === id) ?? null;
    }
    const { data, error } = await supabase.from('captures').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapCapture(data as DbRow) : null;
  },
};

// ---- Match Service ----

export const matchService = {
  async getMatches(): Promise<ProductMatch[]> {
    if (isDemoMode()) {
      await delay();
      return mockMatches;
    }
    const { data, error } = await supabase.from('product_matches').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapMatch);
  },

  async getMatch(id: string): Promise<ProductMatch | null> {
    if (isDemoMode()) {
      await delay();
      return mockMatches.find((m) => m.id === id) ?? null;
    }
    const { data, error } = await supabase.from('product_matches').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapMatch(data as DbRow) : null;
  },
};

// ---- Listing Service ----

export const listingService = {
  async getListings(): Promise<MarketplaceListing[]> {
    if (isDemoMode()) {
      await delay();
      return mockListings;
    }
    const { data, error } = await supabase.from('marketplace_listings').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapListing);
  },

  async getListingsByProduct(productId: string): Promise<MarketplaceListing[]> {
    if (isDemoMode()) {
      await delay();
      return mockListings.filter((l) => l.productId === productId);
    }
    const { data, error } = await supabase.from('marketplace_listings').select('*').eq('product_id', productId);
    if (error) throw error;
    return (data as DbRow[]).map(mapListing);
  },
};

// ---- Inventory Service ----

export const inventoryService = {
  async getInventoryByVariant(variantId: string): Promise<InventoryBalance[]> {
    if (isDemoMode()) {
      await delay();
      return mockInventory.filter((i) => i.variantId === variantId);
    }
    const { data, error } = await supabase.from('inventory_balances').select('*').eq('variant_id', variantId);
    if (error) throw error;
    return (data as DbRow[]).map(mapInventory);
  },

  async getInventoryByProduct(productId: string): Promise<InventoryBalance[]> {
    if (isDemoMode()) {
      await delay();
      const variantIds = mockVariants.filter((v) => v.productId === productId).map((v) => v.id);
      return mockInventory.filter((i) => variantIds.includes(i.variantId));
    }
    const { data: variants } = await supabase.from('product_variants').select('id').eq('product_id', productId);
    const variantIds = (variants as DbRow[])?.map((v) => v.id as string) ?? [];
    if (variantIds.length === 0) return [];
    const { data, error } = await supabase.from('inventory_balances').select('*').in('variant_id', variantIds);
    if (error) throw error;
    return (data as DbRow[]).map(mapInventory);
  },

  async getMovementsByVariant(variantId: string): Promise<InventoryMovement[]> {
    if (isDemoMode()) {
      await delay();
      return mockMovements.filter((m) => m.variantId === variantId);
    }
    const { data, error } = await supabase.from('inventory_movements').select('*').eq('variant_id', variantId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapMovement);
  },
};

// ---- Image Service ----

export const imageService = {
  async getImages(productId: string): Promise<ProductImage[]> {
    if (isDemoMode()) {
      await delay();
      return mockImages.filter((i) => i.productId === productId);
    }
    const { data, error } = await supabase.from('product_images').select('*').eq('product_id', productId).order('display_order', { ascending: true });
    if (error) throw error;
    return (data as DbRow[]).map(mapImage);
  },
};

// ---- Job Service ----

export const jobService = {
  async getJobs(): Promise<Job[]> {
    if (isDemoMode()) {
      await delay();
      return mockJobs;
    }
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapJob);
  },
};

// ---- Supplier Service ----

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    if (isDemoMode()) {
      await delay();
      return mockSuppliers;
    }
    const { data, error } = await supabase.from('suppliers').select('*').order('company_name', { ascending: true });
    if (error) throw error;
    return (data as DbRow[]).map(mapSupplier);
  },

  async getProductSuppliers(productId: string): Promise<ProductSupplier[]> {
    if (isDemoMode()) {
      await delay();
      return mockProductSuppliers.filter((s) => s.productId === productId);
    }
    const { data, error } = await supabase.from('product_suppliers').select('*').eq('product_id', productId);
    if (error) throw error;
    return (data as DbRow[]).map(mapProductSupplier);
  },
};

// ---- Warehouse Service ----

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    if (isDemoMode()) {
      await delay();
      return mockWarehouses;
    }
    const { data, error } = await supabase.from('warehouses').select('*');
    if (error) throw error;
    return (data as DbRow[]).map(mapWarehouse);
  },
};

// ---- Dashboard Service ----

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    if (isDemoMode()) {
      await delay();
      return mockDashboardStats;
    }
    const [captures, matches, products, listings, jobs, inventory] = await Promise.all([
      supabase.from('captures').select('*'),
      supabase.from('product_matches').select('*'),
      supabase.from('products').select('*'),
      supabase.from('marketplace_listings').select('*'),
      supabase.from('jobs').select('*'),
      supabase.from('inventory_balances').select('*'),
    ]);

    const capturesData = (captures.data as DbRow[]) ?? [];
    const matchesData = (matches.data as DbRow[]) ?? [];
    const productsData = (products.data as DbRow[]) ?? [];
    const listingsData = (listings.data as DbRow[]) ?? [];
    const jobsData = (jobs.data as DbRow[]) ?? [];
    const inventoryData = (inventory.data as DbRow[]) ?? [];

    const newCaptures = capturesData.filter((c) => c.status === 'RECEIVED' || c.status === 'NORMALIZING').length;
    const pendingIdentification = capturesData.filter((c) => c.status === 'NEW_PRODUCT_CANDIDATE').length;
    const pendingMatches = matchesData.filter((m) => m.decision === 'PENDING').length;
    const possibleDuplicates = 0;
    const productsWithoutUpc = 0;
    const productsWithoutImages = productsData.filter((p) => !p.primary_image_url).length;
    const activeListings = listingsData.filter((l) => l.listing_status === 'ACTIVE').length;
    const listingsWithErrors = listingsData.filter((l) => l.listing_status === 'ERROR').length;
    const pendingJobs = jobsData.filter((j) => j.status === 'PENDING').length;
    const failedJobs = jobsData.filter((j) => j.status === 'FAILED').length;
    const inventoryAlerts = inventoryData.filter((i) => (i.available as number) < 5).length;

    return {
      newCaptures,
      pendingIdentification,
      pendingMatches,
      possibleDuplicates,
      productsWithoutUpc,
      productsWithoutImages,
      activeListings,
      listingsWithErrors,
      pendingJobs,
      failedJobs,
      inventoryAlerts,
    };
  },

  async getActivity(): Promise<DashboardActivity[]> {
    if (isDemoMode()) {
      await delay();
      return mockDashboardActivity;
    }
    const { data, error } = await supabase.from('dashboard_activity').select('*').order('timestamp', { ascending: false }).limit(20);
    if (error) throw error;
    return (data as DbRow[]).map(mapActivity);
  },
};

// ---- Audit Service ----

export const auditService = {
  async getLogs(): Promise<AuditLog[]> {
    if (isDemoMode()) {
      await delay();
      return mockAuditLogs;
    }
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapAuditLog);
  },
};

// ---- Settings Service ----

export interface AppSettings {
  rateLimiting: boolean;
  csrfProtection: boolean;
  auditLogging: boolean;
  notifJobsFailed: boolean;
  notifDuplicates: boolean;
}

const defaultSettings: AppSettings = {
  rateLimiting: true,
  csrfProtection: true,
  auditLogging: true,
  notifJobsFailed: true,
  notifDuplicates: true,
};

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    if (isDemoMode()) return defaultSettings;
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    if (!data) return defaultSettings;
    const r = data as DbRow;
    return {
      rateLimiting: r.rate_limiting as boolean,
      csrfProtection: r.csrf_protection as boolean,
      auditLogging: r.audit_logging as boolean,
      notifJobsFailed: r.notif_jobs_failed as boolean,
      notifDuplicates: r.notif_duplicates as boolean,
    };
  },

  async updateSettings(settings: AppSettings): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const { error } = await supabase.from('app_settings').update({
      rate_limiting: settings.rateLimiting,
      csrf_protection: settings.csrfProtection,
      audit_logging: settings.auditLogging,
      notif_jobs_failed: settings.notifJobsFailed,
      notif_duplicates: settings.notifDuplicates,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    if (error) throw error;
  },
};

// ---- Product Mutations ----

export const productMutations = {
  async updateProduct(id: string, updates: {
    titleMaster?: string;
    descriptionMaster?: string;
    brandName?: string;
    model?: string;
    manufacturer?: string;
    productType?: string;
    condition?: string;
    status?: string;
    taxProductCode?: string | null;
    taxUnitCode?: string | null;
    taxObjectCode?: string | null;
    launchDate?: string | null;
  }): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const snakeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.titleMaster !== undefined) { snakeUpdates.title_master = updates.titleMaster; snakeUpdates.normalized_title = updates.titleMaster.toLowerCase(); }
    if (updates.descriptionMaster !== undefined) snakeUpdates.description_master = updates.descriptionMaster;
    if (updates.brandName !== undefined) snakeUpdates.brand_name = updates.brandName;
    if (updates.model !== undefined) snakeUpdates.model = updates.model;
    if (updates.manufacturer !== undefined) snakeUpdates.manufacturer = updates.manufacturer;
    if (updates.productType !== undefined) snakeUpdates.product_type = updates.productType;
    if (updates.condition !== undefined) snakeUpdates.condition = updates.condition;
    if (updates.status !== undefined) snakeUpdates.status = updates.status;
    if (updates.taxProductCode !== undefined) snakeUpdates.tax_product_code = updates.taxProductCode;
    if (updates.taxUnitCode !== undefined) snakeUpdates.tax_unit_code = updates.taxUnitCode;
    if (updates.taxObjectCode !== undefined) snakeUpdates.tax_object_code = updates.taxObjectCode;
    if (updates.launchDate !== undefined) snakeUpdates.launch_date = updates.launchDate;
    const { error } = await supabase.from('products').update(snakeUpdates).eq('id', id);
    if (error) throw error;
  },

  async createProduct(data: {
    internalProductNumber: string;
    titleMaster: string;
    descriptionMaster?: string;
    brandName?: string;
    model?: string;
    manufacturer?: string;
    productType?: string;
    condition?: string;
    status?: string;
  }): Promise<Product | null> {
    const id = `prd_${Date.now()}`;
    const now = new Date().toISOString();
    const row = {
      id,
      internal_product_number: data.internalProductNumber,
      title_master: data.titleMaster,
      normalized_title: data.titleMaster.toLowerCase(),
      description_master: data.descriptionMaster ?? '',
      brand_name: data.brandName ?? '',
      model: data.model ?? '',
      manufacturer: data.manufacturer ?? '',
      product_type: data.productType ?? '',
      condition: data.condition ?? 'NEW',
      status: data.status ?? 'DRAFT',
      variant_count: 0,
      total_inventory: 0,
      listing_count: 0,
      created_by: 'system',
      updated_by: 'system',
      created_at: now,
      updated_at: now,
    };
    if (isDemoMode()) {
      await delay();
      const p: Product = {
        id: row.id,
        internalProductNumber: row.internal_product_number,
        titleMaster: row.title_master,
        normalizedTitle: row.normalized_title,
        descriptionMaster: row.description_master,
        brandId: '', brandName: row.brand_name,
        model: row.model, manufacturer: row.manufacturer,
        productType: row.product_type,
        condition: row.condition as Product['condition'],
        status: row.status as Product['status'],
        launchDate: null, taxProductCode: null, taxUnitCode: null, taxObjectCode: null,
        defaultVariantId: null, primaryImageUrl: null,
        variantCount: 0, totalInventory: 0, listingCount: 0,
        createdBy: 'system', updatedBy: 'system',
        createdAt: now, updatedAt: now, archivedAt: null,
      };
      mockProducts.push(p);
      return p;
    }
    const { data: inserted, error } = await supabase.from('products').insert(row).select('*').maybeSingle();
    if (error) throw error;
    return inserted ? mapProduct(inserted as DbRow) : null;
  },

  async updateVariant(id: string, updates: {
    purchaseCost?: number | null;
    retailPrice?: number | null;
    unitOfMeasure?: string | null;
  }): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const snakeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.purchaseCost !== undefined) snakeUpdates.purchase_cost = updates.purchaseCost;
    if (updates.retailPrice !== undefined) snakeUpdates.retail_price = updates.retailPrice;
    if (updates.unitOfMeasure !== undefined) snakeUpdates.unit_of_measure = updates.unitOfMeasure;
    const { error } = await supabase.from('product_variants').update(snakeUpdates).eq('id', id);
    if (error) throw error;
  },
};

// ---- Inventory Service (global) ----

export const inventoryGlobalService = {
  async getAllInventory(): Promise<InventoryBalance[]> {
    if (isDemoMode()) {
      await delay();
      return mockInventory;
    }
    const { data, error } = await supabase.from('inventory_balances').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapInventory);
  },
};

// ---- Image Service (global) ----

export const imageGlobalService = {
  async getAllImages(): Promise<ProductImage[]> {
    if (isDemoMode()) {
      await delay();
      return mockImages;
    }
    const { data, error } = await supabase.from('product_images').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(mapImage);
  },

  async approveImage(id: string): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const { error } = await supabase.from('product_images').update({ approved: true, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async rejectImage(id: string): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const { error } = await supabase.from('product_images').update({ status: 'REJECTED', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ---- Match Mutations ----

export const matchMutations = {
  async updateDecision(
    id: string,
    decision: ProductMatch['decision'],
    decisionSource: 'HUMAN' = 'HUMAN',
  ): Promise<void> {
    if (isDemoMode()) {
      await delay();
      const m = mockMatches.find((x) => x.id === id);
      if (m) { m.decision = decision; m.decisionSource = decisionSource; m.reviewedBy = 'user'; m.reviewedAt = new Date().toISOString(); }
      return;
    }
    const { error } = await supabase.from('product_matches').update({
      decision,
      decision_source: decisionSource,
      reviewed_by: 'user',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
  },

  async linkCaptureToProduct(
    captureId: string,
    productId: string,
    variantId: string | null,
  ): Promise<void> {
    if (isDemoMode()) {
      await delay();
      const c = mockCaptures.find((x) => x.id === captureId);
      if (c) { c.assignedProductId = productId; c.assignedVariantId = variantId; c.status = 'MATCHED'; }
      return;
    }
    const { error: capErr } = await supabase.from('captures').update({
      assigned_product_id: productId,
      assigned_variant_id: variantId,
      status: 'MATCHED',
      processed_at: new Date().toISOString(),
    }).eq('id', captureId);
    if (capErr) throw capErr;
  },
};

// ---- Image Mutations (per-product) ----

export const imageMutations = {
  async approveImage(id: string): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const { error } = await supabase.from('product_images').update({ approved: true, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async rejectImage(id: string): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const { error } = await supabase.from('product_images').update({ status: 'REJECTED', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async setMainImage(id: string, productId: string): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    await supabase.from('product_images').update({ image_type: 'ALTERNATE' }).eq('product_id', productId).eq('image_type', 'MAIN');
    const { error } = await supabase.from('product_images').update({ image_type: 'MAIN', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ---- Integration Service ----

export interface IntegrationConfig {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, string>;
  lastConnectedAt: string | null;
  lastError: string | null;
  updatedAt: string;
}

function mapIntegration(r: DbRow): IntegrationConfig {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as string,
    enabled: r.enabled as boolean,
    credentials: (r.credentials as Record<string, string>) ?? {},
    settings: (r.settings as Record<string, string>) ?? {},
    lastConnectedAt: (r.last_connected_at as string) ?? null,
    lastError: (r.last_error as string) ?? null,
    updatedAt: r.updated_at as string,
  };
}

const defaultIntegrations: IntegrationConfig[] = [
  { id: 'mercadolibre', name: 'MercadoLibre', category: 'marketplace', enabled: true, credentials: {}, settings: { site: 'MLM', accountName: 'MITIENDOTA' }, lastConnectedAt: null, lastError: null, updatedAt: '' },
  { id: 'google_sheets', name: 'Google Sheets', category: 'sheets', enabled: false, credentials: {}, settings: {}, lastConnectedAt: null, lastError: null, updatedAt: '' },
  { id: 'google_drive', name: 'Google Drive', category: 'storage', enabled: false, credentials: {}, settings: {}, lastConnectedAt: null, lastError: null, updatedAt: '' },
  { id: 'chrome_extension', name: 'Extension Chrome', category: 'extension', enabled: false, credentials: {}, settings: {}, lastConnectedAt: null, lastError: null, updatedAt: '' },
  { id: 'ollama_worker', name: 'Ollama Worker', category: 'ai_worker', enabled: false, credentials: {}, settings: { host: 'localhost', port: '11434' }, lastConnectedAt: null, lastError: null, updatedAt: '' },
];

export const integrationService = {
  async getAll(): Promise<IntegrationConfig[]> {
    if (isDemoMode()) {
      await delay();
      return defaultIntegrations;
    }
    const { data, error } = await supabase.from('integration_configs').select('*').order('category', { ascending: true });
    if (error) throw error;
    return (data as DbRow[]).map(mapIntegration);
  },

  async get(id: string): Promise<IntegrationConfig | null> {
    if (isDemoMode()) {
      await delay();
      return defaultIntegrations.find((i) => i.id === id) ?? null;
    }
    const { data, error } = await supabase.from('integration_configs').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapIntegration(data as DbRow) : null;
  },

  async update(id: string, updates: {
    enabled?: boolean;
    credentials?: Record<string, string>;
    settings?: Record<string, string>;
  }): Promise<void> {
    if (isDemoMode()) { await delay(); return; }
    const snakeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.enabled !== undefined) snakeUpdates.enabled = updates.enabled;
    if (updates.credentials !== undefined) snakeUpdates.credentials = updates.credentials;
    if (updates.settings !== undefined) snakeUpdates.settings = updates.settings;
    if (updates.enabled === true) {
      snakeUpdates.last_connected_at = new Date().toISOString();
      snakeUpdates.last_error = null;
    }
    const { error } = await supabase.from('integration_configs').update(snakeUpdates).eq('id', id);
    if (error) throw error;
  },

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.get(id);
    if (!config) return { success: false, message: 'Integracion no encontrada' };

    if (id === 'ollama_worker') {
      const host = config.settings.host || 'localhost';
      const port = config.settings.port || '11434';
      if (isDemoMode()) {
        await delay(500);
        return { success: false, message: `No se puede conectar a ${host}:${port} en modo demo` };
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-ollama`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ host, port }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          return { success: false, message: body.error || `HTTP ${response.status}` };
        }
        const data = await response.json();
        return { success: true, message: data.message || `Conexion exitosa a ${host}:${port}` };
      } catch {
        return { success: false, message: `No se pudo conectar a ${host}:${port}` };
      }
    }

    if (config.enabled) {
      await this.update(id, { enabled: true });
      return { success: true, message: `${config.name} esta activo` };
    }
    return { success: false, message: `${config.name} no esta configurado` };
  },
};
