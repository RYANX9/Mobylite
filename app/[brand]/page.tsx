'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronRight, ChevronLeft, SlidersHorizontal,
  ArrowUpDown, LayoutGrid, List, GitCompare,
  Smartphone, Check, X, ChevronDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { ROUTES, brandSlug, phoneSlug } from '@/lib/config'
import { c, f } from '@/lib/tokens'
import type { Phone } from '@/lib/types'
import BRANDS, { getBrandInfo, getBrandInitial, type BrandInfo } from '@/lib/brandData'
import Navbar from '@/app/components/Navbar'
import { ToastProvider, useToast } from '@/app/components/Toast'
import CompareBar from '@/app/components/CompareBar'

// ─── types ────────────────────────────────────────────────────────────────────

interface BrandStats {
  brand: string
  total_phones: number
  price_range: { min: number | null; max: number | null; avg: number | null }
  avg_battery: number | null
  latest_year: number | null
  latest_phone: Phone | null
}

interface SortOption {
  label: string
  value: string
  order: 'asc' | 'desc'
}

const SORT_OPTIONS: SortOption[] = [
  { label: 'Newest First',        value: 'release_year',    order: 'desc' },
  { label: 'Oldest First',        value: 'release_year',    order: 'asc'  },
  { label: 'Price: Low to High',  value: 'price_usd',       order: 'asc'  },
  { label: 'Price: High to Low',  value: 'price_usd',       order: 'desc' },
  { label: 'Best Camera',         value: 'main_camera_mp',  order: 'desc' },
  { label: 'Best Battery',        value: 'battery_capacity',order: 'desc' },
  { label: 'Best Performance',    value: 'antutu_score',    order: 'desc' },
]

const PAGE_SIZE = 24

// ─── helpers ──────────────────────────────────────────────────────────────────

function valueScoreColor(s: number): string {
  if (s >= 7.5) return 'var(--green)'
  if (s >= 5)   return c.text2
  return '#E76F51'
}

function fmt(n: number | null | undefined, prefix = '', suffix = '') {
  if (n == null) return '—'
  return `${prefix}${Math.round(n).toLocaleString()}${suffix}`
}

// ─── sub-components ───────────────────────────────────────────────────────────

function BrandLogoImg({ info, name }: { info: BrandInfo | null; name: string }) {
  const [err, setErr] = useState(false)
  if (info?.logo && !err) {
    return (
      <div style={{
        flexShrink: 0, width: 72, height: 72,
        background: c.surface, border: `1px solid ${c.border}`,
        borderRadius: 'var(--r-md)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 10, boxShadow: 'var(--shadow-sm)',
      }}>
        <img
          src={info.logo}
          alt={name}
          onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    )
  }
  return (
    <div style={{
      flexShrink: 0, width: 72, height: 72,
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r-md)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: f.serif, fontSize: 28, fontWeight: 700,
      color: c.primary, letterSpacing: -1,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {getBrandInitial(name)}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r-md)', padding: '18px 20px',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.borderHover; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border;      (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: f.serif, fontSize: 24, color: c.text1, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: c.text3 }}>{sub}</div>}
    </div>
  )
}

