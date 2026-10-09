// ============================================================
// CatalogAI - Service Layer
// These services abstract data access. In Phase 1 they return
// mock data. In later phases they will call the real API.
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

// Simulated async delay for realistic behavior
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

// ---- Product Service ----

export const productService = {
  async getProducts(): Promise<Product[]> {
    await delay();
    return mockProducts;
  },

  async getProduct(id: string): Promise<Product | null> {
    await delay();
    return mockProducts.find((p) => p.id === id) ?? null;
  },

  async getVariants(productId: string): Promise<ProductVariant[]> {
    await delay();
    return mockVariants.filter((v) => v.productId === productId);
  },

  async getIdentifiers(productId: string): Promise<ProductIdentifier[]> {
    await delay();
    return mockIdentifiers.filter((i) => i.productId === productId);
  },
};

// ---- Capture Service ----

export const captureService = {
  async getCaptures(): Promise<Capture[]> {
    await delay();
    return mockCaptures;
  },

  async getCapture(id: string): Promise<Capture | null> {
    await delay();
    return mockCaptures.find((c) => c.id === id) ?? null;
  },
};

// ---- Match Service ----

export const matchService = {
  async getMatches(): Promise<ProductMatch[]> {
    await delay();
    return mockMatches;
  },

  async getMatch(id: string): Promise<ProductMatch | null> {
    await delay();
    return mockMatches.find((m) => m.id === id) ?? null;
  },
};

// ---- Listing Service ----

export const listingService = {
  async getListings(): Promise<MarketplaceListing[]> {
    await delay();
    return mockListings;
  },

  async getListingsByProduct(productId: string): Promise<MarketplaceListing[]> {
    await delay();
    return mockListings.filter((l) => l.productId === productId);
  },
};

// ---- Inventory Service ----

export const inventoryService = {
  async getInventoryByVariant(variantId: string): Promise<InventoryBalance[]> {
    await delay();
    return mockInventory.filter((i) => i.variantId === variantId);
  },

  async getInventoryByProduct(productId: string): Promise<InventoryBalance[]> {
    await delay();
    const variantIds = mockVariants
      .filter((v) => v.productId === productId)
      .map((v) => v.id);
    return mockInventory.filter((i) => variantIds.includes(i.variantId));
  },

  async getMovementsByVariant(variantId: string): Promise<InventoryMovement[]> {
    await delay();
    return mockMovements.filter((m) => m.variantId === variantId);
  },
};

// ---- Image Service ----

export const imageService = {
  async getImages(productId: string): Promise<ProductImage[]> {
    await delay();
    return mockImages.filter((i) => i.productId === productId);
  },
};

// ---- Job Service ----

export const jobService = {
  async getJobs(): Promise<Job[]> {
    await delay();
    return mockJobs;
  },
};

// ---- Supplier Service ----

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    await delay();
    return mockSuppliers;
  },

  async getProductSuppliers(productId: string): Promise<ProductSupplier[]> {
    await delay();
    return mockProductSuppliers.filter((s) => s.productId === productId);
  },
};

// ---- Warehouse Service ----

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    await delay();
    return mockWarehouses;
  },
};

// ---- Dashboard Service ----

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay();
    return mockDashboardStats;
  },

  async getActivity(): Promise<DashboardActivity[]> {
    await delay();
    return mockDashboardActivity;
  },
};

// ---- Audit Service ----

export const auditService = {
  async getLogs(): Promise<AuditLog[]> {
    await delay();
    return mockAuditLogs;
  },
};
