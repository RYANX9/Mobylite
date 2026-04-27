// app/compare/[phones]/page.tsx  (updated — server renders metadata, client handles UI)
'use client';

import { Suspense } from 'react';
import ComparePageClient from '@/app/components/compare/ComparePageClient';

export default function CompareWithPhonesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 animate-pulse" />}>
      <ComparePageClient />
    </Suspense>
  );
}
