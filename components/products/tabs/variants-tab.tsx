'use client';

import { Plus, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VerificationStatusBadge } from '@/components/layout/status-badges';
import type { ProductIdentifier, ProductVariant } from '@/types';

interface Props {
  variants: ProductVariant[];
  identifiers: ProductIdentifier[];
  productId: string;
}

export function ProductVariantsTab({ variants, identifiers }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">
            Variantes ({variants.length})
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            Crear variante
          </Button>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin variantes. Crea una para empezar a gestionar inventario.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{v.variantName}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {v.internalSku}
                        {v.skuAlias ? ` — ${v.skuAlias}` : ''}
                      </p>
                    </div>
                    {v.active ? (
                      <span className="text-xs font-medium text-emerald-600">
                        Activa
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Color</span>
                      <p>{v.color ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Tamano</span>
                      <p>{v.size ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Material</span>
                      <p>{v.material ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cant. paq.</span>
                      <p>{v.packageQuantity ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Peso (g)</span>
                      <p>{v.packageWeightGrams ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Medidas (cm)</span>
                      <p>
                        {v.packageLengthCm && v.packageWidthCm && v.packageHeightCm
                          ? `${v.packageLengthCm} x ${v.packageWidthCm} x ${v.packageHeightCm}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">
            Identificadores ({identifiers.length})
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            Anadir identificador
          </Button>
        </CardHeader>
        <CardContent>
          {identifiers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin identificadores. Anade UPC, EAN, MPN o ASIN.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Verificacion</TableHead>
                    <TableHead>Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {identifiers.map((idn) => (
                    <TableRow key={idn.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {idn.identifierType}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {idn.identifierValue}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {idn.variantId ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {idn.source}
                      </TableCell>
                      <TableCell>
                        <VerificationStatusBadge
                          status={idn.verificationStatus}
                        />
                      </TableCell>
                      <TableCell>
                        {idn.isPrimary ? (
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
    </div>
  );
}
