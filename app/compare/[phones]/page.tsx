// app/compare/[phones]/page.tsx  — Server Component
// Resolves slug-based URLs like /compare/galaxy-s25-ultra-vs-iphone-16-pro-max
// into actual phone data, then renders the client.

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
 * Parse a compare slug like "galaxy-s25-ultra-vs-iphone-16-pro-max"
 * into individual phone name segments.
 */
function parseCompareSlug(slug: string): string[] {
  // Split by "-vs-" — this is the separator between phone slugs
  const parts = slug.split('-vs-')
  return parts.filter(Boolean)
}

/**
 * Convert a slug segment like "galaxy-s25-ultra" back to a searchable name.
 * We try a few strategies since slugification is lossy.
 */
function slugToSearchTerms(slug: string): string[] {
  const terms: string[] = []
  
  // Direct: replace dashes with spaces
  terms.push(slug.replace(/-/g, ' '))
  
  // Try removing brand prefixes that might have been added
  // e.g. "apple-iphone-15" -> "iphone 15"
  const withoutBrand = slug.replace(/^apple-|^samsung-|^google-|^xiaomi-|^oneplus-|^nothing-|^motorola-|^sony-|^asus-|^honor-|^oppo-|^vivo-|^realme-|^poco-|^redmi-/, '')
  if (withoutBrand !== slug) {
    terms.push(withoutBrand.replace(/-/g, ' '))
  }
  
  // Try just the model number pattern
  const modelMatch = slug.match(/(\d+[\w\-]*)/)
  if (modelMatch) {
    terms.push(modelMatch[1].replace(/-/g, ' '))
  }
  
  return terms
}

/**
 * Search for a phone by slug. Tries multiple search strategies.
 */
async function resolvePhoneSlug(slug: string): Promise<Phone | null> {
  const searchTerms = slugToSearchTerms(slug)
  
  for (const term of searchTerms) {
    try {
      const res = await api.phones.search({ q: term, page_size: 5 })
      if (res.results.length > 0) {
        // Find best match — prefer exact slug match, then substring match
        const exactSlugMatch = res.results.find(p => {
          const phoneSlug = p.model_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          return phoneSlug === slug
        })
        if (exactSlugMatch) return exactSlugMatch
        
        // Return first result as fallback
        return res.results[0]
      }
    } catch {
      // Try next term
    }
  }
  
  return null
}

export default async function CompareWithPhonesPage({ params }: PageProps) {
  const { phones: phonesSlug } = await params
  
  if (!phonesSlug) {
    // Empty state — delegate to client which handles /compare (no slug)
    return <CompareClient initialPhones={[]} />
  }
  
  const slugParts = parseCompareSlug(phonesSlug)
  
  if (slugParts.length === 0) {
    return <CompareClient initialPhones={[]} />
  }
  
  // Resolve each slug part to a phone
  const resolvedPhones: Phone[] = []
  const errors: string[] = []
  
  for (const part of slugParts) {
    const phone = await resolvePhoneSlug(part)
    if (phone) {
      // Avoid duplicates
      if (!resolvedPhones.find(p => p.id === phone.id)) {
        resolvedPhones.push(phone)
      }
    } else {
      errors.push(`Could not find phone: "${part}"`)
    }
  }
  
  // If we couldn't resolve ANY phones, show not found
  if (resolvedPhones.length === 0 && errors.length > 0) {
    notFound()
  }
  
  return <CompareClient initialPhones={resolvedPhones} />
}
