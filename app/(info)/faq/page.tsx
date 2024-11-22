import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'ARRW FAQ - Find answers to common questions about our platform.',
};

export default function FAQPage() {
  return (
    <InfoPageContent>
      <h1>Frequently Asked Questions</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
