import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mobylite | Simple comparisons. Confident decisions. ",
  description:
    "portfilio desingand develop",
  icons: {
    icon: [
      { url: "/noun.svg", type: "image/png", sizes: "120x120" },
    ],
    apple: "/noun.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Force favicon override */}
        <link rel="icon" href="/noun.svg" type="image/png" sizes="120x120" />
        <link rel="shortcut icon" href="/noun.svg" type="image/png" />
        <link rel="apple-touch-icon" href="/noun.svg" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
