import type { Metadata } from 'next';
import { InfoPageContainer } from '@/components/ui/InfoPage/InfoPageContainer';

export const metadata: Metadata = {
  title: {
    template: '%s | ARRW',
    default: 'ARRW - Information',
  },
  description: 'Learn more about ARRW - Location-based social platform',
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InfoPageContainer>{children}</InfoPageContainer>;
}
