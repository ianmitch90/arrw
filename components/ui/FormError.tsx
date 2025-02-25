import { FC } from 'react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: {
    message: string;
    code?: string;
  } | null;
  touched?: boolean;
  className?: string;
}

export const FormError: FC<FormErrorProps> = ({ error, touched, className }) => {
  if (!error || !touched) return null;

  return (
    <div className={cn('text-sm text-red-500 mt-1', className)}>
      {error.message}
    </div>
  );
};
