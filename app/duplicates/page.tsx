import { PlaceholderPage } from '@/components/layout/placeholder-page';

export default function DuplicatesPage() {
  return (
    <PlaceholderPage
      title="Duplicados"
      description="Grupos de productos sospechosos de ser duplicados."
      emptyTitle="No se detectaron duplicados"
      emptyDescription="El sistema no ha encontrado productos duplicados. La deteccion automatica se ejecutara en los trabajos nocturnos."
    />
  );
}
