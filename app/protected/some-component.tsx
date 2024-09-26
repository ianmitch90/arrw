import { useAuth } from '@/hooks/useAuth';

export default function ProtectedComponent() {
  useAuth(); // This will redirect to /login if not authenticated

  return <div>Protected Content</div>;
}
