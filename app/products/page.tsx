'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, ImageIcon, Store } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ProductStatusBadge } from '@/components/layout/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productService, productMutations } from '@/lib/services';
import type { Product } from '@/types';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newProduct, setNewProduct] = useState({
    internalProductNumber: '',
    titleMaster: '',
    descriptionMaster: '',
    brandName: '',
    model: '',
    condition: 'NEW',
    status: 'DRAFT',
  });

  const loadProducts = () => {
    setLoading(true);
    productService.getProducts().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  };

  useEffect(() => { loadProducts(); }, []);

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

  const handleCreate = async () => {
    if (!newProduct.internalProductNumber || !newProduct.titleMaster) return;
    setCreating(true);
    try {
      const created = await productMutations.createProduct({
        internalProductNumber: newProduct.internalProductNumber,
        titleMaster: newProduct.titleMaster,
        descriptionMaster: newProduct.descriptionMaster || undefined,
        brandName: newProduct.brandName || undefined,
        model: newProduct.model || undefined,
        condition: newProduct.condition,
        status: newProduct.status,
      });
      setShowNew(false);
      setNewProduct({
        internalProductNumber: '', titleMaster: '', descriptionMaster: '',
        brandName: '', model: '', condition: 'NEW', status: 'DRAFT',
      });
      if (created) {
        router.push(`/products/${created.id}`);
      } else {
        loadProducts();
      }
    } catch {
      setCreating(false);
    }
    setCreating(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Productos"
        description="Catalogo central de productos y sus variantes."
        actions={
          <Button size="sm" variant="default" onClick={() => setShowNew(true)}>
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
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Numero interno *</Label>
              <Input
                value={newProduct.internalProductNumber}
                onChange={(e) => setNewProduct({ ...newProduct, internalProductNumber: e.target.value })}
                placeholder="Ej. SP3S16909"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre maestro *</Label>
              <Input
                value={newProduct.titleMaster}
                onChange={(e) => setNewProduct({ ...newProduct, titleMaster: e.target.value })}
                placeholder="Ej. Pechera Mariconera Concealed Carry"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Marca</Label>
                <Input
                  value={newProduct.brandName}
                  onChange={(e) => setNewProduct({ ...newProduct, brandName: e.target.value })}
                  placeholder="Ej. SP3S"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Modelo</Label>
                <Input
                  value={newProduct.model}
                  onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                  placeholder="Ej. SP3S16909"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Condicion</Label>
                <Select
                  value={newProduct.condition}
                  onValueChange={(v) => setNewProduct({ ...newProduct, condition: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Nuevo</SelectItem>
                    <SelectItem value="USED">Usado</SelectItem>
                    <SelectItem value="REFURBISHED">Reacondicionado</SelectItem>
                    <SelectItem value="OPEN_BOX">Caja abierta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <Select
                  value={newProduct.status}
                  onValueChange={(v) => setNewProduct({ ...newProduct, status: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="IN_REVIEW">En revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descripcion</Label>
              <Textarea
                value={newProduct.descriptionMaster}
                onChange={(e) => setNewProduct({ ...newProduct, descriptionMaster: e.target.value })}
                rows={3}
                placeholder="Descripcion del producto..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !newProduct.internalProductNumber || !newProduct.titleMaster}
            >
              {creating ? 'Creando...' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
