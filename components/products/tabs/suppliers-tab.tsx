'use client';

import { Plus, Star, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProductSupplier } from '@/types';

interface Props {
  suppliers: ProductSupplier[];
}

export function ProductSuppliersTab({ suppliers }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">
          Proveedores ({suppliers.length})
        </CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Anadir proveedor
        </Button>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin proveedores asignados.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>SKU proveedor</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead className="text-center">Min. orden</TableHead>
                  <TableHead className="text-center">Multiplo</TableHead>
                  <TableHead className="text-center">Lead time</TableHead>
                  <TableHead>Principal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.supplierName}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.supplierSku ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {s.purchaseCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">{s.currency}</TableCell>
                    <TableCell className="text-center text-sm">
                      {s.minimumOrderQuantity ?? '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {s.purchaseMultiple ?? '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {s.leadTimeDays ? `${s.leadTimeDays}d` : '—'}
                    </TableCell>
                    <TableCell>
                      {s.isDefault ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
