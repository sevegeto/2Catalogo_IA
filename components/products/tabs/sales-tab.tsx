'use client';

import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { productMutations } from '@/lib/services';
import type { ProductVariant } from '@/types';

interface Props {
  variants: ProductVariant[];
}

export function ProductSalesTab({ variants }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const v of variants) {
        const cost = (document.querySelector(`[data-field="cost_${v.id}"]`) as HTMLInputElement)?.value;
        const price = (document.querySelector(`[data-field="price_${v.id}"]`) as HTMLInputElement)?.value;
        const uom = (document.querySelector(`[data-field="uom_${v.id}"]`) as HTMLInputElement)?.value;
        await productMutations.updateVariant(v.id, {
          purchaseCost: cost !== undefined && cost !== '' ? parseFloat(cost) : null,
          retailPrice: price !== undefined && price !== '' ? parseFloat(price) : null,
          unitOfMeasure: uom ?? null,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaving(false);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">
            Precios y costos por variante
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || variants.length === 0}>
            {saved ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
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
                      type="number"
                      step="0.01"
                      data-field={`cost_${v.id}`}
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
                      type="number"
                      step="0.01"
                      data-field={`price_${v.id}`}
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
                      data-field={`uom_${v.id}`}
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
