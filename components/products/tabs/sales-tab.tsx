'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductVariant } from '@/types';

interface Props {
  variants: ProductVariant[];
}

export function ProductSalesTab({ variants }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Precios y costos por variante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {variants.map((v) => (
              <div key={v.id} className="rounded-lg border p-4 space-y-3">
                <p className="font-medium text-sm">{v.variantName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {v.internalSku}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Costo de compra
                    </Label>
                    <Input
                      defaultValue={v.purchaseCost ?? ''}
                      className="h-9"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Precio de venta
                    </Label>
                    <Input
                      defaultValue={v.retailPrice ?? ''}
                      className="h-9"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Moneda
                    </Label>
                    <Input
                      defaultValue={v.currency}
                      className="h-9"
                      readOnly
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Unidad de medida
                    </Label>
                    <Input
                      defaultValue={v.unitOfMeasure ?? ''}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Atributos de empaque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {variants.map((v) => (
              <div key={v.id} className="rounded-lg border p-4 space-y-3">
                <p className="font-medium text-sm">{v.internalSku}</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Largo (cm)</span>
                    <p>{v.packageLengthCm ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Ancho (cm)</span>
                    <p>{v.packageWidthCm ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Alto (cm)</span>
                    <p>{v.packageHeightCm ?? '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
