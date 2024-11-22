import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'ARRW Cookie Policy - Learn how we use cookies and similar technologies.',
};

export default function CookiePolicyPage() {
  return (
    <InfoPageContent>
      <h1>Cookie Policy</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
