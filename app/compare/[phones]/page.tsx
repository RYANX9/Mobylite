// app/compare/[phones]/page.tsx
import { notFound } from 'next/navigation'
import CompareClient from '@/app/components/compare/CompareClient'
import { api } from '@/lib/api'
import { c } from '@/lib/tokens'
import type { Phone } from '@/lib/types'

interface PageProps {
  params: Promise<{ phones: string }>
}

function CompareSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{
        width: 32, height: 32,
        border: `2px solid ${c.border}`, borderTopColor: 'var(--primary)',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <p style={{ fontSize: 14, color: c.text3 }}>Resolving phones…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/**
 * Parse compare slug like "galaxy-s25-vs-iphone-16" into parts
 * Split by "-vs-" separator
 */
function parseCompareSlug(slug: string): string[] {
  return slug.split('-vs-').filter(Boolean)
}

/**
 * Search for phone by trying multiple strategies
 */
async function findPhoneBySlug(slug: string): Promise<Phone | null> {
  try {
    // Strategy 1: Search the slug as-is (replace dashes with spaces)
    const searchTerm = slug.replace(/-/g, ' ')
    const res = await api.phones.search({ q: searchTerm, page_size: 10 })
    
    if (res.results.length > 0) {
      // Try to find exact match by comparing slugs
      const slugPattern = slug.toLowerCase()
      const exactMatch = res.results.find(p => {
        const phoneSlug = p.model_name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        return phoneSlug === slugPattern || phoneSlug.includes(slugPattern) || slugPattern.includes(phoneSlug)
      })
      
      if (exactMatch) return exactMatch
      
      // Fallback: return first result
      return res.results[0]
    }
  } catch (error) {
    console.error(`Error searching for "${slug}":`, error)
  }
  
  return null
}

export default async function CompareWithPhonesPage({ params }: PageProps) {
  const { phones: phonesSlug } = await params
  
  // Empty state
  if (!phonesSlug || phonesSlug.trim() === '') {
    return <CompareClient initialPhones={[]} />
  }
  
  const slugParts = parseCompareSlug(phonesSlug)
  
  if (slugParts.length === 0) {
    return <CompareClient initialPhones={[]} />
  }
  
  // Resolve all phone slugs in parallel for better performance
  const resolvedPhones = await Promise.all(
    slugParts.map(slug => findPhoneBySlug(slug))
  )
  
  // Filter out nulls and remove duplicates
  const validPhones = resolvedPhones
    .filter((p): p is Phone => p !== null)
    .filter((p, index, arr) => arr.findIndex(existing => existing.id === p.id) === index)
  
  // If no phones found, show 404
  if (validPhones.length === 0) {
    notFound()
  }
  
  return <CompareClient initialPhones={validPhones} />
}
