import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mobylite — Find Your Next Phone',
  description:
    'No clutter. No discontinued junk. Find and compare phones you can actually buy today.',
  icons: { icon: '/logored.svg', apple: '/logored.svg' },
  openGraph: {
    title: 'Mobylite — Find Your Next Phone',
    description: 'Compare phones side-by-side with honest specs and verdicts.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
