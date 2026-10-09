'use client';

import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { productMutations } from '@/lib/services';
import type { Product } from '@/types';

interface Props {
  product: Product;
}

export function ProductContentTab({ product }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const title = (document.querySelector('[data-field="contentTitleMaster"]') as HTMLTextAreaElement)?.value;
    const desc = (document.querySelector('[data-field="contentDescriptionMaster"]') as HTMLTextAreaElement)?.value;
    try {
      await productMutations.updateProduct(product.id, {
        titleMaster: title ?? undefined,
        descriptionMaster: desc ?? undefined,
      });
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
          <CardTitle className="text-sm">Contenido maestro</CardTitle>
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
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
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Titulo maestro
            </Label>
            <Textarea
              defaultValue={product.titleMaster}
              rows={2}
              className="resize-none"
              data-field="contentTitleMaster"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Descripcion maestra
            </Label>
            <Textarea
              defaultValue={product.descriptionMaster}
              rows={6}
              className="resize-none"
              data-field="contentDescriptionMaster"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Contenido por canal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">MercadoLibre — MITIENDOTA</span>
              <span className="text-xs text-emerald-600">Optimizado</span>
            </div>
            <Textarea
              defaultValue="Pechera Mariconera Concealed Carry Crossbody Bag para Hombre. Porta oculta discreta, color negro, material nylon resistente. Compartimentos organizadores."
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amazon</span>
              <span className="text-xs text-amber-600">Pendiente de generacion</span>
            </div>
            <Textarea
              placeholder="No se ha generado contenido para este canal."
              rows={3}
              className="resize-none text-sm"
              readOnly
            />
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Shopify</span>
              <span className="text-xs text-muted-foreground">Sin configurar</span>
            </div>
            <Textarea
              placeholder="No se ha generado contenido para este canal."
              rows={3}
              className="resize-none text-sm"
              readOnly
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
