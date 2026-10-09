'use client';

import { useEffect, useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, MapPin, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { warehouseService } from '@/lib/services';
import type { Warehouse } from '@/types';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    street: '',
    city: '',
    state: '',
    country: 'Mexico',
    isDefault: false,
  });

  const load = () => {
    setLoading(true);
    setError(false);
    warehouseService.getWarehouses()
      .then((w) => setWarehouses(w))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newWarehouse.name || !newWarehouse.code) return;
    setCreating(true);
    try {
      await warehouseService.createWarehouse({
        name: newWarehouse.name,
        code: newWarehouse.code,
        street: newWarehouse.street || undefined,
        city: newWarehouse.city || undefined,
        state: newWarehouse.state || undefined,
        country: newWarehouse.country || undefined,
        isDefault: newWarehouse.isDefault,
      });
      setShowNew(false);
      setNewWarehouse({ name: '', code: '', street: '', city: '', state: '', country: 'Mexico', isDefault: false });
      load();
    } catch {
      setCreating(false);
    }
    setCreating(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Almacenes"
        description="Gestion de almacenes, anaqueles y ubicaciones."
        actions={
          <Button size="sm" variant="default" onClick={() => setShowNew(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo almacen
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
        ) : warehouses.length === 0 ? (
          <div className="rounded-lg border p-12 text-center">
            <WarehouseIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Sin almacenes registrados. Crea uno para empezar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {warehouses.map((w) => (
              <Card key={w.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <WarehouseIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{w.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {w.isDefault && <Badge>Principal</Badge>}
                      <Badge variant={w.active ? 'default' : 'secondary'}>
                        {w.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {w.address.street}, {w.address.city}, {w.address.state}, {w.address.country}
                    </span>
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
            <DialogTitle>Nuevo almacen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nombre *</Label>
                <Input
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  placeholder="Almacen Central"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Codigo *</Label>
                <Input
                  value={newWarehouse.code}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                  placeholder="WH-001"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Calle</Label>
              <Input
                value={newWarehouse.street}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, street: e.target.value })}
                placeholder="Av. Reforma 100"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ciudad</Label>
                <Input
                  value={newWarehouse.city}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                  placeholder="CDMX"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <Input
                  value={newWarehouse.state}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, state: e.target.value })}
                  placeholder="CDMX"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pais</Label>
                <Input
                  value={newWarehouse.country}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, country: e.target.value })}
                  placeholder="Mexico"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="wh-default" className="text-sm">Almacen principal</Label>
              <Switch
                id="wh-default"
                checked={newWarehouse.isDefault}
                onCheckedChange={(v) => setNewWarehouse({ ...newWarehouse, isDefault: v })}
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
              disabled={creating || !newWarehouse.name || !newWarehouse.code}
            >
              {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Crear almacen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
