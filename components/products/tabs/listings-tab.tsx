'use client';

import { Plus, ExternalLink, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListingStatusBadge } from '@/components/layout/status-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MarketplaceListing } from '@/types';

interface Props {
  listings: MarketplaceListing[];
}

const marketplaceLabel: Record<string, string> = {
  MERCADOLIBRE: 'MercadoLibre',
  AMAZON: 'Amazon',
  SHOPIFY: 'Shopify',
};

export function ProductListingsTab({ listings }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">
          Publicaciones enlazadas ({listings.length})
        </CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Enlazar publicacion
        </Button>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin publicaciones enlazadas. Este producto no esta publicado en
            ningun marketplace.
          </p>
        ) : (
          <>
            <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              Este producto tiene {listings.length} publicaciones enlazadas.
              Todas corresponden al mismo producto, no son productos diferentes.
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="min-w-48">Titulo</TableHead>
                    <TableHead>SKU canal</TableHead>
                    <TableHead>ID publicacion</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ult. sync</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <Store className="h-3.5 w-3.5 text-muted-foreground" />
                          {marketplaceLabel[l.marketplace] ?? l.marketplace}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{l.accountName}</TableCell>
                      <TableCell className="text-sm">{l.listingTitle}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {l.sellerSku ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {l.marketplaceListingId}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {l.currency} {l.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {l.availableQuantity ?? '—'}
                      </TableCell>
                      <TableCell>
                        <ListingStatusBadge status={l.listingStatus} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.lastSyncedAt
                          ? new Date(l.lastSyncedAt).toLocaleDateString('es-MX')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {l.listingUrl ? (
                          <a
                            href={l.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
