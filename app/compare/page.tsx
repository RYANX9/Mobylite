'use client'

import { Suspense } from 'react'
import ComparePageClient from '@/components/compare/ComparePageClient'
import { c } from '@/lib/tokens'

function CompareSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${c.border}`, borderTopColor: c.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <ComparePageClient />
    </Suspense>
  )
}
