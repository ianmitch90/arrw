import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Support',
  description: 'ARRW Support - Get help with your account and platform features.',
};

export default function SupportPage() {
  return (
    <InfoPageContent>
      <h1>Support</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
