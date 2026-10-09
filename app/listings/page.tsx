'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ListingStatusBadge } from '@/components/layout/status-badges';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listingService } from '@/lib/services';
import type { MarketplaceListing } from '@/types';

const marketplaceLabel: Record<string, string> = {
  MERCADOLIBRE: 'MercadoLibre',
  AMAZON: 'Amazon',
  SHOPIFY: 'Shopify',
};

export default function ListingsPage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    listingService.getListings().then((l) => {
      setListings(l);
      setLoading(false);
    });
  }, []);

  const filtered = listings.filter(
    (l) => filter === 'ALL' || l.listingStatus === filter
  );

  return (
    <AppShell>
      <PageHeader
        title="Publicaciones"
        description="Anuncios en marketplaces enlazados a productos del catalogo."
      />

      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activas</SelectItem>
              <SelectItem value="PAUSED">Pausadas</SelectItem>
              <SelectItem value="ERROR">Con error</SelectItem>
              <SelectItem value="CLOSED">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead className="min-w-48">Titulo</TableHead>
                <TableHead>ID publicacion</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU canal</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ult. sync</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 animate-pulse rounded bg-muted/40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/40">
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                        {marketplaceLabel[l.marketplace] ?? l.marketplace}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{l.accountName}</TableCell>
                    <TableCell className="text-sm">
                      <Link
                        href={`/products/${l.productId}`}
                        className="font-medium hover:underline"
                      >
                        {l.listingTitle}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.marketplaceListingId}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link
                        href={`/products/${l.productId}`}
                        className="text-blue-600 hover:underline"
                      >
                        Ver producto
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.sellerSku ?? '—'}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} publicaciones
        </p>
      </div>
    </AppShell>
  );
}
