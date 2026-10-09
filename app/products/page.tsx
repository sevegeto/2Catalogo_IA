'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Filter, ImageIcon, Barcode, Store } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ProductStatusBadge } from '@/components/layout/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productService } from '@/lib/services';
import type { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    productService.getProducts().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.titleMaster.toLowerCase().includes(search.toLowerCase()) ||
        p.internalProductNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.brandName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Productos"
        description="Catalogo central de productos y sus variantes."
        actions={
          <Button size="sm" variant="default">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo producto
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, numero interno o marca..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="IN_REVIEW">En revision</SelectItem>
              <SelectItem value="ARCHIVED">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>N. Interno</TableHead>
                <TableHead className="min-w-64">Nombre</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-center">Var.</TableHead>
                <TableHead className="text-center">Inv.</TableHead>
                <TableHead className="text-center">Publ.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Actualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 animate-pulse rounded bg-muted/40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron productos con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell>
                      {p.primaryImageUrl ? (
                        <img
                          src={p.primaryImageUrl}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.internalProductNumber}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.titleMaster}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{p.brandName}</TableCell>
                    <TableCell className="text-sm">{p.model}</TableCell>
                    <TableCell className="text-center text-sm">
                      {p.variantCount}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span
                        className={
                          p.totalInventory === 0 ? 'text-red-600 font-medium' : ''
                        }
                      >
                        {p.totalInventory}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {p.listingCount > 0 ? (
                          <>
                            <Store className="h-3 w-3 text-muted-foreground" />
                            {p.listingCount}
                          </>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.updatedAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filtered.length} de {products.length} productos
          </span>
          <span className="flex items-center gap-1">
            <Barcode className="h-3 w-3" /> Demo data
          </span>
        </div>
      </div>
    </AppShell>
  );
}
