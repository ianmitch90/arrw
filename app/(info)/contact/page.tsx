import type { Metadata } from 'next';
import { InfoPageContent } from '@/components/ui/InfoPage/InfoPageContent';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact ARRW - Get in touch with our team.',
};

export default function ContactPage() {
  return (
    <InfoPageContent>
      <h1>Contact Us</h1>
      <p>Content coming soon...</p>
    </InfoPageContent>
  );
}
