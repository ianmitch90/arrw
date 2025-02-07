import { useToast as useUIToast } from '@/components/ui/use-toast';
import type { ToastProps, ToastActionElement } from '@/components/ui/toast';
import Button from '@/components/ui/Button';
import { createElement, type ReactElement } from 'react';

export function useToast() {
  const { toast } = useUIToast();

  const showToast = (
    message: string,
    variant: ToastProps['variant'] = 'default',
    options?: { action?: { label: string; onClick: () => void } }
  ) => {
    const toastAction: ToastActionElement | undefined = options?.action
      ? createElement(Button, {
          onClick: options.action.onClick,
          children: options.action.label,
        }) as ToastActionElement
      : undefined;

    toast({
      title: message,
      variant,
      action: toastAction,
    });
  };

  return { showToast };
}
