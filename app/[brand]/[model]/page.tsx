'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronRight, Share2, GitCompare, ShoppingCart,
  Check, ChevronDown, Camera, Battery, Cpu, Monitor,
  Weight, Zap, Smartphone, ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { ROUTES, brandSlug, phoneSlug, valueScoreColor } from '@/lib/config'
import { c, f } from '@/lib/tokens'
import type { Phone } from '@/lib/types'
import Navbar from '@/app/components/Navbar'
import { ToastProvider, useToast } from '@/app/components/Toast'
import CompareBar from '@/app/components/CompareBar'

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Safely convert any spec value to a renderable string */
function specValueToString(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v || '—'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(specValueToString).join(', ')
  if (typeof v === 'object') {
    // flatten object to "key: value" pairs
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}: ${specValueToString(val)}`)
      .join(' · ')
  }
  return String(v)
}

/**
 * Extract spec groups from full_specifications.
 * Handles both { specifications: { … } } and flat { Display: { … }, … } shapes.
 */
function getSpecGroups(phone: Phone): [string, Record<string, string>][] {
  const fs = phone.full_specifications
  if (!fs || typeof fs !== 'object') return []

  // preferred shape: full_specifications.specifications
  const specsSource =
    (fs as any).specifications && typeof (fs as any).specifications === 'object'
      ? (fs as any).specifications
      : fs

  return Object.entries(specsSource)
    .filter(([key]) => {
      // skip known non-spec metadata keys
      const skip = new Set([
        'metadata', 'media', 'benchmarks', 'price_info',
        'quick_specs', 'processed_at', 'source_url',
      ])
      return !skip.has(key)
    })
    .map(([groupName, groupVal]) => {
      // each group should be an object of label→value pairs
      if (groupVal && typeof groupVal === 'object' && !Array.isArray(groupVal)) {
        const safe: Record<string, string> = {}
        for (const [k, v] of Object.entries(groupVal as Record<string, unknown>)) {
          safe[k] = specValueToString(v)
        }
        return [groupName, safe] as [string, Record<string, string>]
      }
      // scalar group value — show as single row
      return [groupName, { Value: specValueToString(groupVal) }] as [string, Record<string, string>]
    })
    .filter(([, specs]) => Object.keys(specs).length > 0)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 20px', fontSize: 14, fontWeight: 500,
        color: active ? c.text1 : c.text3,
        borderBottom: `2px solid ${active ? c.accent : 'transparent'}`,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function SpecGroup({ title, specs }: { title: string; specs: Record<string, string> }) {
  const [open, setOpen] = useState(true)
  const entries = Object.entries(specs)
  if (!entries.length) return null

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: open ? 'var(--r-md) var(--r-md) 0 0' : 'var(--r-md)',
          textAlign: 'left', transition: 'all 0.15s', cursor: 'pointer',
        }}
      >
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text1 }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: c.text3 }}>{entries.length}</span>
        <ChevronDown size={14} color={c.text3} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          background: c.surface, border: `1px solid ${c.border}`,
          borderTop: 'none', borderRadius: '0 0 var(--r-md) var(--r-md)', overflow: 'hidden',
        }}>
          {entries.map(([k, v], i) => (
            <div key={k} style={{
              display: 'flex', gap: 16, padding: '11px 20px',
              borderBottom: i < entries.length - 1 ? `1px solid ${c.border}` : 'none',
              background: i % 2 === 1 ? 'rgba(248,248,245,0.6)' : 'transparent',
            }}>
              <div style={{ width: 180, flexShrink: 0, fontSize: 13, color: c.text3, fontWeight: 500, paddingTop: 1 }}>
                {k}
              </div>
              {/* v is always a string now — safe to render directly */}
              <div style={{ flex: 1, fontSize: 13, color: c.text1, lineHeight: 1.5 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickSpecCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r-md)', padding: '16px 12px', textAlign: 'center',
    }}>
      <div style={{ color: c.text3, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: c.text1, marginBottom: 3, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
    </div>
  )
}

function OverviewSection({ title, headline, specs, note }: {
  title: string; headline: string
  specs: { label: string; value: string }[]
  note?: string
}) {
  if (!specs.length) return null
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 'var(--r-md)', padding: '22px 24px' }}>
      <div style={{ fontFamily: f.serif, fontSize: 20, color: c.text1, marginBottom: 10 }}>{title}</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: c.text1, marginBottom: 14 }}>{headline}</div>
      <div className="specs-2col">
        {specs.map(s => (
          <div key={s.label} style={{ padding: '9px 12px', background: c.bg, borderRadius: 'var(--r-sm)' }}>
            <div style={{ fontSize: 11, color: c.text3, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      {note && (
        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: 'rgba(69,123,157,0.06)', border: '1px solid rgba(69,123,157,0.12)',
          borderRadius: 'var(--r-sm)', fontSize: 13, color: c.text2, lineHeight: 1.6, fontStyle: 'italic',
        }}>
          {note}
        </div>
      )}
    </div>
  )
}

function SimilarCard({ phone }: { phone: Phone }) {
  const [imgErr, setImgErr] = useState(false)
  const href = ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))
  return (
    <Link
      href={href}
      style={{
        flexShrink: 0, width: 160, background: c.surface,
        border: `1px solid ${c.border}`, borderRadius: 'var(--r-md)',
        padding: '14px 12px', textAlign: 'center', transition: 'all 0.15s',
        scrollSnapAlign: 'start', display: 'block', textDecoration: 'none',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.borderColor = c.borderHover
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'none'
        el.style.boxShadow = 'none'
        el.style.borderColor = c.border
      }}
    >
      <div style={{ width: 80, height: 80, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phone.main_image_url && !imgErr
          ? <img src={phone.main_image_url} alt={phone.model_name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <Smartphone size={36} color={c.border} strokeWidth={1} />}
      </div>
      <div style={{ fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{phone.brand}</div>
      <div style={{ fontFamily: f.serif, fontSize: 13, color: c.text1, lineHeight: 1.3, marginBottom: 4 }}>{phone.model_name}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>
        {phone.price_usd ? `$${phone.price_usd.toLocaleString()}` : '—'}
      </div>
    </Link>
  )
}

// ─── slug resolution ──────────────────────────────────────────────────────────

function pickBest(phones: Phone[], targetSlug: string): Phone | null {
  if (!phones.length) return null
  const target = targetSlug.toLowerCase()
  let best: Phone | null = null
  let bestScore = -1

  for (const p of phones) {
    const ps = phoneSlug(p).toLowerCase()
    if (ps === target) return p
    let score = 0; let ti = 0
    for (let pi = 0; pi < ps.length && ti < target.length; pi++) {
      if (ps[pi] === target[ti]) { score++; ti++ }
    }
    if (score > bestScore) { bestScore = score; best = p }
  }
  return bestScore > target.length * 0.5 ? best : null
}

async function resolvePhone(brand: string, model: string): Promise<Phone | null> {
  const brandName  = brand.replace(/-/g, ' ')
  const modelWords = model.replace(/-/g, ' ')

  // attempt 1 — full model slug + brand filter
  {
    const res = await api.phones.search({ q: modelWords, brand: brandName, page_size: 10 })
    const match = pickBest(res.results, model)
    if (match) return api.phones.detail(match.id)
  }

  // attempt 2 — full model slug, no brand filter
  {
    const res = await api.phones.search({ q: modelWords, page_size: 10 })
    const match = pickBest(res.results, model)
    if (match) return api.phones.detail(match.id)
  }

  // attempt 3 — strip leading brand tokens
  const brandTokens = brandName.toLowerCase().split(' ')
  let queryTokens   = modelWords.toLowerCase().split(' ')
  for (const bt of brandTokens) {
    if (queryTokens[0] === bt) queryTokens = queryTokens.slice(1)
  }
  const stripped = queryTokens.join(' ')
  if (stripped && stripped !== modelWords.toLowerCase()) {
    const res = await api.phones.search({ q: stripped, brand: brandName, page_size: 10 })
    const match = pickBest(res.results, model)
    if (match) return api.phones.detail(match.id)
  }

  // attempt 4 — browse brand phones, fuzzy-match slug
  try {
    const res = await api.phones.search({ brand: brandName, page_size: 50 })
    const match = pickBest(res.results, model)
    if (match) return api.phones.detail(match.id)
  } catch { /* ignore */ }

  return null
}

// ─── main page ────────────────────────────────────────────────────────────────

function PhoneDetailContent() {
  const params   = useParams()
  const router   = useRouter()
  const { toast } = useToast()

  const brand = (params?.brand as string) ?? ''
  const model = (params?.model as string) ?? ''

  const [phone, setPhone]             = useState<Phone | null>(null)
  const [similar, setSimilar]         = useState<Phone[]>([])
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [tab, setTab]                 = useState<'overview' | 'specs' | 'compare'>('overview')
  const [imgErr, setImgErr]           = useState(false)
  const [copied, setCopied]           = useState(false)
  const [comparePhones, setComparePhones] = useState<Phone[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!brand || !model) return
    let cancelled = false

    setLoading(true)
    setNotFound(false)
    setPhone(null)
    setSimilar([])

    resolvePhone(brand, model)
      .then(async found => {
        if (cancelled) return
        if (!found) { setNotFound(true); return }

        setPhone(found)

        // fetch similar separately — never crash the page if it fails
        api.phones.similar(found.id, 12)
          .then(sim => { if (!cancelled) setSimilar(sim?.phones ?? []) })
          .catch(() => { /* similar is optional */ })
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [brand, model])

  const inCompare = phone ? comparePhones.some(p => p.id === phone.id) : false

  const handleCompareToggle = () => {
    if (!phone) return
    setComparePhones(prev => {
      if (prev.find(p => p.id === phone.id)) {
        toast('Removed from compare', 'info')
        return prev.filter(p => p.id !== phone.id)
      }
      if (prev.length >= 4) { toast('Maximum 4 phones', 'error'); return prev }
      toast('Added to compare', 'success')
      return [...prev, phone]
    })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast('Link copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch { /* denied */ }
  }

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar compareCount={0} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px var(--page-px)' }}>
        <div className="phone-hero-grid" style={{ gap: 40, paddingBottom: 48 }}>
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--r-xl)' }} />
          <div style={{ paddingTop: 8 }}>
            <div className="skeleton" style={{ height: 12, width: '30%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 36, width: '85%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 72, borderRadius: 'var(--r-md)', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="skeleton" style={{ height: 44, flex: 1, borderRadius: 22 }} />
              <div className="skeleton" style={{ height: 44, flex: 1, borderRadius: 22 }} />
            </div>
          </div>
        </div>
        <div className="quick-specs-grid" style={{ marginBottom: 48 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-md)' }} />
          ))}
        </div>
      </div>
    </div>
  )

  // ── not found ───────────────────────────────────────────────────────────────
  if (notFound || !phone) return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar compareCount={0} />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 var(--page-px)', textAlign: 'center' }}>
        <Smartphone size={64} color={c.border} strokeWidth={1} style={{ margin: '0 auto 20px' }} />
        <h1 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, marginBottom: 10 }}>Phone not found</h1>
        <p style={{ fontSize: 15, color: c.text2, lineHeight: 1.6, marginBottom: 24 }}>
          We don't have this phone in our database. We only track phones currently available for purchase.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={ROUTES.home} style={{
            padding: '10px 24px', background: c.primary, color: '#fff',
            borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 600,
          }}>Browse All Phones</Link>
          <Link href={ROUTES.brand(brand)} style={{
            padding: '10px 24px', border: `1px solid ${c.border}`, color: c.text2,
            borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 500,
          }}>Browse {brand.replace(/-/g, ' ')} phones</Link>
        </div>
      </div>
    </div>
  )

  // ── derived data ────────────────────────────────────────────────────────────
  const quickSpecs = [
    phone.screen_size         ? { icon: <Monitor size={20} strokeWidth={1.5} />, value: `${phone.screen_size}"`,                  label: 'Display'  } : null,
    phone.main_camera_mp      ? { icon: <Camera  size={20} strokeWidth={1.5} />, value: `${phone.main_camera_mp}MP`,              label: 'Camera'   } : null,
    phone.battery_capacity    ? { icon: <Battery size={20} strokeWidth={1.5} />, value: phone.battery_capacity.toLocaleString(),  label: 'mAh'      } : null,
    phone.ram_options?.length ? { icon: <Cpu     size={20} strokeWidth={1.5} />, value: `${Math.max(...phone.ram_options!)}GB`,   label: 'Max RAM'  } : null,
    phone.fast_charging_w     ? { icon: <Zap     size={20} strokeWidth={1.5} />, value: `${phone.fast_charging_w}W`,              label: 'Charging' } : null,
    phone.weight_g            ? { icon: <Weight  size={20} strokeWidth={1.5} />, value: `${phone.weight_g}g`,                    label: 'Weight'   } : null,
  ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[]

  const specGroups = getSpecGroups(phone)
  const valueScore = (phone as any).value_score as number | null

  const overviewSections = [
    {
      title: 'Display', headline: phone.screen_size ? `${phone.screen_size}" Screen` : 'Display',
      specs: [
        phone.screen_size       ? { label: 'Screen Size', value: `${phone.screen_size}"` } : null,
        phone.screen_resolution ? { label: 'Resolution',  value: phone.screen_resolution } : null,
        (phone.full_specifications as any)?.quick_specs?.displaytype
          ? { label: 'Type', value: String((phone.full_specifications as any).quick_specs.displaytype) } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      title: 'Camera', headline: phone.main_camera_mp ? `${phone.main_camera_mp}MP Main Camera` : 'Camera System',
      specs: [
        phone.main_camera_mp ? { label: 'Main Camera',  value: `${phone.main_camera_mp} MP` } : null,
        (phone.full_specifications as any)?.quick_specs?.cam1modules
          ? { label: 'Rear System',  value: String((phone.full_specifications as any).quick_specs.cam1modules) } : null,
        (phone.full_specifications as any)?.quick_specs?.cam2modules
          ? { label: 'Front Camera', value: String((phone.full_specifications as any).quick_specs.cam2modules) } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      title: 'Performance', headline: phone.chipset || 'Processor',
      specs: [
        phone.chipset             ? { label: 'Chipset',     value: phone.chipset } : null,
        phone.ram_options?.length ? { label: 'RAM Options', value: phone.ram_options!.map(r => `${r}GB`).join(' / ') } : null,
        phone.storage_options?.length
          ? { label: 'Storage', value: phone.storage_options!.map(s => s >= 1000 ? `${s / 1000}TB` : `${s}GB`).join(' / ') } : null,
        phone.antutu_score ? { label: 'AnTuTu', value: phone.antutu_score.toLocaleString() } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      title: 'Battery & Charging', headline: phone.battery_capacity ? `${phone.battery_capacity.toLocaleString()} mAh` : 'Battery',
      specs: [
        phone.battery_capacity ? { label: 'Capacity',      value: `${phone.battery_capacity.toLocaleString()} mAh` } : null,
        phone.fast_charging_w  ? { label: 'Fast Charging', value: `${phone.fast_charging_w}W` } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      title: 'Build & Design', headline: phone.weight_g ? `${phone.weight_g}g` : 'Build',
      specs: [
        phone.weight_g     ? { label: 'Weight',    value: `${phone.weight_g}g` }      : null,
        phone.thickness_mm ? { label: 'Thickness', value: `${phone.thickness_mm}mm` } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    },
  ]

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar
        compareCount={comparePhones.length}
        onOpenCompare={() => {
          if (comparePhones.length >= 2)
            router.push(ROUTES.compare(...comparePhones.map(p => phoneSlug(p))))
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--page-px)' }}>

        {/* breadcrumb */}
        <nav style={{ padding: '14px 0', fontSize: 13, color: c.text3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link href={ROUTES.home} style={{ color: c.text2 }}>Home</Link>
          <ChevronRight size={12} />
          <Link href={ROUTES.brand(brandSlug(phone.brand))} style={{ color: c.text2 }}>{phone.brand}</Link>
          <ChevronRight size={12} />
          <span>{phone.model_name}</span>
        </nav>

        {/* hero grid */}
        <div className="phone-hero-grid">
          {/* image */}
          <div style={{
            background: c.surface, border: `1px solid ${c.border}`,
            borderRadius: 'var(--r-xl)', padding: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            aspectRatio: '1', position: 'relative',
          }}>
            {phone.main_image_url && !imgErr
              ? <img src={phone.main_image_url} alt={phone.model_name} onError={() => setImgErr(true)} style={{ maxWidth: '72%', maxHeight: '72%', objectFit: 'contain' }} />
              : <Smartphone size={100} color={c.border} strokeWidth={0.8} />}
            {phone.release_year && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 'var(--r-full)', padding: '4px 10px',
                fontSize: 11, fontWeight: 600, color: c.text3,
              }}>
                {phone.release_year}
              </div>
            )}
          </div>

          {/* info */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: c.text3, marginBottom: 6 }}>
              {phone.brand}
            </div>
            <h1 style={{ fontFamily: f.serif, fontSize: 'clamp(26px,3vw,38px)', color: c.text1, letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
              {phone.model_name}
            </h1>
            <div style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 600, color: c.text1, marginBottom: 4 }}>
              {phone.price_usd ? `$${phone.price_usd.toLocaleString()}` : 'Price TBA'}
            </div>
            {phone.price_usd && (
              <div style={{ fontSize: 13, color: c.text3, marginBottom: 18 }}>Starting price · US</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              <span style={{ padding: '4px 12px', background: 'var(--green-light)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600 }}>
                Available
              </span>
              {(phone as any).chipset_tier === 'flagship' && (
                <span style={{ padding: '4px 12px', background: 'var(--accent-light)', color: c.accent, border: '1px solid var(--accent-border)', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600 }}>
                  Flagship
                </span>
              )}
            </div>

            {valueScore != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: c.surface, border: `1px solid ${c.border}`, borderRadius: 'var(--r-md)', marginBottom: 18 }}>
                <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: valueScoreColor(valueScore) }}>
                  {valueScore.toFixed(1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text2, marginBottom: 5 }}>Value Score</div>
                  <div style={{ height: 5, background: c.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${valueScore * 10}%`, background: valueScoreColor(valueScore), borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: c.text3 }}>Specs/dollar</div>
              </div>
            )}

            <div className="hero-actions">
              <button
                onClick={handleCompareToggle}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                  fontSize: 14, fontWeight: 600,
                  color: inCompare ? '#fff' : c.primary,
                  background: inCompare ? c.primary : 'transparent',
                  border: `1px solid ${c.primary}`, borderRadius: 'var(--r-full)',
                  transition: 'all 0.15s', cursor: 'pointer', flex: 1,
                }}
              >
                <GitCompare size={15} strokeWidth={2} />
                {inCompare ? 'In Compare' : 'Add to Compare'}
              </button>

              {phone.amazon_link && (
                <a
                  href={phone.amazon_link} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                    fontSize: 14, fontWeight: 600, color: '#fff', background: c.primary,
                    borderRadius: 'var(--r-full)', transition: 'all 0.15s', flex: 1,
                    textDecoration: 'none', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2A2A42' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.primary }}
                >
                  <ShoppingCart size={15} strokeWidth={2} />
                  Buy on Amazon
                </a>
              )}
            </div>

            <button
              onClick={handleShare}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: copied ? 'var(--green)' : c.text3, transition: 'color 0.15s', marginTop: 14, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              {copied ? 'Link copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* quick specs */}
        <div className="quick-specs-grid" style={{ marginBottom: 40 }}>
          {quickSpecs.map((spec, i) => <QuickSpecCard key={i} {...spec} />)}
        </div>

        {/* sticky tabs */}
        <div style={{
          position: 'sticky', top: 'var(--nav-h)', zIndex: 50,
          background: 'rgba(248,248,245,0.93)', backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${c.border}`, marginBottom: 28,
          display: 'flex', overflowX: 'auto',
        }}>
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
          <TabButton active={tab === 'specs'}    onClick={() => setTab('specs')}>Full Specs</TabButton>
          <TabButton active={tab === 'compare'}  onClick={() => setTab('compare')}>Compare</TabButton>
        </div>

        {/* overview tab */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
            {overviewSections.map(s => s.specs.length > 0 && <OverviewSection key={s.title} {...s} />)}
          </div>
        )}

        {/* specs tab */}
        {tab === 'specs' && (
          <div style={{ marginBottom: 48 }}>
            {specGroups.length > 0
              ? specGroups.map(([name, specs]) => (
                  <SpecGroup key={name} title={name} specs={specs} />
                ))
              : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: c.text3 }}>
                  <Smartphone size={48} color={c.border} strokeWidth={1} style={{ margin: '0 auto 12px' }} />
                  <p>Detailed specifications not available for this model.</p>
                </div>
              )
            }
          </div>
        )}

        {/* compare tab */}
        {tab === 'compare' && (
          <div style={{ maxWidth: 580, marginBottom: 48 }}>
            <div style={{ fontFamily: f.serif, fontSize: 22, color: c.text1, marginBottom: 6 }}>
              Compare {phone.model_name} with
            </div>
            <p style={{ fontSize: 14, color: c.text3, marginBottom: 22 }}>
              Select a phone to see a full side-by-side spec comparison.
            </p>

            {similar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: c.text3 }}>
                <Smartphone size={40} color={c.border} strokeWidth={1} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14 }}>No similar phones found to compare with.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {similar.slice(0, 6).map(p => (
                  <Link
                    key={p.id}
                    href={ROUTES.compare(phoneSlug(phone), phoneSlug(p))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                      background: c.surface, border: `1px solid ${c.border}`,
                      borderRadius: 'var(--r-md)', transition: 'all 0.15s', textDecoration: 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border;   (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {p.main_image_url
                        ? <img src={p.main_image_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        : <Smartphone size={20} color={c.border} strokeWidth={1} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: c.text1 }}>{p.model_name}</div>
                      <div style={{ fontSize: 12, color: c.text3 }}>
                        {p.price_usd ? `$${p.price_usd.toLocaleString()}` : '—'}
                        {p.main_camera_mp ? ` · ${p.main_camera_mp}MP` : ''}
                        {p.battery_capacity ? ` · ${p.battery_capacity.toLocaleString()}mAh` : ''}
                      </div>
                    </div>
                    <ArrowRight size={15} color={c.text3} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* similar phones section — always shown below tabs */}
        {similar.length > 0 && (
          <section style={{ marginTop: 48, marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: f.serif, fontSize: 26, color: c.text1 }}>Similar Phones</h2>
              <span style={{ fontSize: 13, color: c.text3 }}>Based on price &amp; specs</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                ref={scrollRef}
                className="scrollbar-none"
                style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}
              >
                {similar.map(p => <SimilarCard key={p.id} phone={p} />)}
              </div>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 56, background: 'linear-gradient(-90deg,var(--bg) 0%,transparent 100%)', pointerEvents: 'none' }} />
            </div>
          </section>
        )}

      </div>

      <CompareBar
        phones={comparePhones}
        onRemove={id => setComparePhones(prev => prev.filter(p => p.id !== id))}
        onClear={() => setComparePhones([])}
      />

      <style>{`
        .phone-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          padding-bottom: 40px;
          align-items: start;
        }
        .quick-specs-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .specs-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 4px;
        }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 1023px) {
          .phone-hero-grid { grid-template-columns: 1fr; gap: 28px; }
          .phone-hero-grid > div:first-child { max-width: 400px; margin: 0 auto; width: 100%; }
          .quick-specs-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .quick-specs-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .specs-2col { grid-template-columns: 1fr; }
          .hero-actions { flex-direction: column; }
          .hero-actions a, .hero-actions button { justify-content: center; }
        }
      `}</style>
    </div>
  )
}

export default function PhoneDetailPage() {
  return (
    <ToastProvider>
      <PhoneDetailContent />
    </ToastProvider>
  )
}
