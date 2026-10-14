'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { ProductStatusBadge } from '@/components/layout/status-badges';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  productService,
  listingService,
  imageService,
  inventoryService,
  supplierService,
  productMutations,
} from '@/lib/services';
import type {
  MarketplaceListing,
  Product,
  ProductIdentifier,
  ProductImage,
  ProductVariant,
  InventoryBalance,
  InventoryMovement,
  ProductSupplier,
} from '@/types';
import { ProductBasicInfoTab } from '@/components/products/tabs/basic-info-tab';
import { ProductVariantsTab } from '@/components/products/tabs/variants-tab';
import { ProductSalesTab } from '@/components/products/tabs/sales-tab';
import { ProductContentTab } from '@/components/products/tabs/content-tab';
import { ProductMediaTab } from '@/components/products/tabs/media-tab';
import { ProductListingsTab } from '@/components/products/tabs/listings-tab';
import { ProductInventoryTab } from '@/components/products/tabs/inventory-tab';
import { ProductSuppliersTab } from '@/components/products/tabs/suppliers-tab';
import { ProductTaxTab } from '@/components/products/tabs/tax-tab';
import { ProductHistoryTab } from '@/components/products/tabs/history-tab';

interface PageProps {
  params: { id: string };
}

export default function ProductEditorPage({ params }: PageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [identifiers, setIdentifiers] = useState<ProductIdentifier[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [inventory, setInventory] = useState<InventoryBalance[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = params.id;
    Promise.all([
      productService.getProduct(id),
      productService.getVariants(id),
      productService.getIdentifiers(id),
      imageService.getImages(id),
      listingService.getListingsByProduct(id),
      inventoryService.getInventoryByProduct(id),
      supplierService.getProductSuppliers(id),
    ]).then(async ([p, v, idn, img, lst, inv, sup]) => {
      setProduct(p);
      setVariants(v);
      setIdentifiers(idn);
      setImages(img);
      setListings(lst);
      setInventory(inv);
      setSuppliers(sup);
      if (v.length > 0) {
        const allMovements = await Promise.all(
          v.map((variant) =>
            inventoryService.getMovementsByVariant(variant.id)
          )
        );
        setMovements(allMovements.flat());
      }
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [params.id]);

  const load = () => {
    setLoading(true);
    setError(false);
    const id = params.id;
    Promise.all([
      productService.getProduct(id),
      productService.getVariants(id),
      productService.getIdentifiers(id),
      imageService.getImages(id),
      listingService.getListingsByProduct(id),
      inventoryService.getInventoryByProduct(id),
      supplierService.getProductSuppliers(id),
    ]).then(async ([p, v, idn, img, lst, inv, sup]) => {
      setProduct(p);
      setVariants(v);
      setIdentifiers(idn);
      setImages(img);
      setListings(lst);
      setInventory(inv);
      setSuppliers(sup);
      if (v.length > 0) {
        const allMovements = await Promise.all(
          v.map((variant) =>
            inventoryService.getMovementsByVariant(variant.id)
          )
        );
        setMovements(allMovements.flat());
      }
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  };

  const handleSave = async () => {
    if (!product || !formRef.current) return;
    setSaving(true);
    const container = formRef.current;
    const getVal = (name: string): string | null => {
      const el = container.querySelector(`[data-field="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      return el ? el.value : null;
    };
    const getSelectVal = (name: string): string | null => {
      const el = container.querySelector(`[data-field="${name}"]`) as HTMLElement | null;
      return el?.getAttribute('data-value') ?? null;
    };
    try {
      await productMutations.updateProduct(product.id, {
        titleMaster: getVal('titleMaster') ?? undefined,
        descriptionMaster: getVal('descriptionMaster') ?? undefined,
        brandName: getVal('brandName') ?? undefined,
        model: getVal('model') ?? undefined,
        manufacturer: getVal('manufacturer') ?? undefined,
        productType: getVal('productType') ?? undefined,
        condition: getSelectVal('condition') ?? undefined,
        status: getSelectVal('status') ?? undefined,
        taxProductCode: getVal('taxProductCode') ?? undefined,
        taxUnitCode: getVal('taxUnitCode') ?? undefined,
        taxObjectCode: getSelectVal('taxObjectCode') ?? undefined,
        launchDate: getVal('launchDate') || null,
      });
      setSaved(true);
      setProduct((prev) => prev ? {
        ...prev,
        titleMaster: getVal('titleMaster') ?? prev.titleMaster,
        updatedAt: new Date().toISOString(),
      } : prev);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaving(false);
    }
    setSaving(false);
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
          <div className="h-10 w-full animate-pulse rounded bg-muted/40" />
          <div className="h-64 w-full animate-pulse rounded bg-muted/40" />
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <PageHeader title="Producto no encontrado" />
        <div className="p-6">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Volver a productos
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={product.titleMaster}
        description={`${product.internalProductNumber} — ${product.brandName}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <Button size="sm" variant="default" onClick={handleSave} disabled={saving}>
              {saved ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </>
              )}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 border-b px-6 py-2 text-sm">
        <span className="text-muted-foreground">Estado:</span>
        <ProductStatusBadge status={product.status} />
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">Variantes:</span>
        <span className="font-medium">{variants.length}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">Publicaciones:</span>
        <span className="font-medium">{listings.length}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">Inventario total:</span>
        <span className="font-medium">
          {inventory.reduce((s, i) => s + i.onHand, 0)}
        </span>
      </div>

      <div className="p-6" ref={formRef}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="flex h-auto flex-wrap bg-muted/60">
            <TabsTrigger value="basic">Info. basica</TabsTrigger>
            <TabsTrigger value="variants">Variantes e identificadores</TabsTrigger>
            <TabsTrigger value="sales">Venta y atributos</TabsTrigger>
            <TabsTrigger value="content">Contenido por canal</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="listings">Publicaciones</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
            <TabsTrigger value="tax">Fiscal</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <ProductBasicInfoTab product={product} />
          </TabsContent>
          <TabsContent value="variants" className="mt-4">
            <ProductVariantsTab
              variants={variants}
              identifiers={identifiers}
              productId={product.id}
            />
          </TabsContent>
          <TabsContent value="sales" className="mt-4">
            <ProductSalesTab variants={variants} />
          </TabsContent>
          <TabsContent value="content" className="mt-4">
            <ProductContentTab product={product} />
          </TabsContent>
          <TabsContent value="media" className="mt-4">
            <ProductMediaTab images={images} />
          </TabsContent>
          <TabsContent value="listings" className="mt-4">
            <ProductListingsTab listings={listings} />
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
            <ProductInventoryTab
              inventory={inventory}
              movements={movements}
              variants={variants}
            />
          </TabsContent>
          <TabsContent value="suppliers" className="mt-4">
            <ProductSuppliersTab suppliers={suppliers} />
          </TabsContent>
          <TabsContent value="tax" className="mt-4">
            <ProductTaxTab product={product} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <ProductHistoryTab productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}


