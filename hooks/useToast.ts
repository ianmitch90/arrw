import { useCallback } from 'react';
import { useToast as useRadixToast } from '@/components/ui/use-toast';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const { toast } = useRadixToast();

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      options?: ToastOptions
    ) => {
      toast({
        description: message,
        variant: type,
        duration: options?.duration || 3000,
        action: options?.action
          ? {
              altText: options.action.label,
              onClick: options.action.onClick,
              children: options.action.label
            }
          : undefined
      });
    },
    [toast]
  );

  return { showToast };
}
