'use client';

import { useEffect, useState } from 'react';
import { Truck, Plus, Mail, Phone, Globe, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supplierService } from '@/lib/services';
import type { Supplier } from '@/types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
  });

  const load = () => {
    setLoading(true);
    setError(false);
    supplierService.getSuppliers()
      .then((s) => setSuppliers(s))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newSupplier.companyName) return;
    setCreating(true);
    try {
      await supplierService.createSupplier({
        companyName: newSupplier.companyName,
        contactName: newSupplier.contactName || undefined,
        email: newSupplier.email || undefined,
        phone: newSupplier.phone || undefined,
        website: newSupplier.website || undefined,
      });
      setShowNew(false);
      setNewSupplier({ companyName: '', contactName: '', email: '', phone: '', website: '' });
      load();
    } catch {
      setCreating(false);
    }
    setCreating(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Proveedores"
        description="Directorio de proveedores y costos de compra."
        actions={
          <Button size="sm" variant="default" onClick={() => setShowNew(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo proveedor
          </Button>
        }
      />
      <div className="p-6">
        {error ? (
          <ErrorState onRetry={load} />
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="rounded-lg border p-12 text-center">
            <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Sin proveedores registrados. Crea uno para empezar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {suppliers.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.companyName}</p>
                        <p className="text-xs text-muted-foreground">{s.contactName ?? 'Sin contacto'}</p>
                      </div>
                    </div>
                    <Badge variant={s.active ? 'default' : 'secondary'}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    {s.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {s.email}
                      </p>
                    )}
                    {s.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {s.phone}
                      </p>
                    )}
                    {s.website && (
                      <p className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3" />
                        <a href={s.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
                          {s.website}
                        </a>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Empresa *</Label>
              <Input
                value={newSupplier.companyName}
                onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
                placeholder="Nombre de la empresa"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Contacto</Label>
              <Input
                value={newSupplier.contactName}
                onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
                placeholder="Nombre del contacto"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  placeholder="proveedor@email.com"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Telefono</Label>
                <Input
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="+52 555 123 4567"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sitio web</Label>
              <Input
                value={newSupplier.website}
                onChange={(e) => setNewSupplier({ ...newSupplier, website: e.target.value })}
                placeholder="https://proveedor.com"
                className="h-9"
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
              disabled={creating || !newSupplier.companyName}
            >
              {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Crear proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
