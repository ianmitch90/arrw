import { Metadata } from 'next';
import LayoutProvider from './LayoutProvider';
import { PropsWithChildren } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';

const title = 'Dating App';
const description = 'Find your perfect match nearby.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="dark text-foreground bg-background h-full w-full">
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}
