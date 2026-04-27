'use client'

import { Suspense } from 'react'
import CompareClient from '@/app/components/compare/CompareClient'
import { c } from '@/lib/tokens'

function CompareSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{
        width: 32, height: 32,
        border: `2px solid ${c.border}`, borderTopColor: 'var(--primary)',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <p style={{ fontSize: 14, color: c.text3 }}>Loading comparison…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function CompareWithPhonesPage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareClient />
    </Suspense>
  )
}
