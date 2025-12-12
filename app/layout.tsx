// app\layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

// 1. IMPORT BOTH FONTS
import { Young_Serif, Space_Grotesk } from "next/font/google";

// 2. CONFIGURE YOUNG SERIF (HEADINGS/PRIMARY)
const youngSerif = Young_Serif({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-primary", // The variable for Headings
});

// 3. CONFIGURE SPACE GROTESK (BODY/UI)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body", // The variable for Body/UI
});


export const metadata: Metadata = {
  title: "Mobylite | Simple comparisons. Confident decisions.",
  description: "choice ur next phone with confidence",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/png", sizes: "120x120" }],
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 4. APPLY BOTH CSS VARIABLES TO HTML TAG
    <html lang="en" className={`${youngSerif.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="icon" href="/logo.svg" type="image/png" sizes="120x120" />
        <link rel="shortcut icon" href="/logo.svg" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}