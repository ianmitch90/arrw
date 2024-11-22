import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about ARRW and our mission to connect people through location-based experiences.',
};

export default function AboutPage() {
  return (
    <InfoPageContent>
      <h1>About ARRW</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
