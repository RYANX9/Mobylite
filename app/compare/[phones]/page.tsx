// app/compare/[phones]/page.tsx
'use client';

import { Suspense } from 'react';
import CompareClient from '@/app/components/compare/CompareClient';

export default function CompareWithPhonesPage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareClient />
    </Suspense>
  );
}

function CompareSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
