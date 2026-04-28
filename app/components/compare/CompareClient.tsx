'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, X, Plus, ChevronDown, Star, Share2, RotateCcw,
  Loader2, AlertCircle, Smartphone, Camera, Battery, Zap,
  Monitor, Trophy, BadgeDollarSign, Wrench, HardHat, ChevronRight,
  ArrowRight, Crosshair
} from 'lucide-react'
import { c, f, r } from '@/lib/tokens'
import { ROUTES, brandSlug, phoneSlug, MAX_COMPARE } from '@/lib/config'
import { api } from '@/lib/api'
import Navbar from '@/app/components/Navbar'
import { useToast } from '@/app/components/Toast'
import type { Phone } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function fmt(v: number | null, suffix = ''): string {
  if (v == null) return '—'
  return `${v.toLocaleString()}${suffix}`
}

function fmtPrice(v: number | null): string {
  if (v == null) return 'Price TBA'
  return `$${v.toLocaleString()}`
}

function scoreComposite(p: Phone): number {
  let s = 0
  if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3
  if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2
  if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2
  if (p.fast_charging_w) s += Math.min(p.fast_charging_w / 100, 1)
  if (p.ram_options?.length) s += Math.min(Math.max(...p.ram_options) / 16, 1) * 0.5
  return s
}

