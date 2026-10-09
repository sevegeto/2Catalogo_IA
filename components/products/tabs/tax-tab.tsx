'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function ProductTaxTab({ product }: Props) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Informacion fiscal</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Codigo de producto fiscal
          </Label>
          <Input defaultValue={product.taxProductCode ?? ''} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Codigo de unidad fiscal
          </Label>
          <Input defaultValue={product.taxUnitCode ?? ''} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Codigo de objeto fiscal
          </Label>
          <Select defaultValue={product.taxObjectCode ?? ''}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="01">01 — No causa del impuesto</SelectItem>
              <SelectItem value="02">02 — Objeto del impuesto</SelectItem>
              <SelectItem value="03">03 — Sujeto al 0%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
