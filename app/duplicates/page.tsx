'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productService } from '@/lib/services';
import { ErrorState } from '@/components/layout/error-state';
import type { Product } from '@/types';

export default function DuplicatesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    productService
      .getProducts()
      .then((p) => setProducts(p))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const duplicateGroups = (() => {
    const byKey = new Map<string, Product[]>();
    for (const p of products) {
      const key = `${p.brandName?.toLowerCase()}_${p.model?.toLowerCase()}`;
      if (!key || key === '_') continue;
      const existing = byKey.get(key) ?? [];
      existing.push(p);
      byKey.set(key, existing);
    }
    return Array.from(byKey.entries())
      .filter(([, group]) => group.length > 1)
      .map(([key, group]) => ({ key, products: group }));
  })();

  const hasDuplicates = duplicateGroups.length > 0;

  return (
    <AppShell>
      <PageHeader
        title="Duplicados"
        description="Grupos de productos sospechosos de ser duplicados."
      />
      <div className="space-y-4 p-6">
        {error ? (
          <ErrorState onRetry={load} />
        ) : loading ? (
          <div className="h-32 animate-pulse rounded-lg border bg-muted/40" />
        ) : !hasDuplicates ? (
          <div className="rounded-lg border p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-3 font-medium text-sm">No se detectaron duplicados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              El sistema no ha encontrado productos con la misma marca y modelo. La deteccion automatica mas profunda se ejecutara en los trabajos nocturnos.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Grupos sospechosos</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{duplicateGroups.length}</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Productos en grupos</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {duplicateGroups.reduce((s, g) => s + g.products.length, 0)}
                </p>
              </div>
            </div>

            {duplicateGroups.map((group, idx) => (
              <Card key={group.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Copy className="h-4 w-4 text-amber-500" />
                    Grupo {idx + 1}: {group.products[0].brandName} — {group.products[0].model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N. Interno</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Variantes</TableHead>
                          <TableHead>Actualizado</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.products.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs">
                              {p.internalProductNumber}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {p.titleMaster}
                            </TableCell>
                            <TableCell className="text-xs">{p.status}</TableCell>
                            <TableCell className="text-center text-sm">
                              {p.variantCount}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(p.updatedAt).toLocaleDateString('es-MX')}
                            </TableCell>
                            <TableCell>
                              <Link href={`/products/${p.id}`}>
                                <Button size="sm" variant="ghost" className="h-7 text-xs">
                                  Ver producto
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}