function getBestIdx(
  phones: Phone[],
  getter: (p: Phone) => number | null,
  lowerIsBetter = false
): number {
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

function buildCompareSlug(phones: Phone[]): string {
  return phones.map(p => phoneSlug(p)).filter(Boolean).join('-vs-')
}

/* ═══════════════════════════════════════════════════════════════
   VERDICT CONFIG — NO EMOJIS, ALL LUCIDE ICONS
   ═══════════════════════════════════════════════════════════════ */

interface VerdictCategory {
  icon: React.ReactNode
  label: string
  getter: (p: Phone) => number | null
  lowerIsBetter?: boolean
  unit: string
  description: string
}

const VERDICTS: VerdictCategory[] = [
  { icon: <Camera size={18} strokeWidth={1.5} />, label: 'Camera', unit: ' MP', getter: p => p.main_camera_mp, description: 'Main sensor resolution' },
  { icon: <Battery size={18} strokeWidth={1.5} />, label: 'Battery', unit: ' mAh', getter: p => p.battery_capacity, description: 'Battery capacity' },
  { icon: <Zap size={18} strokeWidth={1.5} />, label: 'Charging', unit: 'W', getter: p => p.fast_charging_w, description: 'Wired charging speed' },
  { icon: <Zap size={18} strokeWidth={1.5} />, label: 'Performance', unit: ' pts', getter: p => p.antutu_score, description: 'AnTuTu benchmark score' },
  { icon: <Monitor size={18} strokeWidth={1.5} />, label: 'Display', unit: '"', getter: p => p.screen_size, description: 'Screen diagonal' },
  { icon: <Smartphone size={18} strokeWidth={1.5} />, label: 'Weight', unit: 'g', lowerIsBetter: true, getter: p => p.weight_g, description: 'Total weight' },
  { icon: <BadgeDollarSign size={18} strokeWidth={1.5} />, label: 'Value', unit: '/10', getter: p => p.value_score ?? scoreComposite(p), description: 'Specs-per-dollar' },
]

/* ═══════════════════════════════════════════════════════════════
   SPEC TABLE CONFIG — NO EMOJIS, ALL LUCIDE ICONS
   ═══════════════════════════════════════════════════════════════ */

interface SpecRow {
  label: string
  getValue: (p: Phone) => string
  getRaw?: (p: Phone) => number | null
  lowerIsBetter?: boolean
}

const SPEC_SECTIONS: { title: string; icon: React.ReactNode; rows: SpecRow[] }[] = [
  {
    title: 'Display', icon: <Monitor size={18} strokeWidth={1.5} />,
    rows: [
      { label: 'Screen Size', getValue: p => fmt(p.screen_size, '"'), getRaw: p => p.screen_size },
      { label: 'Resolution', getValue: p => p.screen_resolution || '—' },
      { label: 'Type', getValue: p => p.full_specifications?.quick_specs?.displaytype || '—' },
    ],
  },
  {
    title: 'Camera', icon: <Camera size={18} strokeWidth={1.5} />,
    rows: [
      { label: 'Main Camera', getValue: p => fmt(p.main_camera_mp, ' MP'), getRaw: p => p.main_camera_mp },
      { label: 'Front Camera', getValue: p => p.full_specifications?.quick_specs?.cam2modules || '—' },
      { label: 'Features', getValue: p => p.features?.join(', ') || '—' },
    ],
  },
  {
    title: 'Performance', icon: <Zap size={18} strokeWidth={1.5} />,
    rows: [
      { label: 'Chipset', getValue: p => p.chipset || '—' },
      { label: 'AnTuTu', getValue: p => fmt(p.antutu_score), getRaw: p => p.antutu_score },
      { label: 'RAM', getValue: p => p.ram_options?.length ? `${Math.max(...p.ram_options)} GB` : '—', getRaw: p => p.ram_options?.length ? Math.max(...p.ram_options) : null },
      { label: 'Storage', getValue: p => p.storage_options?.length ? `${Math.max(...p.storage_options)} GB` : '—', getRaw: p => p.storage_options?.length ? Math.max(...p.storage_options) : null },
    ],
  },
  {
    title: 'Battery', icon: <Battery size={18} strokeWidth={1.5} />,
    rows: [
      { label: 'Capacity', getValue: p => fmt(p.battery_capacity, ' mAh'), getRaw: p => p.battery_capacity },
      { label: 'Fast Charging', getValue: p => fmt(p.fast_charging_w, 'W'), getRaw: p => p.fast_charging_w },
    ],
  },
  {
    title: 'Build', icon: <HardHat size={18} strokeWidth={1.5} />,
    rows: [
      { label: 'Weight', getValue: p => fmt(p.weight_g, 'g'), getRaw: p => p.weight_g, lowerIsBetter: true },
      { label: 'Thickness', getValue: p => fmt(p.thickness_mm, 'mm'), getRaw: p => p.thickness_mm, lowerIsBetter: true },
      { label: 'Chipset Tier', getValue: p => p.chipset_tier ? p.chipset_tier.charAt(0).toUpperCase() + p.chipset_tier.slice(1) : '—' },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function PhoneColumn({ phone, onRemove, isWinner }: {
  phone: Phone
  onRemove: () => void
  isWinner: boolean
}) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div style={{
      position: 'relative',
      background: isWinner ? 'linear-gradient(180deg, rgba(230,57,70,0.03) 0%, var(--surface) 100%)' : c.surface,
      border: `1px solid ${isWinner ? 'var(--accent-border)' : c.border}`,
      borderRadius: r.lg,
      padding: '24px 16px',
      textAlign: 'center',
      transition: 'all 0.15s ease',
    }}>
      {isWinner && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          background: c.accent, color: '#fff', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.5px',
          padding: '3px 12px', borderRadius: r.full,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Star size={10} fill="white" /> Overall Winner
        </div>
      )}

      <button
        onClick={onRemove}
        style={{
          position: 'absolute', top: 10, right: 10, width: 28, height: 28,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.text3, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(230,57,70,0.08)'; (e.currentTarget as HTMLElement).style.color = c.accent }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = c.text3 }}
      >
        <X size={14} />
      </button>

      <Link href={ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))}>
        <div style={{
          width: 100, height: 100, margin: '8px auto 16px',
          background: 'var(--bg)', borderRadius: r.md,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {phone.main_image_url && !imgErr ? (
            <img
              src={phone.main_image_url}
              alt={phone.model_name}
              onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Smartphone size={36} color={c.border} />
          )}
        </div>

        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3, marginBottom: 4 }}>
          {phone.brand}
        </p>
        <p style={{ fontFamily: f.serif, fontSize: 17, color: c.text1, marginBottom: 6, lineHeight: 1.3 }}>
          {phone.model_name}
        </p>
      </Link>

      <p style={{ fontSize: 20, fontWeight: 600, color: c.text1, marginBottom: 8 }}>
        {fmtPrice(phone.price_usd)}
      </p>

      {phone.value_score != null ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: c.text3,
          padding: '4px 10px', background: 'var(--bg)', borderRadius: r.full,
        }}>
          Value: <span style={{
            fontWeight: 600,
            color: phone.value_score >= 8 ? 'var(--green)' : phone.value_score >= 6 ? c.text2 : 'var(--orange)'
          }}>{phone.value_score}</span>/10
        </div>
      ) : (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: c.text3,
          padding: '4px 10px', background: 'var(--bg)', borderRadius: r.full,
        }}>
          Value: <span style={{ fontWeight: 600, color: c.text3 }}>—</span>/10
        </div>
      )}

      <Link
        href={ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))}
        style={{ display: 'block', marginTop: 12, fontSize: 12, fontWeight: 500, color: c.text3, transition: 'color 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.accent }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.text3 }}
      >
        View full specs →
      </Link>
    </div>
  )
}

