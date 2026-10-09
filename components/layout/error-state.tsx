'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
      <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
      <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">
        {message ?? 'Error al cargar los datos'}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
