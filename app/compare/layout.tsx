// app/compare/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Phones Side by Side | Mobylite',
  description:
    'Compare smartphones side by side. See specs, prices, cameras, battery, and performance differences to find your perfect phone.',
  keywords: ['compare phones', 'phone comparison', 'smartphone comparison', 'side by side'],
  openGraph: {
    title: 'Compare Phones Side by Side | Mobylite',
    description: 'Compare up to 4 smartphones side by side with detailed spec breakdowns.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Phones | Mobylite',
    description: 'Compare up to 4 smartphones side by side.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
