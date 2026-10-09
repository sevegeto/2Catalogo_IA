'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types';

interface Props {
  product: Product;
}

export function ProductBasicInfoTab({ product }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Informacion general</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Numero interno
            </Label>
            <Input defaultValue={product.internalProductNumber} className="h-9" data-field="internalProductNumber" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Marca</Label>
            <Input defaultValue={product.brandName} className="h-9" data-field="brandName" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Nombre maestro
            </Label>
            <Input defaultValue={product.titleMaster} className="h-9" data-field="titleMaster" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Modelo</Label>
            <Input defaultValue={product.model} className="h-9" data-field="model" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fabricante</Label>
            <Input defaultValue={product.manufacturer} className="h-9" data-field="manufacturer" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Condicion</Label>
            <Select defaultValue={product.condition} onValueChange={(v) => { const el = document.querySelector('[data-field="condition"]'); if (el) el.setAttribute('data-value', v); }}>
              <SelectTrigger className="h-9" data-field="condition" data-value={product.condition}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">Nuevo</SelectItem>
                <SelectItem value="USED">Usado</SelectItem>
                <SelectItem value="REFURBISHED">Reacondicionado</SelectItem>
                <SelectItem value="OPEN_BOX">Caja abierta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select defaultValue={product.status} onValueChange={(v) => { const el = document.querySelector('[data-field="status"]'); if (el) el.setAttribute('data-value', v); }}>
              <SelectTrigger className="h-9" data-field="status" data-value={product.status}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="IN_REVIEW">En revision</SelectItem>
                <SelectItem value="ARCHIVED">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Descripcion maestra
            </Label>
            <Textarea
              defaultValue={product.descriptionMaster}
              rows={4}
              className="resize-none"
              data-field="descriptionMaster"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Clasificacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo de producto</Label>
            <Input defaultValue={product.productType} className="h-9" data-field="productType" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Fecha de lanzamiento
            </Label>
            <Input
              type="date"
              defaultValue={
                product.launchDate ? product.launchDate.split('T')[0] : ''
              }
              className="h-9"
              data-field="launchDate"
            />
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">UUID interno</p>
            <p className="mt-1 break-all font-mono">{product.id}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Creado por</p>
            <p className="mt-1">{product.createdBy}</p>
            <p className="mt-2 font-medium text-foreground">Actualizado por</p>
            <p className="mt-1">{product.updatedBy}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
