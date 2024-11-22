import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ARRW Privacy Policy - Learn how we protect your data and privacy.',
};

export default function PrivacyPage() {
  return (
    <InfoPageContent>
      <h1>Privacy Policy</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
