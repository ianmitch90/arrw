'use client';
import { useAuth } from '@/utils/auth-helpers/useAuth';
import { Loading } from '@/components/ui/Loading';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) return <Loading />;

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