function PhoneCard({
  phone, onCompareToggle, inCompare,
}: { phone: Phone; onCompareToggle: (p: Phone) => void; inCompare: boolean }) {
  const [imgErr, setImgErr] = useState(false)
  const href = ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))
  const isNew = phone.release_year && phone.release_year >= new Date().getFullYear() - 1

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: c.surface, border: `1px solid ${c.border}`,
          borderRadius: 'var(--r-md)', padding: '18px 16px',
          transition: 'all 0.15s', position: 'relative',
          display: 'flex', flexDirection: 'column', height: '100%',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.borderHover; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border;      (e.currentTarget as HTMLElement).style.transform = 'none';              (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        {/* compare checkbox */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onCompareToggle(phone) }}
          style={{
            position: 'absolute', top: 12, left: 12,
            width: 20, height: 20, borderRadius: 4,
            border: `1.5px solid ${inCompare ? 'var(--accent)' : c.border}`,
            background: inCompare ? 'var(--accent)' : c.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', cursor: 'pointer', zIndex: 2,
          }}
          title="Add to compare"
        >
          {inCompare && <Check size={10} color="white" strokeWidth={3} />}
        </button>

        {/* new badge */}
        {isNew && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'var(--accent)', color: 'white',
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.5px', padding: '2px 8px',
            borderRadius: 'var(--r-full)',
          }}>New</div>
        )}

        {/* image */}
        <div style={{
          width: '100%', aspectRatio: '1', background: c.bg,
          borderRadius: 'var(--r-sm)', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.border,
        }}>
          {phone.main_image_url && !imgErr
            ? <img src={phone.main_image_url} alt={phone.model_name} onError={() => setImgErr(true)} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            : <Smartphone size={48} strokeWidth={1} />}
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3, marginBottom: 2 }}>
          {phone.brand}
        </div>
        <div style={{ fontFamily: f.serif, fontSize: 16, color: c.text1, marginBottom: 6, lineHeight: 1.3 }}>
          {phone.model_name}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: c.text1, marginBottom: 12 }}>
          {phone.price_usd ? `$${Math.round(phone.price_usd).toLocaleString()}` : <span style={{ fontSize: 13, fontWeight: 400, color: c.text3 }}>Price TBA</span>}
        </div>

        {/* spec badges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[
            phone.screen_size      ? { l: 'Display',  v: `${phone.screen_size}"` }               : null,
            phone.battery_capacity ? { l: 'Battery',  v: `${phone.battery_capacity.toLocaleString()} mAh` } : null,
            phone.ram_options?.length ? { l: 'RAM', v: `${Math.max(...phone.ram_options!)} GB` } : null,
            phone.main_camera_mp   ? { l: 'Camera',   v: `${phone.main_camera_mp} MP` }          : null,
          ].filter(Boolean).slice(0, 4).map((b, i) => (
            <div key={i} style={{ padding: '5px 8px', background: c.bg, borderRadius: 'var(--r-sm)', fontSize: 11 }}>
              <div style={{ color: c.text3, marginBottom: 1 }}>{b!.l}</div>
              <div style={{ fontWeight: 500, color: c.text2 }}>{b!.v}</div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: c.text3 }}>
            {phone.release_year ?? '—'}
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text3 }}>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function MiniPhoneCard({ phone }: { phone: Phone }) {
  const [imgErr, setImgErr] = useState(false)
  const isNew = phone.release_year && phone.release_year >= new Date().getFullYear() - 1
  return (
    <Link
      href={ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))}
      style={{
        flexShrink: 0, width: 158, scrollSnapAlign: 'start',
        background: c.surface, border: `1px solid ${c.border}`,
        borderRadius: 'var(--r-md)', padding: '16px 14px',
        cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
        display: 'block', textDecoration: 'none',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = c.borderHover; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = c.border; el.style.transform = 'none'; el.style.boxShadow = 'none' }}
    >
      {isNew && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--accent)', color: 'white',
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          padding: '2px 6px', borderRadius: 'var(--r-full)',
        }}>New</span>
      )}
      <div style={{ width: '100%', aspectRatio: '1', background: c.bg, borderRadius: 'var(--r-sm)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.border }}>
        {phone.main_image_url && !imgErr
          ? <img src={phone.main_image_url} alt={phone.model_name} onError={() => setImgErr(true)} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          : <Smartphone size={32} strokeWidth={1} />}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: c.text3, marginBottom: 2 }}>{phone.brand}</div>
      <div style={{ fontFamily: f.serif, fontSize: 13, color: c.text1, lineHeight: 1.3, marginBottom: 6 }}>{phone.model_name}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.text1, marginBottom: 4 }}>
        {phone.price_usd ? `$${Math.round(phone.price_usd).toLocaleString()}` : '—'}
      </div>
      {(phone.main_camera_mp || phone.battery_capacity) && (
        <div style={{ fontSize: 11, color: c.text3 }}>
          {phone.main_camera_mp ? `${phone.main_camera_mp}MP` : ''}
          {phone.main_camera_mp && phone.battery_capacity ? ' · ' : ''}
          {phone.battery_capacity ? `${phone.battery_capacity.toLocaleString()}mAh` : ''}
        </div>
      )}
    </Link>
  )
}

function Pagination({
  page, total, pageSize, onChange,
}: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  const btnStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    minWidth: 36, height: 36, padding: '0 6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, borderRadius: 'var(--r-sm)', cursor: disabled ? 'default' : 'pointer',
    background: active ? c.primary : 'transparent',
    color: active ? '#fff' : disabled ? c.border : c.text2,
    fontWeight: active ? 600 : 400,
    border: 'none', transition: 'all 0.15s',
    pointerEvents: disabled ? 'none' : 'auto',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 64 }}>
      <button style={btnStyle(false, page === 1)} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} style={{ width: 36, textAlign: 'center', color: c.text3, fontSize: 14 }}>…</span>
          : <button key={p} style={btnStyle(p === page)} onClick={() => onChange(p as number)}>{p}</button>
      )}
      <button style={btnStyle(false, page === totalPages)} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

function BrandPageContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const slug      = (params?.brand as string) ?? ''
  const brandName = slug.replace(/-/g, ' ')

  // data
  const [stats, setStats]         = useState<BrandStats | null>(null)
  const [phones, setPhones]       = useState<Phone[]>([])
  const [latest, setLatest]       = useState<Phone[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [phonesLoading, setPhonesLoading] = useState(false)
  const [notFound, setNotFound]   = useState(false)

  // ui
  const [page, setPage]           = useState(1)
  const [sortIdx, setSortIdx]     = useState(0)
  const [gridView, setGridView]   = useState(true)
  const [comparePhones, setComparePhones] = useState<Phone[]>([])
  const [sortOpen, setSortOpen]   = useState(false)
  const [minPrice, setMinPrice]   = useState<number | null>(null)
  const [maxPrice, setMaxPrice]   = useState<number | null>(null)
  const [minYear, setMinYear]     = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef   = useRef<HTMLDivElement>(null)
  const info      = getBrandInfo(slug)

  // ── initial stats + latest phones ──────────────────────────────────────────
  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)

    api.brands.detail(slug)
      .then(data => {
        setStats(data as BrandStats)
        // fetch latest 10 for the scroll row
        return api.brands.phones(slug, { sort_by: 'release_year', sort_order: 'desc', page: 1, page_size: 10 })
      })
      .then(res => setLatest(res.results))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // ── paginated phone grid ────────────────────────────────────────────────────
  const loadPhones = useCallback(async () => {
    if (!slug) return
    setPhonesLoading(true)
    const sort = SORT_OPTIONS[sortIdx]
    try {
      const res = await api.brands.phones(slug, {
        sort_by: sort.value,
        sort_order: sort.order,
        page,
        page_size: PAGE_SIZE,
      })
      // client-side price / year filter (API doesn't expose these on brand endpoint)
      let results = res.results
      if (minPrice != null) results = results.filter(p => p.price_usd && p.price_usd >= minPrice)
      if (maxPrice != null) results = results.filter(p => p.price_usd && p.price_usd <= maxPrice)
      if (minYear  != null) results = results.filter(p => p.release_year && p.release_year >= minYear)
      setPhones(results)
      setTotal(res.total)
    } catch {
      toast('Failed to load phones', 'error')
    } finally {
      setPhonesLoading(false)
    }
  }, [slug, page, sortIdx, minPrice, maxPrice, minYear])

  useEffect(() => { loadPhones() }, [loadPhones])

  const handlePageChange = (p: number) => {
    setPage(p)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSortChange = (idx: number) => {
    setSortIdx(idx); setPage(1); setSortOpen(false)
  }

  const handleCompareToggle = (phone: Phone) => {
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

  // ── loading state ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar compareCount={0} />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        <div className="skeleton" style={{ height: 14, width: '20%', marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 28, marginBottom: 40 }}>
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 44, width: '30%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: '50%' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--r-md)' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--r-md)' }} />)}
        </div>
      </div>
    </div>
  )

  // ── not found ───────────────────────────────────────────────────────────────
  if (notFound || !stats) return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar compareCount={0} />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <Smartphone size={64} color={c.border} strokeWidth={1} style={{ margin: '0 auto 20px' }} />
        <h1 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1, marginBottom: 10 }}>Brand not found</h1>
        <p style={{ fontSize: 15, color: c.text2, lineHeight: 1.6, marginBottom: 24 }}>
          We don't have <strong>{brandName}</strong> in our database yet.
        </p>
        <Link href={ROUTES.home} style={{ padding: '10px 24px', background: c.primary, color: '#fff', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 600 }}>
          Browse All Phones
        </Link>
      </div>
    </div>
  )

  const totalPages = Math.ceil(total / PAGE_SIZE)

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

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* breadcrumb */}
        <nav style={{ padding: '16px 0 0', fontSize: 13, color: c.text3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link href={ROUTES.home} style={{ color: c.text2 }}>Home</Link>
          <ChevronRight size={12} />
          <span>{stats.brand}</span>
        </nav>

        {/* ── BRAND HERO ── */}
        <div style={{ padding: '28px 0 36px', display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
          <BrandLogoImg info={info} name={stats.brand} />
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 style={{ fontFamily: f.serif, fontSize: 'clamp(32px,4vw,48px)', color: c.text1, letterSpacing: -1, lineHeight: 1.1, marginBottom: 10 }}>
              {stats.brand}
            </h1>

            {/* meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 14, color: c.text2, marginBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={14} />
                {stats.total_phones} phones available
              </span>
              {stats.latest_year && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: c.border, display: 'inline-block' }} />
                  <span>Latest: {stats.latest_year}</span>
                </>
              )}
              {info && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: c.border, display: 'inline-block' }} />
                  <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={13} />
                    {info.highlights[0]}
                  </span>
                </>
              )}
            </div>

            {/* description */}
            {info && (
              <p style={{ fontSize: 15, color: c.text2, maxWidth: 620, lineHeight: 1.7, marginBottom: 16 }}>
                {info.description}
              </p>
            )}

            {/* tags */}
            {info && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {info.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '4px 12px', background: c.surface,
                    border: `1px solid ${c.border}`, borderRadius: 'var(--r-full)',
                    fontSize: 12, fontWeight: 500, color: c.text2,
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40 }} className="stats-grid">
          <StatCard
            label="Average Price"
            value={fmt(stats.price_range.avg, '$')}
            sub={`Across ${stats.total_phones} models`}
          />
          <StatCard
            label="Price Range"
            value={stats.price_range.min && stats.price_range.max
              ? `$${Math.round(stats.price_range.min).toLocaleString()} – $${Math.round(stats.price_range.max).toLocaleString()}`
              : '—'}
            sub={stats.latest_phone ? `${stats.latest_phone.model_name}` : undefined}
          />
          <StatCard
            label="Latest Release"
            value={stats.latest_phone?.model_name ?? '—'}
            sub={stats.latest_year ? `Released ${stats.latest_year}` : undefined}
          />
          <StatCard
            label="Avg Battery"
            value={fmt(stats.avg_battery, '', ' mAh')}
            sub="Across current lineup"
          />
        </div>

        {/* ── LATEST RELEASES SCROLL ROW ── */}
        {latest.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: f.serif, fontSize: 24, color: c.text1 }}>Latest Releases</h2>
              <button
                onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{ fontSize: 13, color: c.text3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                View all {stats.total_phones} phones <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: -360, behavior: 'smooth' })}
                style={{
                  position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: c.surface, border: `1px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.text2, cursor: 'pointer', zIndex: 2, boxShadow: 'var(--shadow-md)',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <div
                ref={scrollRef}
                className="scrollbar-none"
                style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}
              >
                {latest.map(p => <MiniPhoneCard key={p.id} phone={p} />)}
              </div>
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
                style={{
                  position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: c.surface, border: `1px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.text2, cursor: 'pointer', zIndex: 2, boxShadow: 'var(--shadow-md)',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── GRID: sort bar + phone cards ── */}
        <div ref={gridRef}>

          {/* sort / view controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* sort dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setSortOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', fontSize: 13, fontWeight: 500,
                    color: c.text1, background: c.surface,
                    border: `1px solid ${c.border}`, borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowUpDown size={14} color={c.text3} />
                  {SORT_OPTIONS[sortIdx].label}
                  <ChevronDown size={13} color={c.text3} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
                {sortOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4,
                    background: c.surface, border: `1px solid ${c.border}`,
                    borderRadius: 'var(--r-md)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)', zIndex: 30, minWidth: 180,
                  }}>
                    {SORT_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSortChange(i)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 16px', fontSize: 13,
                          color: i === sortIdx ? c.primary : c.text2,
                          fontWeight: i === sortIdx ? 600 : 400,
                          background: i === sortIdx ? 'rgba(26,26,46,0.04)' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (i !== sortIdx) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)' }}
                        onMouseLeave={e => { if (i !== sortIdx) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span style={{ fontSize: 13, color: c.text3 }}>
                Showing <strong style={{ color: c.text1 }}>{total.toLocaleString()}</strong> phones
              </span>
            </div>

            {/* grid / list toggle */}
            <div style={{ display: 'flex', gap: 2, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--r-sm)', padding: 3 }}>
              {[
                { icon: <LayoutGrid size={14} />, grid: true  },
                { icon: <List        size={14} />, grid: false },
              ].map(({ icon, grid }) => (
                <button
                  key={String(grid)}
                  onClick={() => setGridView(grid)}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: gridView === grid ? c.text1 : c.text3,
                    background: gridView === grid ? c.surface : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: gridView === grid ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* phone grid / list */}
          {phonesLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: gridView ? 'repeat(3,1fr)' : '1fr', gap: 16, marginBottom: 40 }} className={gridView ? 'phone-grid-3' : ''}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: gridView ? 320 : 100, borderRadius: 'var(--r-md)' }} />
              ))}
            </div>
          ) : phones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: c.text3 }}>
              <Smartphone size={48} color={c.border} strokeWidth={1} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15 }}>No phones found.</p>
            </div>
          ) : gridView ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }} className="phone-grid-3">
              {phones.map(p => (
                <PhoneCard
                  key={p.id}
                  phone={p}
                  onCompareToggle={handleCompareToggle}
                  inCompare={comparePhones.some(cp => cp.id === p.id)}
                />
              ))}
            </div>
          ) : (
            /* list view */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
              {phones.map(p => {
                const [imgErr, setImgErr] = useState(false)
                return (
                  <Link key={p.id} href={ROUTES.phone(brandSlug(p.brand), phoneSlug(p))} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
                      background: c.surface, border: `1px solid ${c.border}`,
                      borderRadius: 'var(--r-md)', transition: 'all 0.15s', cursor: 'pointer',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.borderHover; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border;      (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                    >
                      <div style={{ width: 56, height: 56, flexShrink: 0, background: c.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.main_image_url && !imgErr
                          ? <img src={p.main_image_url} alt="" onError={() => setImgErr(true)} style={{ width: 44, height: 44, objectFit: 'contain' }} />
                          : <Smartphone size={24} color={c.border} strokeWidth={1} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: c.text1, marginBottom: 3 }}>{p.model_name}</div>
                        <div style={{ fontSize: 13, color: c.text3 }}>
                          {p.release_year ?? '—'}
                          {p.screen_size    ? ` · ${p.screen_size}"`             : ''}
                          {p.main_camera_mp ? ` · ${p.main_camera_mp}MP`         : ''}
                          {p.battery_capacity ? ` · ${p.battery_capacity.toLocaleString()}mAh` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: c.text1, flexShrink: 0 }}>
                        {p.price_usd ? `$${Math.round(p.price_usd).toLocaleString()}` : '—'}
                      </div>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleCompareToggle(p) }}
                        style={{
                          width: 32, height: 32, borderRadius: 'var(--r-sm)', flexShrink: 0,
                          border: `1px solid ${comparePhones.some(cp => cp.id === p.id) ? 'var(--accent)' : c.border}`,
                          background: comparePhones.some(cp => cp.id === p.id) ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: comparePhones.some(cp => cp.id === p.id) ? 'white' : c.text3,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        title="Add to compare"
                      >
                        <GitCompare size={13} />
                      </button>
                      <ChevronRight size={16} color={c.text3} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePageChange} />
        </div>
      </div>

      <CompareBar
        phones={comparePhones}
        onRemove={id => setComparePhones(prev => prev.filter(p => p.id !== id))}
        onClear={() => setComparePhones([])}
      />

      <style>{`
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        @media (max-width: 1023px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .phone-grid-3 { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .phone-grid-3 { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
      `}</style>
    </div>
  )
}

export default function BrandPage() {
  return (
    <ToastProvider>
      <BrandPageContent />
    </ToastProvider>
  )
}
