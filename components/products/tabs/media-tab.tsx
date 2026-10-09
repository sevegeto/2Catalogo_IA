'use client';

import {
  Plus,
  Star,
  Check,
  X,
  Download,
  Wand2,
  Copy,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageStatusBadge } from '@/components/layout/status-badges';
import type { ProductImage } from '@/types';

interface Props {
  images: ProductImage[];
}

export function ProductMediaTab({ images }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">
          Galeria de imagenes ({images.length})
        </CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Anadir imagen
        </Button>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin imagenes. Anade URLs o solicita descarga desde una captura.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((img) => (
                <div
                  key={img.id}
                  className="rounded-lg border overflow-hidden"
                >
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={img.originalUrl}
                      alt={img.altText ?? ''}
                      className="h-full w-full object-cover"
                    />
                    {img.imageType === 'MAIN' && (
                      <div className="absolute top-2 left-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                        Principal
                      </div>
                    )}
                    {img.generatedByAi && (
                      <div className="absolute top-2 right-2 rounded-md bg-violet-500 px-1.5 py-0.5 text-xs font-medium text-white">
                        IA
                      </div>
                    )}
                    {!img.approved && (
                      <div className="absolute bottom-2 right-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">
                        Pendiente
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {img.imageType}
                      </span>
                      <ImageStatusBadge status={img.status} />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        {img.width && img.height
                          ? `${img.width} x ${img.height}px`
                          : 'Resolucion desconocida'}
                      </p>
                      <p>{img.originalFilename}</p>
                      <p>Fuente: {img.source}</p>
                      {img.sha256 && (
                        <p className="font-mono text-[10px]">
                          SHA: {img.sha256.slice(0, 12)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 border-t pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                      >
                        <Wand2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
