'use client';

import { useEffect, useState } from 'react';
import { Truck, Plus, Mail, Phone, Globe } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supplierService } from '@/lib/services';
import type { Supplier } from '@/types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getSuppliers().then((s) => {
      setSuppliers(s);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Proveedores"
        description="Directorio de proveedores y costos de compra."
        actions={
          <Button size="sm" variant="default">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo proveedor
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
    </AppShell>
  );
}
