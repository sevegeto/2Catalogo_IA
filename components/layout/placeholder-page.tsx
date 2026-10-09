import { Construction } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';

interface PlaceholderPageProps {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function PlaceholderPage({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: PlaceholderPageProps) {
  return (
    <AppShell>
      <PageHeader title={title} description={description} />
      <div className="p-6">
        <div className="rounded-lg border">
          <EmptyState
            icon={Construction}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      </div>
    </AppShell>
  );
}