function AddPhoneSlot({ onSelect, excludeIds }: {
  onSelect: (p: Phone) => void
  excludeIds: number[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Phone[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.phones.search({ q: query, page_size: 8 })
        setResults(res.results.filter(p => !excludeIds.includes(p.id)))
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }, [query, excludeIds])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', minHeight: 260, borderRadius: r.lg,
          border: `2px dashed ${c.border}`, background: 'transparent',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 8, color: c.text3,
          transition: 'all 0.15s', cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.color = c.text1 }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.text3 }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: c.surface,
          border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus size={20} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Add phone</span>
        <span style={{ fontSize: 12 }}>Up to {MAX_COMPARE} phones total</span>
      </button>
    )
  }

  return (
    <div style={{
      width: '100%', minHeight: 260, borderRadius: r.lg,
      border: `1px solid ${c.primary}`, background: 'rgba(26,26,46,0.03)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.primary }}>Search phone</span>
        <button onClick={() => { setOpen(false); setQuery('') }} style={{ color: c.text3, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.text3, pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type phone name…"
          autoFocus
          style={{
            width: '100%', padding: '10px 12px 10px 38px',
            background: c.surface, border: `1px solid ${c.border}`, borderRadius: r.sm,
            fontSize: 14, color: c.text1,
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {results.map(p => (
          <button
            key={p.id}
            onClick={() => { onSelect(p); setOpen(false); setQuery('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
              textAlign: 'left', borderRadius: r.sm, transition: 'background 0.1s', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: 36, height: 36, background: 'var(--bg)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {p.main_image_url && <img src={p.main_image_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>{p.model_name}</p>
              <p style={{ fontSize: 11, color: c.text3 }}>{p.brand}{p.price_usd && ` · $${p.price_usd}`}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: c.primary, border: `1px solid ${c.border}`, borderRadius: r.full, padding: '4px 12px', flexShrink: 0 }}>
              + Add
            </span>
          </button>
        ))}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p style={{ fontSize: 12, color: c.text3, textAlign: 'center', padding: '16px 0' }}>No phones found</p>
        )}
      </div>
    </div>
  )
}

function QuickVerdict({ phones }: { phones: Phone[] }) {
  const wins = new Map<number, number>()

  const items = VERDICTS.map(v => {
    const bestIdx = getBestIdx(phones, v.getter, v.lowerIsBetter)
    if (bestIdx >= 0) wins.set(bestIdx, (wins.get(bestIdx) || 0) + 1)

    const bestVal = bestIdx >= 0 ? v.getter(phones[bestIdx]) : null
    const isTie = bestVal != null && phones.filter((p, i) => i !== bestIdx && v.getter(p) === bestVal).length > 0

    return { ...v, bestIdx, isTie }
  })

  const overallWinner = Array.from(wins.entries()).sort((a, b) => b[1] - a[1])[0]

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, marginBottom: 24 }}>Quick Verdict</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="verdict-grid">
        {items.map(item => {
          const winner = item.bestIdx >= 0 ? phones[item.bestIdx] : null
          const val = winner ? item.getter(winner) : null

          return (
            <div key={item.label} style={{
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: r.md,
              padding: '18px 20px', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: c.text2, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3 }}>{item.label}</span>
              </div>
              <div style={{ fontFamily: f.serif, fontSize: 17, color: c.text1, marginBottom: 4 }}>
                {winner ? winner.model_name : '—'}
              </div>
              <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.5, marginBottom: 8 }}>
                {item.description}
                {val != null && ` (${fmt(val, item.unit)})`}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: r.full, fontSize: 11, fontWeight: 600,
                ...(item.isTie
                  ? { background: 'var(--blue-light)', color: 'var(--blue)' }
                  : item.bestIdx >= 0
                    ? { background: 'var(--accent-light)', color: c.accent }
                    : { background: 'rgba(0,0,0,0.04)', color: c.text3 }),
              }}>
                {item.isTie ? '≈ Tie' : item.bestIdx >= 0 ? <><Star size={10} fill={c.accent} color={c.accent} /> Winner</> : '—'}
              </span>
            </div>
          )
        })}

        {overallWinner && (
          <div style={{
            gridColumn: '1 / -1',
            background: c.primary, color: '#fff', border: 'none', borderRadius: r.md,
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Trophy size={20} color="#C9A84C" />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>Overall</span>
            </div>
            <div style={{ fontFamily: f.serif, fontSize: 22, color: '#fff', marginBottom: 4 }}>
              {phones[overallWinner[0]].model_name} wins {overallWinner[1]} of {VERDICTS.length} categories
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Based on the categories above. But the best phone depends on what matters most to you.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function SpecTable({ phones }: { phones: Phone[] }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, marginBottom: 24 }}>Full Spec Comparison</h2>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          {SPEC_SECTIONS.map(section => (
            <tbody key={section.title}>
              <tr>
                <td colSpan={phones.length + 1} style={{
                  padding: '16px 16px 10px', fontSize: 13, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text1,
                  background: 'var(--bg)', borderBottom: `2px solid ${c.border}`,
                }}>
                  <span style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', color: c.text2 }}>{section.icon}</span>
                  {section.title}
                </td>
              </tr>
              {section.rows.map((row, idx) => {
                const winIdx = row.getRaw ? getBestIdx(phones, row.getRaw, row.lowerIsBetter) : -1
                return (
                  <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(248,248,245,0.4)' : 'transparent' }}>
                    <td style={{
                      width: 200, padding: '12px 16px', borderBottom: `1px solid ${c.border}`,
                      color: c.text2, fontWeight: 500, fontSize: 13,
                      position: 'sticky', left: 0, background: 'inherit', zIndex: 2,
                      whiteSpace: 'nowrap',
                    }}>
                      {row.label}
                    </td>
                    {phones.map((p, i) => {
                      const isWinner = winIdx === i && winIdx >= 0
                      const val = row.getValue(p)
                      return (
                        <td key={p.id} style={{
                          padding: '12px 16px', borderBottom: `1px solid ${c.border}`,
                          textAlign: 'center', fontSize: 13,
                          fontWeight: isWinner ? 600 : 500,
                          color: isWinner ? c.text1 : c.text3,
                          position: 'relative',
                          ...(isWinner ? { background: 'rgba(230,57,70,0.04)' } : {}),
                        }}>
                          {isWinner && (
                            <span style={{
                              position: 'absolute', left: 0, top: 6, bottom: 6,
                              width: 3, background: c.accent, borderRadius: 2,
                            }} />
                          )}
                          <span style={{ paddingLeft: isWinner ? 8 : 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {val}
                            {isWinner && <Star size={12} fill={c.accent} color={c.accent} />}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  )
}

function DetailedVerdicts({ phones }: { phones: Phone[] }) {
  const categories = [
    { icon: <Camera size={20} strokeWidth={1.5} />, label: 'Camera', getter: (p: Phone) => p.main_camera_mp, max: 200 },
    { icon: <Zap size={20} strokeWidth={1.5} />, label: 'Performance', getter: (p: Phone) => p.antutu_score, max: 2_000_000 },
    { icon: <Battery size={20} strokeWidth={1.5} />, label: 'Battery', getter: (p: Phone) => p.battery_capacity, max: 7000 },
  ]

  const colors = [c.accent, c.primary, 'var(--green)']

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, marginBottom: 24 }}>Detailed Verdicts</h2>

      {categories.map(cat => {
        const values = phones.map(cat.getter)
        const maxVal = Math.max(...values.filter(Boolean) as number[], 1)

        return (
          <div key={cat.label} style={{
            background: c.surface, border: `1px solid ${c.border}`, borderRadius: r.md,
            padding: 24, marginBottom: 16, transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ color: c.text2, display: 'flex', alignItems: 'center' }}>{cat.icon}</span>
              <span style={{ fontFamily: f.serif, fontSize: 20, color: c.text1 }}>{cat.label}</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              {phones.map((p, i) => {
                const val = cat.getter(p) || 0
                const pct = Math.min((val / cat.max) * 100, 100)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ width: 140, fontSize: 12, fontWeight: 500, color: c.text2, textAlign: 'right', flexShrink: 0 }}>
                      {p.model_name}
                    </span>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 4,
                        background: colors[i % colors.length],
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                    <span style={{ width: 50, fontSize: 12, fontWeight: 600, color: c.text1, flexShrink: 0 }}>
                      {fmt(val)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{
              fontSize: 14, color: c.text2, lineHeight: 1.7,
              padding: 16, background: 'var(--bg)', borderRadius: r.sm,
            }}>
              <strong style={{ color: c.text1 }}>Analysis:</strong> Compare the {cat.label.toLowerCase()} specs above. The winner is highlighted with a red star in the table.
            </div>
          </div>
        )
      })}
    </section>
  )
}

function BottomLine({ phones }: { phones: Phone[] }) {
  if (phones.length < 2) return null

  const bestValue = phones.reduce((a, b) => ((a.value_score ?? scoreComposite(a)) > (b.value_score ?? scoreComposite(b)) ? a : b))
  const cheapest = phones.reduce((a, b) => ((a.price_usd ?? Infinity) < (b.price_usd ?? Infinity) ? a : b))
  const bestCamera = phones.reduce((a, b) => ((a.main_camera_mp || 0) > (b.main_camera_mp || 0) ? a : b))

  const recs = [
    { for: 'Best overall value', phone: bestValue, reason: 'Highest value score with competitive specs at a fair price.' },
    { for: 'Budget pick', phone: cheapest, reason: 'Lowest price while still offering solid performance.' },
    { for: 'Photography', phone: bestCamera, reason: 'Highest resolution main camera for stunning photos.' },
  ]

  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: r.lg, padding: '36px', textAlign: 'center', marginBottom: 48,
    }}>
      <h2 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, marginBottom: 8 }}>The Bottom Line</h2>
      <p style={{ fontSize: 14, color: c.text3, marginBottom: 28 }}>Different phones for different people. Here is who should buy what.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="bottom-recs">
        {recs.map(rec => (
          <div key={rec.for} style={{ padding: 20, background: 'var(--bg)', borderRadius: r.md, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.accent, marginBottom: 8 }}>
              {rec.for}
            </div>
            <div style={{ fontFamily: f.serif, fontSize: 16, color: c.text1, marginBottom: 4 }}>
              {rec.phone.model_name}
            </div>
            <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.5 }}>
              {rec.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  const cols = [
    {
      title: 'Browse',
      links: [
        { label: 'All Phones', href: ROUTES.home },
        { label: 'Brands', href: '#' },
        { label: 'Compare', href: '/compare' },
        { label: 'Help Me Choose', href: ROUTES.pick },
      ],
    },
    {
      title: 'Categories',
      links: [
        { label: 'Best Camera', href: ROUTES.category('camera-phones') },
        { label: 'Best Battery', href: ROUTES.category('battery-life') },
        { label: 'Under $300', href: ROUTES.category('under-300') },
        { label: 'Gaming Phones', href: ROUTES.category('gaming-phones') },
        { label: 'Fast Charging', href: ROUTES.category('fast-charging') },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About Mobylite', href: '/about' },
        { label: 'How We Score', href: '/about#scoring' },
        { label: 'Data Sources', href: '/about#data' },
        { label: 'Contact', href: '/about#contact' },
      ],
    },
  ]

  return (
    <footer style={{ background: c.primary, color: '#A0A0B0', padding: '56px 24px 28px', marginTop: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 32, marginBottom: 40,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 22,
              color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <img src="/logored.svg" alt="Mobylite" style={{ height: '1em', width: 'auto' }} />
              Mobylite
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
              Find your next phone. No clutter, no bias, no discontinued models.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div style={{
                fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 14, color: '#7A7A8A',
              }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(l => (
                  <Link
                    key={l.label}
                    href={l.href}
                    style={{ fontSize: 14, color: '#A0A0B0', transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#A0A0B0' }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 24, borderTop: '1px solid #2A2A3E',
          textAlign: 'center', fontSize: 12, color: '#6A6A7A',
        }}>
          © 2025 Mobylite. Data sourced from GSMArena. All trademarks belong to their owners.
          <br />Specs updated daily.
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CONTENT
   ═══════════════════════════════════════════════════════════════ */

interface CompareContentProps {
  initialPhones: Phone[]
}

function CompareContent({ initialPhones }: CompareContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [phones, setPhones] = useState<Phone[]>(initialPhones)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const didInitRef = useRef(false)
  const userModifiedRef = useRef(false)
  const lastSyncedSlugRef = useRef<string>('')

  useEffect(() => {
    if (initialPhones.length > 0) {
      didInitRef.current = true
      lastSyncedSlugRef.current = buildCompareSlug(initialPhones)
      return
    }

    const idsParam = searchParams.get('ids')
    if (!idsParam) {
      didInitRef.current = true
      return
    }

    const idList = idsParam.split(',').map(Number).filter(id => !isNaN(id) && id > 0)
    if (idList.length === 0) {
      didInitRef.current = true
      return
    }

    setLoading(true)
    api.phones.compare(idList)
      .then(data => {
        if (data.phones?.length) {
          setPhones(data.phones)
          lastSyncedSlugRef.current = buildCompareSlug(data.phones)
        } else {
          setError('Could not find the requested phones')
        }
      })
      .catch(() => setError('Failed to load phones. Please try again.'))
      .finally(() => {
        setLoading(false)
        didInitRef.current = true
      })
  }, [searchParams, initialPhones.length])

  useEffect(() => {
    if (!didInitRef.current) return
    if (!userModifiedRef.current) return

    const currentSlug = buildCompareSlug(phones)
    
    if (currentSlug === lastSyncedSlugRef.current) {
      return
    }

    if (phones.length === 0) {
      lastSyncedSlugRef.current = ''
      router.replace('/compare', { scroll: false })
      return
    }

    const newPath = `/compare/${currentSlug}`
    
    if (window.location.pathname !== newPath) {
      lastSyncedSlugRef.current = currentSlug
      router.replace(newPath, { scroll: false })
    }
  }, [phones, router])

  const handleAdd = useCallback((phone: Phone) => {
    if (phones.some(p => p.id === phone.id)) {
      toast('Phone already in comparison', 'info')
      return
    }
    if (phones.length >= MAX_COMPARE) {
      toast(`Maximum ${MAX_COMPARE} phones allowed`, 'error')
      return
    }
    userModifiedRef.current = true
    const updated = [...phones, phone]
    setPhones(updated)
    const slug = buildCompareSlug(updated)
    router.replace(`/compare/${slug}`, { scroll: false })
    toast('Phone added to comparison', 'success')
  }, [phones, router, toast])

  const handleRemove = useCallback((id: number) => {
    userModifiedRef.current = true
    const updated = phones.filter(p => p.id !== id)
    setPhones(updated)
    
    if (updated.length === 0) {
      router.replace('/compare', { scroll: false })
    } else {
      const slug = buildCompareSlug(updated)
      router.replace(`/compare/${slug}`, { scroll: false })
    }
    toast('Phone removed', 'info')
  }, [phones, router, toast])

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

  const handleClear = () => {
    userModifiedRef.current = true
    setPhones([])
    router.replace('/compare', { scroll: false })
    toast('Comparison cleared', 'info')
  }

  const scores = phones.map(p => p.value_score ?? scoreComposite(p))
  const bestIdx = scores.length >= 1 ? scores.indexOf(Math.max(...scores)) : -1

  const hasPhones = phones.length > 0
  const canCompare = phones.length >= 2

  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar compareCount={phones.length} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '16px 0', fontSize: 13, color: c.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/" style={{ color: c.text2, transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.text1 }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.text2 }}>
            Home
          </Link>
          <ChevronDown size={12} style={{ transform: 'rotate(-90deg)', color: c.text3 }} />
          <span>Compare</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 0 40px' }}>
          <h1 style={{ fontFamily: f.serif, fontSize: 40, color: c.text1, letterSpacing: '-0.5px', marginBottom: 8 }}>
            Phone Comparison
          </h1>
          <p style={{ fontSize: 16, color: c.text3 }}>
            {hasPhones
              ? canCompare
                ? 'Side-by-side specs, winners highlighted, honest verdicts.'
                : 'Add one more phone to see comparisons.'
              : 'Add phones to see a detailed comparison with winners and verdicts.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', gap: 12, padding: '12px 16px',
            background: 'rgba(230,57,70,0.06)', border: `1px solid var(--accent-border)`,
            borderRadius: r.md, marginBottom: 24, alignItems: 'center',
          }}>
            <AlertCircle size={16} color={c.accent} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: c.accent }}>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: c.primary }} />
            <p style={{ fontSize: 14, color: c.text3 }}>Loading phones…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasPhones && !error && (
          <div style={{ textAlign: 'center', padding: '40px 20px 60px' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 20px',
              background: 'var(--bg)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Smartphone size={28} color={c.text3} />
            </div>
            <h2 style={{ fontFamily: f.serif, fontSize: 24, color: c.text1, marginBottom: 12 }}>
              Compare Phones
            </h2>
            <p style={{ fontSize: 14, color: c.text3, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              Add 2–4 phones to see a detailed comparison with winners and verdicts.
            </p>
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <AddPhoneSlot onSelect={handleAdd} excludeIds={[]} />
            </div>
          </div>
        )}

        {/* Phone columns + everything else */}
        {hasPhones && !loading && (
          <>
            {/* Phone columns grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(phones.length + (phones.length < MAX_COMPARE ? 1 : 0), MAX_COMPARE)}, 1fr)`,
              gap: 16,
              marginBottom: 40,
            }} className="phone-cols">
              {phones.map((p, i) => (
                <PhoneColumn key={p.id} phone={p} onRemove={() => handleRemove(p.id)} isWinner={i === bestIdx} />
              ))}
              {phones.length < MAX_COMPARE && (
                <AddPhoneSlot onSelect={handleAdd} excludeIds={phones.map(p => p.id)} />
              )}
            </div>

            {/* Share bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 48 }}>
              <button onClick={handleShare} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', fontSize: 13, fontWeight: 500,
                border: `1px solid ${c.border}`, borderRadius: r.full,
                color: c.text2, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.color = c.text1 }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.text2 }}>
                <Share2 size={14} />
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button onClick={handleClear} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', fontSize: 13, fontWeight: 500,
                border: `1px solid ${c.border}`, borderRadius: r.full,
                color: c.text2, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.accent; (e.currentTarget as HTMLElement).style.color = c.accent }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.text2 }}>
                <RotateCcw size={14} />
                Clear all
              </button>
            </div>

            {/* Single phone hint */}
            {!canCompare && (
              <div style={{
                padding: '16px 20px', background: 'rgba(26,26,46,0.04)',
                border: `1px solid ${c.border}`, borderRadius: r.md,
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
              }}>
                <Plus size={14} color={c.primary} />
                <p style={{ fontSize: 13, color: c.primary }}>Add another phone to see comparisons</p>
              </div>
            )}

            {/* Verdicts + Table (only when 2+ phones) */}
            {canCompare && (
              <>
                <QuickVerdict phones={phones} />
                <SpecTable phones={phones} />
                <DetailedVerdicts phones={phones} />
                <BottomLine phones={phones} />
              </>
            )}

            {/* Bottom actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 64, flexWrap: 'wrap' }}>
              {phones.length < MAX_COMPARE && (
                <button onClick={() => {
                  const el = document.querySelector('.phone-cols')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', background: c.primary,
                  color: '#fff', borderRadius: r.full,
                  fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2A2A42' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.primary }}>
                  <Plus size={16} />
                  Add Another Phone
                </button>
              )}
              <Link href="/" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', border: `1px solid ${c.border}`,
                color: c.text2, borderRadius: r.full,
                fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.color = c.text1 }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.text2 }}>
                <Search size={16} />
                Browse All Phones
              </Link>
              <Link href="/pick" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', border: `1px solid var(--accent-border)`,
                color: c.accent, borderRadius: r.full,
                fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                Not sure? Help Me Choose →
              </Link>
            </div>
          </>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1023px) {
          .phone-cols { grid-template-columns: repeat(2, 1fr) !important; }
          .verdict-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bottom-recs { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .phone-cols { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .verdict-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON + EXPORT
   ═══════════════════════════════════════════════════════════════ */

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

interface CompareClientProps {
  initialPhones?: Phone[]
}

export default function CompareClient({ initialPhones = [] }: CompareClientProps) {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareContent initialPhones={initialPhones} />
    </Suspense>
  )
}
