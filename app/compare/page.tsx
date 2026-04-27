// app/compare/page.tsx
'use client';

import { Suspense } from 'react';
import ComparePageClient from '@/components/compare/ComparePageClient';

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageSkeleton />}>
      <ComparePageClient />
    </Suspense>
  );
}

function ComparePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading compare...</div>
    </div>
  );
}
