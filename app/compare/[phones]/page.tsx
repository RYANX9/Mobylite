import { notFound } from 'next/navigation'
import CompareClient from '@/app/components/compare/CompareClient'
import { api } from '@/lib/api'
import type { Phone } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ phones: string }>
}

function parseCompareSlug(slug: string): string[] {
  return slug.split('-vs-').filter(Boolean)
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Character-overlap similarity, penalised for length mismatch. Prevents a
 * short slug like "iphone-16" from outscoring an exact match against a
 * longer sibling name like "iphone-16-pro".
 */
function similarity(target: string, candidate: string): number {
  let score = 0
  let ti = 0
  for (let ci = 0; ci < candidate.length && ti < target.length; ci++) {
    if (candidate[ci] === target[ti]) { score++; ti++ }
  }
  return score - Math.abs(candidate.length - target.length) * 0.5
}

async function searchCandidates(slug: string): Promise<Phone[]> {
  try {
    const res = await api.phones.search({ q: slug.replace(/-/g, ' '), page_size: 10 })
    return res.results
  } catch (error) {
    console.error(`Compare slug resolution failed for "${slug}":`, error)
    return []
  }
}

/**
 * Resolves each slug to a distinct phone. Exact slug matches are claimed
 * first; any slugs left over fall back to best-effort fuzzy matching among
 * whatever candidates remain unclaimed.
 *
 * Two slugs can never collapse onto the same phone here, which is what
 * previously made phones near the end of a comparison silently vanish
 * (e.g. "iphone-16" matching the already-claimed "iPhone 16 Pro" because
 * its slug is a substring match, then getting deduped away).
 */
async function resolvePhones(slugParts: string[]): Promise<Phone[]> {
  const candidateLists = await Promise.all(slugParts.map(searchCandidates))
  const claimed = new Set<number>()
  const resolved: (Phone | null)[] = new Array(slugParts.length).fill(null)

  slugParts.forEach((slug, i) => {
    const target = slug.toLowerCase()
    const exact = candidateLists[i].find(p => !claimed.has(p.id) && toSlug(p.model_name) === target)
    if (exact) {
      resolved[i] = exact
      claimed.add(exact.id)
    }
  })

  slugParts.forEach((slug, i) => {
    if (resolved[i]) return
    const target = slug.toLowerCase()
    let best: Phone | null = null
    let bestScore = -Infinity
    for (const p of candidateLists[i]) {
      if (claimed.has(p.id)) continue
      const s = similarity(target, toSlug(p.model_name))
      if (s > bestScore) { bestScore = s; best = p }
    }
    if (best && bestScore > target.length * 0.4) {
      resolved[i] = best
      claimed.add(best.id)
    }
  })

  return resolved.filter((p): p is Phone => p !== null)
}

export default async function CompareWithPhonesPage({ params }: PageProps) {
  const { phones: phonesSlug } = await params

  if (!phonesSlug || phonesSlug.trim() === '') {
    return <CompareClient initialPhones={[]} />
  }

  const slugParts = parseCompareSlug(phonesSlug)
  if (slugParts.length === 0) {
    return <CompareClient initialPhones={[]} />
  }

  const validPhones = await resolvePhones(slugParts)

  if (validPhones.length === 0) {
    notFound()
  }

  return <CompareClient initialPhones={validPhones} />
}
