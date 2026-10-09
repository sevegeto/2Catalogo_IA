'use client';

import { useEffect, useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, MapPin } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { warehouseService } from '@/lib/services';
import type { Warehouse } from '@/types';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warehouseService.getWarehouses().then((w) => {
      setWarehouses(w);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Almacenes"
        description="Gestion de almacenes, anaqueles y ubicaciones."
        actions={
          <Button size="sm" variant="default">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo almacen
          </Button>
        }
      />
      <div className="p-6">
        {loading ? (
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
    </AppShell>
  );
}
