// app/compare/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Phones Side by Side | Mobylite',
  description:
    'Compare up to 4 smartphones side by side. Specs, prices, cameras, battery, and performance — all in one view.',
  keywords: [
    'compare phones',
    'phone comparison',
    'smartphone specs comparison',
    'side by side phone comparison',
    'best phone 2024',
  ],
  openGraph: {
    title: 'Compare Phones Side by Side | Mobylite',
    description:
      'Compare up to 4 smartphones side by side with full spec breakdowns.',
    type: 'website',
    siteName: 'Mobylite',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Phones | Mobylite',
    description: 'Side-by-side phone spec comparison.',
  },
  robots: { index: true, follow: true },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
