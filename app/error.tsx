"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to your preferred error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Mobylite
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition">Browse</Link>
            <Link href="/best/camera-phones" className="hover:text-gray-900 transition">Best Of</Link>
            <Link href="/pick" className="hover:text-gray-900 transition">Help Me Choose</Link>
            <Link href="/compare" className="hover:text-gray-900 transition">Compare</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Server Error — 500</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Something went wrong. This is on our end, not yours. We&apos;ve been notified and are looking into it. Your data is safe — nothing was lost.
          </p>

          {/* System Status */}
          <div className="bg-gray-50 rounded-md border border-gray-200 p-4 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">System Status</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Phone database</span>
                <span className="text-green-700 font-medium">Operational</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Search &amp; filters</span>
                <span className="text-green-700 font-medium">Operational</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">This page</span>
                <span className="text-red-700 font-medium">Error</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Compare &amp; rankings</span>
                <span className="text-green-700 font-medium">Operational</span>
              </li>
            </ul>
          </div>

          {/* Technical Details */}
          <details className="mb-6 border border-gray-200 rounded-md overflow-hidden">
            <summary className="bg-gray-50 px-4 py-2 cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-100 select-none">
              Show technical details
            </summary>
            <div className="bg-gray-900 text-gray-300 p-4 font-mono text-xs leading-relaxed">
              Error: Internal Server Error (500) at /phones/[id] → GET handler
              time: {new Date().toISOString()}
              request-id: {error.digest || "mb_unknown"}
              This has been automatically reported.
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => reset()}
              className="flex-1 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="flex-1 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition text-center focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Go Home
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Error persisting?{" "}
            <a href="mailto:hello@mobylite.com" className="text-gray-700 underline hover:text-gray-900">
              Contact us
            </a>{" "}
            and we&apos;ll help you out. Most errors resolve on their own within a few minutes.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span className="font-medium text-gray-900">Mobylite</span>
          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-gray-900 transition">Browse</Link>
            <Link href="/compare" className="hover:text-gray-900 transition">Compare</Link>
            <Link href="/pick" className="hover:text-gray-900 transition">Help Me Choose</Link>
            <Link href="/about" className="hover:text-gray-900 transition">About</Link>
          </nav>
          <span>© 2025 Mobylite</span>
        </div>
      </footer>
    </div>
  );
}
