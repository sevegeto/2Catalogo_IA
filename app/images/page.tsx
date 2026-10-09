'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Check, X } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ImageStatusBadge } from '@/components/layout/status-badges';
import { imageGlobalService } from '@/lib/services';
import type { ProductImage } from '@/types';

export default function ImagesPage() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    imageGlobalService.getAllImages().then((imgs) => {
      setImages(imgs);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    await imageGlobalService.approveImage(id);
    load();
  };

  const handleReject = async (id: string) => {
    await imageGlobalService.rejectImage(id);
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Imagenes"
        description="Galeria global de imagenes, procesamiento y aprobacion."
      />
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-lg border p-12 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Sin imagenes registradas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="rounded-lg border overflow-hidden">
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
                  {!img.approved && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">
                      Pendiente
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/products/${img.productId}`} className="text-xs font-medium hover:underline">
                      Ver producto
                    </Link>
                    <ImageStatusBadge status={img.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{img.originalFilename}</p>
                  <div className="flex items-center gap-2 border-t pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleApprove(img.id)}
                    >
                      <Check className="mr-1 h-3 w-3" /> Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleReject(img.id)}
                    >
                      <X className="mr-1 h-3 w-3" /> Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
