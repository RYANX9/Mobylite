import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Mobylite | Simple comparisons. Confident decisions.",
  description: "Portfolio design and develop",
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
    <html lang="en">
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