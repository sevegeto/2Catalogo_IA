'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InventoryBalance, InventoryMovement, ProductVariant } from '@/types';

interface Props {
  inventory: InventoryBalance[];
  movements: InventoryMovement[];
  variants: ProductVariant[];
}

export function ProductInventoryTab({ inventory, movements }: Props) {
  const totalOnHand = inventory.reduce((s, i) => s + i.onHand, 0);
  const totalAvailable = inventory.reduce((s, i) => s + i.available, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.reserved, 0);
  const totalIncoming = inventory.reduce((s, i) => s + i.incoming, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Existencias</p>
            <p className="text-2xl font-bold">{totalOnHand}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Disponible</p>
            <p className="text-2xl font-bold text-emerald-600">{totalAvailable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reservado</p>
            <p className="text-2xl font-bold text-amber-600">{totalReserved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Entrante</p>
            <p className="text-2xl font-bold text-blue-600">{totalIncoming}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Saldos por almacen ({inventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variante / SKU</TableHead>
                  <TableHead>Almacen</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead className="text-center">Exist.</TableHead>
                  <TableHead className="text-center">Dispon.</TableHead>
                  <TableHead className="text-center">Reserv.</TableHead>
                  <TableHead className="text-center">Ocup.</TableHead>
                  <TableHead className="text-center">Danado</TableHead>
                  <TableHead className="text-center">Entrante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">
                      {inv.variantSku}
                    </TableCell>
                    <TableCell className="text-sm">{inv.warehouseName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {inv.locationCode ?? '—'}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {inv.onHand}
                    </TableCell>
                    <TableCell className="text-center text-emerald-600">
                      {inv.available}
                    </TableCell>
                    <TableCell className="text-center text-amber-600">
                      {inv.reserved}
                    </TableCell>
                    <TableCell className="text-center">{inv.occupied}</TableCell>
                    <TableCell className="text-center text-red-600">
                      {inv.damaged}
                    </TableCell>
                    <TableCell className="text-center text-blue-600">
                      {inv.incoming}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Historial de movimientos ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Almacen</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-center">Anterior</TableHead>
                  <TableHead className="text-center">Resultante</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Sin movimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {m.movementType}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {m.variantSku}
                      </TableCell>
                      <TableCell className="text-sm">{m.warehouseName}</TableCell>
                      <TableCell
                        className={
                          'text-center font-medium ' +
                          (m.quantity > 0 ? 'text-emerald-600' : 'text-red-600')
                        }
                      >
                        {m.quantity > 0 ? '+' : ''}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {m.previousQuantity}
                      </TableCell>
                      <TableCell className="text-center">{m.resultingQuantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.notes ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString('es-MX')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
