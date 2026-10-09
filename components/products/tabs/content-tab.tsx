'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Product } from '@/types';

interface Props {
  product: Product;
}

export function ProductContentTab({ product }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contenido maestro</CardTitle>
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
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Contenido por canal (demo)
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
