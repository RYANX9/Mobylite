'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, X, Plus, ChevronDown, ChevronUp, Trophy, Share2, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { c, f, r } from '@/lib/tokens'
import { ROUTES, brandSlug, phoneSlug } from '@/lib/config'
import Navbar from '@/app/components/Navbar'
import { useToast } from '@/app/components/Toast'
import type { Phone } from '@/lib/types'

const API_BASE = 'https://renderphones.onrender.com'
const MAX_COMPARE = 4

async function fetchPhones(ids: number[]): Promise<Phone[]> {
  if (!ids.length) return []
  const res = await fetch(`${API_BASE}/phones/compare?ids=${ids.join(',')}`)
  if (!res.ok) throw new Error('Failed to load phones')
  const data = await res.json()
  return data.phones || []
}

async function searchPhones(q: string, pageSize = 8): Promise<Phone[]> {
  const res = await fetch(`${API_BASE}/phones/search?q=${encodeURIComponent(q)}&page_size=${pageSize}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

function fmt(v: number | null, suffix = ''): string {
  if (v == null) return '—'
  return `${v.toLocaleString()}${suffix}`
}

function fmtPrice(v: number | null): string {
  if (v == null) return '—'
  return `$${v.toLocaleString()}`
}

function scoreComposite(p: Phone): number {
  let s = 0
  if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3
  if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2
  if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2
  if (p.fast_charging_w) s += Math.min(p.fast_charging_w / 100, 1)
  return s
}

function getBestIdx(phones: Phone[], getter: (p: Phone) => number | null, lowerIsBetter = false): number {
  let bestIdx = -1
  let bestVal = lowerIsBetter ? Infinity : -Infinity
  phones.forEach((p, i) => {
    const v = getter(p)
    if (v == null) return
    if (lowerIsBetter ? v < bestVal : v > bestVal) {
      bestVal = v
      bestIdx = i
    }
  })
  return bestIdx
}

interface SpecRow {
  label: string
  getValue: (p: Phone) => string
  getRaw?: (p: Phone) => number | null
  lowerIsBetter?: boolean
}

function SpecCell({ phone, row, isWinner }: { phone: Phone; row: SpecRow; isWinner: boolean }) {
  const val = row.getValue(phone)
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '12px 16px', borderRight: `1px solid ${c.border}`, textAlign: 'center',
      background: isWinner ? 'rgba(45,106,79,0.08)' : 'transparent',
      fontSize: 14, fontWeight: isWinner ? 600 : 500, color: isWinner ? c.green : c.text1,
    }}>
      {val}
      {isWinner && <Trophy size={12} style={{ marginLeft: 6, color: c.green }} />}
    </div>
  )
}

function SpecSection({ title, rows, phones }: { title: string; rows: SpecRow[]; phones: Phone[] }) {
  const [open, setOpen] = useState(title === 'Overview')
  
  return (
    <div style={{ borderRadius: r.lg, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: c.surface, borderBottom: open ? `1px solid ${c.border}` : 'none',
          cursor: 'pointer', transition: 'background 0.15s'
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = c.surface}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: c.text1 }}>{title}</span>
        {open ? <ChevronUp size={16} color={c.text3} /> : <ChevronDown size={16} color={c.text3} />}
      </button>

      {open && (
        <div>
          {rows.map((row, idx) => {
            const winIdx = row.getRaw ? getBestIdx(phones, row.getRaw, row.lowerIsBetter) : -1
            return (
              <div key={row.label} style={{ display: 'flex', borderBottom: `1px solid ${c.border}`, background: idx % 2 === 0 ? 'rgba(248,248,245,0.4)' : 'transparent' }}>
                <div style={{ width: 140, flexShrink: 0, padding: '12px 16px', borderRight: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 13, color: c.text3, fontWeight: 500 }}>{row.label}</span>
                </div>
                {phones.map((p, i) => (
                  <SpecCell key={p.id} phone={p} row={row} isWinner={winIdx === i && winIdx >= 0} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PhoneCard({ phone, onRemove, isBest }: { phone: Phone; onRemove: () => void; isBest: boolean }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div style={{
      position: 'relative', borderRadius: r.lg, border: `1px solid ${isBest ? c.green : c.border}`,
      background: isBest ? 'rgba(45,106,79,0.06)' : c.surface, padding: 16, textAlign: 'center',
      transition: 'all 0.15s'
    }}>
      {isBest && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: c.green, color: '#fff', borderRadius: r.full, fontSize: 11, fontWeight: 700
        }}>
          <Trophy size={12} /> Best Overall
        </div>
      )}
      <button
        onClick={onRemove}
        style={{
          position: 'absolute', top: 12, right: 12, width: 24, height: 24,
          borderRadius: '50%', background: c.border, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: c.text1,
          transition: 'background 0.15s'
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = c.accent}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = c.border}
      >
        <X size={14} />
      </button>

      <Link href={ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 12px', background: 'var(--bg)',
          borderRadius: r.md, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {phone.main_image_url && !imgErr ? (
            <img src={phone.main_image_url} alt={phone.model_name} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 32 }}>📱</span>
          )}
        </div>
        <p style={{ fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
          {phone.brand}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: c.text1, marginBottom: 8, lineHeight: 1.3, minHeight: 32 }}>
          {phone.model_name}
        </p>
      </Link>
      {phone.price_usd && (
        <p style={{ fontSize: 14, fontWeight: 700, color: c.text1, marginBottom: 4 }}>
          ${phone.price_usd.toLocaleString()}
        </p>
      )}
      {phone.release_year && (
        <p style={{ fontSize: 11, color: c.text3 }}>{phone.release_year}</p>
      )}
    </div>
  )
}

function AddPhoneSlot({ onSelect, excludeIds }: { onSelect: (p: Phone) => void; excludeIds: number[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Phone[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); return }
    
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchPhones(query, 8)
        setResults(res.filter(p => !excludeIds.includes(p.id)))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, excludeIds])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', minHeight: 140, borderRadius: r.lg, border: `2px dashed ${c.border}`,
          background: 'transparent', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8, color: c.text3,
          transition: 'all 0.15s', cursor: 'pointer'
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = c.primary
          (e.currentTarget as HTMLElement).style.color = c.text1
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = c.border
          (e.currentTarget as HTMLElement).style.color = c.text3
        }}
      >
        <Plus size={20} />
        <span style={{ fontSize: 13 }}>Add phone</span>
      </button>
    )
  }

  return (
    <div style={{
      width: '100%', borderRadius: r.lg, border: `1px solid ${c.primary}`,
      background: 'rgba(26,26,46,0.04)', padding: 12, display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.primary }}>Search phone</span>
        <button onClick={() => { setOpen(false); setQuery('') }} style={{ color: c.text3, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.text3, pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type phone name…"
          autoFocus
          style={{
            width: '100%', paddingLeft: 36, paddingRight: 12, padding: '10px 12px 10px 36px',
            background: c.surface, border: `1px solid ${c.border}`, borderRadius: r.sm,
            fontSize: 13, color: c.text1
          }}
        />
      </div>

      {results.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setOpen(false); setQuery('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                background: 'transparent', textAlign: 'left', borderRadius: r.sm,
                transition: 'background 0.1s', cursor: 'pointer'
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, background: 'var(--bg)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {p.main_image_url && <img src={p.main_image_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: c.text1 }}>{p.model_name}</p>
                <p style={{ fontSize: 11, color: c.text3 }}>{p.brand}{p.price_usd && ` · $${p.price_usd}`}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p style={{ fontSize: 12, color: c.text3, textAlign: 'center', padding: '8px 0' }}>No phones found</p>
      )}
    </div>
  )
}

export default function CompareClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [phones, setPhones] = useState<Phone[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ids = searchParams.get('ids')
    if (!ids) return

    const idList = ids.split(',').map(Number).filter(id => !isNaN(id))
    if (idList.length === 0) return

    setLoading(true)
    setError(null)

    fetchPhones(idList)
      .then(data => {
        if (!data.length) {
          setError('Could not find phones')
          return
        }
        setPhones(data)
      })
      .catch(err => {
        console.error('API Error:', err)
        setError('Failed to load phones')
      })
      .finally(() => setLoading(false))
  }, [searchParams])

  const handleAdd = useCallback((phone: Phone) => {
    if (phones.some(p => p.id === phone.id)) {
      toast('Phone already added', 'info')
      return
    }
    if (phones.length >= MAX_COMPARE) {
      toast(`Maximum ${MAX_COMPARE} phones`, 'error')
      return
    }

    const updated = [...phones, phone]
    setPhones(updated)
    const ids = updated.map(p => p.id).join(',')
    router.push(`/compare?ids=${ids}`, { scroll: false })
    toast('Phone added to compare', 'success')
  }, [phones, router, toast])

  const handleRemove = (id: number) => {
    const updated = phones.filter(p => p.id !== id)
    setPhones(updated)
    if (updated.length === 0) {
      router.push('/compare', { scroll: false })
    } else {
      const ids = updated.map(p => p.id).join(',')
      router.push(`/compare?ids=${ids}`, { scroll: false })
    }
    toast('Phone removed', 'info')
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Failed to copy link', 'error')
    }
  }

  const scores = phones.map(scoreComposite)
  const maxScore = Math.max(...scores, 1)
  const bestIdx = scores.length >= 2 ? scores.indexOf(Math.max(...scores)) : -1

  const specs: { title: string; rows: SpecRow[] }[] = [
    {
      title: 'Overview',
      rows: [
        { label: 'Price', getValue: (p) => fmtPrice(p.price_usd), getRaw: (p) => p.price_usd ? -p.price_usd : null },
        { label: 'Released', getValue: (p) => p.release_year ? String(p.release_year) : '—', getRaw: (p) => p.release_year },
      ],
    },
    {
      title: 'Display',
      rows: [
        { label: 'Screen', getValue: (p) => fmt(p.screen_size, '"'), getRaw: (p) => p.screen_size },
      ],
    },
    {
      title: 'Performance',
      rows: [
        { label: 'Chipset', getValue: (p) => p.chipset || '—' },
        { label: 'AnTuTu', getValue: (p) => fmt(p.antutu_score), getRaw: (p) => p.antutu_score },
        { label: 'RAM', getValue: (p) => (p.ram_options?.length ? `${Math.max(...p.ram_options)} GB` : '—'), getRaw: (p) => (p.ram_options?.length ? Math.max(...p.ram_options) : null) },
      ],
    },
    {
      title: 'Camera',
      rows: [
        { label: 'Main', getValue: (p) => fmt(p.main_camera_mp, ' MP'), getRaw: (p) => p.main_camera_mp },
      ],
    },
    {
      title: 'Battery',
      rows: [
        { label: 'Capacity', getValue: (p) => fmt(p.battery_capacity, ' mAh'), getRaw: (p) => p.battery_capacity },
        { label: 'Charging', getValue: (p) => fmt(p.fast_charging_w, 'W'), getRaw: (p) => p.fast_charging_w },
      ],
    },
    {
      title: 'Build',
      rows: [
        { label: 'Weight', getValue: (p) => fmt(p.weight_g, 'g'), getRaw: (p) => p.weight_g ? -p.weight_g : null, lowerIsBetter: true },
      ],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar compareCount={0} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.text3, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = c.text1}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = c.text3}>
              <ArrowLeft size={16} />
              <span style={{ fontSize: 13 }}>Home</span>
            </Link>
          </div>
          <h1 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, margin: 0 }}>Compare Phones</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            {phones.length >= 2 && (
              <button
                onClick={handleShare}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: c.surface, border: `1px solid ${c.border}`, borderRadius: r.full,
                  fontSize: 13, color: c.text2, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.text1; (e.currentTarget as HTMLElement).style.borderColor = c.primary }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.text2; (e.currentTarget as HTMLElement).style.borderColor = c.border }}
              >
                {copied ? 'Copied!' : <><Share2 size={13} /> Share</>}
              </button>
            )}
            {phones.length > 0 && (
              <button
                onClick={() => { setPhones([]); router.push('/compare') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: c.surface, border: `1px solid ${c.border}`, borderRadius: r.full,
                  fontSize: 13, color: c.text2, transition: 'all 0.15s'
                }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(230,57,70,0.06)', border: `1px solid ${c.accentBorder}`, borderRadius: r.md, marginBottom: 24 }}>
            <AlertCircle size={16} color={c.accent} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: c.accent }}>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: c.primary }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && phones.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontFamily: f.serif, fontSize: 24, color: c.text1, marginBottom: 12 }}>No phones selected</h2>
            <p style={{ fontSize: 14, color: c.text3, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              Search and add up to 4 phones to compare specs side by side.
            </p>
            <AddPhoneSlot onSelect={handleAdd} excludeIds={[]} />
          </div>
        )}

        {/* Phone cards grid */}
        {phones.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(phones.length + (phones.length < MAX_COMPARE ? 1 : 0), MAX_COMPARE)}, 1fr)`, gap: 16, marginBottom: 40 }}>
              {phones.map((p, i) => (
                <PhoneCard key={p.id} phone={p} onRemove={() => handleRemove(p.id)} isBest={i === bestIdx} />
              ))}
              {phones.length < MAX_COMPARE && (
                <AddPhoneSlot onSelect={handleAdd} excludeIds={phones.map(p => p.id)} />
              )}
            </div>

            {/* Comparison table */}
            {phones.length >= 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {specs.map(section => (
                  <SpecSection key={section.title} title={section.title} rows={section.rows} phones={phones} />
                ))}
              </div>
            )}

            {/* Single phone hint */}
            {phones.length === 1 && (
              <div style={{ padding: '16px 20px', background: 'rgba(26,26,46,0.04)', border: `1px solid ${c.border}`, borderRadius: r.md, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Plus size={14} color={c.primary} />
                <p style={{ fontSize: 13, color: c.primary }}>Add another phone to see comparisons</p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
