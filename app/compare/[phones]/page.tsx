// app/compare/[phones]/page.tsx
'use client';

import { Suspense } from 'react';
import ComparePageClient from '@/components/compare/ComparePageClient';

export default function CompareWithPhonesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <ComparePageClient />
    </Suspense>
  );
}
