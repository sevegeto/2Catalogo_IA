'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Boxes, Package, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { inventoryGlobalService, inventoryService } from '@/lib/services';
import { ErrorState } from '@/components/layout/error-state';
import type { InventoryBalance, ProductVariant } from '@/types';
import { productService } from '@/lib/services';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryBalance[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      inventoryGlobalService.getAllInventory(),
      productService.getProducts(),
    ])
      .then(async ([inv, products]) => {
        const allVariants = await Promise.all(products.map((p) => productService.getVariants(p.id)));
        const variantMap: Record<string, ProductVariant> = {};
        allVariants.flat().forEach((v) => { variantMap[v.id] = v; });
        setInventory(inv);
        setVariants(variantMap);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Inventario"
        description="Existencias por producto, variante, almacen y ubicacion."
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total items</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {inventory.reduce((s, i) => s + i.onHand, 0)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Disponible</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {inventory.reduce((s, i) => s + i.available, 0)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Reservado</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {inventory.reduce((s, i) => s + i.reserved, 0)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Alertas</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {inventory.filter((i) => i.available < 5).length}
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState onRetry={load} />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Almacen</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead className="text-center">Exist.</TableHead>
                  <TableHead className="text-center">Disp.</TableHead>
                  <TableHead className="text-center">Reserv.</TableHead>
                  <TableHead className="text-center">Entr.</TableHead>
                  <TableHead>Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-5 animate-pulse rounded bg-muted/40" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      Sin registros de inventario.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((i) => {
                    const variant = variants[i.variantId];
                    return (
                      <TableRow key={i.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">
                          {variant ? (
                            <Link href={`/products/${variant.productId}`} className="hover:underline">
                              {i.variantSku}
                            </Link>
                          ) : (
                            i.variantSku
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {variant?.variantName ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm">{i.warehouseName}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {i.locationCode ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">{i.onHand}</TableCell>
                        <TableCell className="text-center text-sm">
                          <span className={i.available < 5 ? 'font-medium text-amber-600' : ''}>
                            {i.available}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm">{i.reserved}</TableCell>
                        <TableCell className="text-center text-sm">
                          {i.incoming > 0 ? <span className="text-emerald-600">{i.incoming}</span> : '0'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(i.updatedAt).toLocaleDateString('es-MX')}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
