import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Safety Guidelines',
  description: 'ARRW Safety Guidelines - Stay safe while using our platform.',
};

export default function SafetyPage() {
  return (
    <InfoPageContent>
      <h1>Safety Guidelines</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
