import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'ARRW Accessibility - Learn about our commitment to accessibility.',
};

export default function AccessibilityPage() {
  return (
    <InfoPageContent>
      <h1>Accessibility</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
