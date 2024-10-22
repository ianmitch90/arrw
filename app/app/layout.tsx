'use client';
import { useAuth } from '@/utils/auth-helpers/useAuth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) return null;
  return <>{children}</>;
}
