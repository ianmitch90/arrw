import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ARRW Terms of Service - Read about our terms and conditions.',
};

export default function TermsPage() {
  return (
    <InfoPageContent>
      <h1>Terms of Service</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
