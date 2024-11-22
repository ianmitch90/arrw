import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'ARRW Community Guidelines - Our standards for a respectful and inclusive community.',
};

export default function CommunityGuidelinesPage() {
  return (
    <InfoPageContent>
      <h1>Community Guidelines</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
