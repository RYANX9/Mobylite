'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Share2, GitCompare, ShoppingCart,
  ExternalLink, Check, ChevronDown, Camera, Battery, Cpu, Monitor,
  Weight, Zap, Wifi, Bluetooth, Shield, Star, ArrowRight, Smartphone
} from 'lucide-react'
import { api } from '@/lib/api'
import { ROUTES, brandSlug, phoneSlug, valueScoreColor } from '@/lib/config'
import { c, f } from '@/lib/tokens'
import type { Phone } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhoneDetailPageProps {
  phone: Phone
  similar: Phone[]
  compareIds: number[]
  onCompareToggle: (phone: Phone) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSpecGroups(phone: Phone) {
  const specs = phone.full_specifications?.specifications || {}
  return Object.entries(specs)
}

function getQuickSpecs(phone: Phone) {
  const q = phone.full_specifications?.quick_specs || {}
  return q
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 500,
        color: active ? c.text1 : c.text3,
        borderBottom: `2px solid ${active ? c.accent : 'transparent'}`,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function SpecGroupRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '10px 0',
        borderBottom: `1px solid ${c.border}`,
        gap: 16,
      }}
    >
      <div style={{ width: 180, flexShrink: 0, fontSize: 13, color: c.text3, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: c.text1, lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  )
}

function SpecGroup({ title, specs }: { title: string; specs: Record<string, string> }) {
  const [open, setOpen] = useState(true)
  const entries = Object.entries(specs)
  if (!entries.length) return null

  const EMOJI_MAP: Record<string, string> = {
    'Display': '🖥️', 'Camera': '📷', 'Performance': '🚀',
    'Battery': '🔋', 'Network': '📡', 'Launch': '📅',
    'Body': '🏗️', 'Sound': '🔊', 'Memory': '💾',
    'Connectivity': '📡', 'Features': '✨', 'Tests': '🧪',
  }
  const emoji = EMOJI_MAP[title] || '📋'

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 20px',
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: open ? 'var(--r-md) var(--r-md) 0 0' : 'var(--r-md)',
          textAlign: 'left',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text1 }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: c.text3 }}>{entries.length} specs</span>
        <ChevronDown
          size={14}
          color={c.text3}
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderTop: 'none',
            borderRadius: '0 0 var(--r-md) var(--r-md)',
            padding: '0 20px 12px',
          }}
        >
          {entries.map(([k, v]) => (
            <SpecGroupRow key={k} label={k} value={v} />
          ))}
        </div>
      )}
    </div>
  )
}

function QuickSpecCard({ icon, value, label, highlight }: {
  icon: React.ReactNode; value: string; label: string; highlight?: boolean
}) {
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${highlight ? c.accent : c.border}`,
        borderRadius: 'var(--r-md)',
        padding: '16px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div style={{ color: c.text3, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        {icon}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: c.text1, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {label}
      </div>
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
        flexShrink: 0,
        width: 180,
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--r-md)',
        padding: 14,
        textAlign: 'center',
        transition: 'all 0.15s',
        scrollSnapAlign: 'start',
        display: 'block',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'none'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.borderColor = c.border
      }}
    >
      <div style={{ width: 90, height: 90, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phone.main_image_url && !imgErr ? (
          <img src={phone.main_image_url} alt={phone.model_name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <Smartphone size={40} color={c.border} strokeWidth={1} />
        )}
      </div>
      <div style={{ fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{phone.brand}</div>
      <div style={{ fontFamily: f.serif, fontSize: 13, color: c.text1, lineHeight: 1.3, marginBottom: 4 }}>{phone.model_name}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>
        {phone.price_usd ? `$${phone.price_usd.toLocaleString()}` : '—'}
      </div>
    </Link>
  )
}

// ─── Overview Tab Content ─────────────────────────────────────────────────────

function OverviewTab({ phone }: { phone: Phone }) {
  const sections = [
    {
      emoji: '🖥️',
      title: 'Display',
      headline: phone.screen_size ? `${phone.screen_size}" Screen` : 'Display',
      specs: [
        phone.screen_size && { label: 'Screen Size', value: `${phone.screen_size}"` },
        phone.screen_resolution && { label: 'Resolution', value: phone.screen_resolution },
        phone.full_specifications?.quick_specs?.displaytype && { label: 'Type', value: phone.full_specifications.quick_specs.displaytype },
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      emoji: '📷',
      title: 'Camera',
      headline: phone.main_camera_mp ? `${phone.main_camera_mp}MP Main Camera` : 'Camera System',
      specs: [
        phone.main_camera_mp && { label: 'Main Camera', value: `${phone.main_camera_mp} MP` },
        phone.full_specifications?.quick_specs?.cam1modules && { label: 'Rear Cameras', value: phone.full_specifications.quick_specs.cam1modules },
        phone.full_specifications?.quick_specs?.cam2modules && { label: 'Front Camera', value: phone.full_specifications.quick_specs.cam2modules },
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      emoji: '🚀',
      title: 'Performance',
      headline: phone.chipset || 'Processor',
      specs: [
        phone.chipset && { label: 'Chipset', value: phone.chipset },
        phone.ram_options?.length && { label: 'RAM Options', value: phone.ram_options.map(r => `${r}GB`).join(' / ') },
        phone.storage_options?.length && { label: 'Storage', value: phone.storage_options.map(s => `${s}GB`).join(' / ') },
        phone.antutu_score && { label: 'AnTuTu Score', value: phone.antutu_score.toLocaleString() },
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      emoji: '🔋',
      title: 'Battery & Charging',
      headline: phone.battery_capacity ? `${phone.battery_capacity.toLocaleString()} mAh` : 'Battery',
      specs: [
        phone.battery_capacity && { label: 'Capacity', value: `${phone.battery_capacity.toLocaleString()} mAh` },
        phone.fast_charging_w && { label: 'Fast Charging', value: `${phone.fast_charging_w}W` },
      ].filter(Boolean) as { label: string; value: string }[],
    },
    {
      emoji: '🏗️',
      title: 'Design & Build',
      headline: phone.weight_g ? `${phone.weight_g}g` : 'Build',
      specs: [
        phone.weight_g && { label: 'Weight', value: `${phone.weight_g}g` },
        phone.thickness_mm && { label: 'Thickness', value: `${phone.thickness_mm}mm` },
      ].filter(Boolean) as { label: string; value: string }[],
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map(s => s.specs.length > 0 && (
        <div
          key={s.title}
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 'var(--r-md)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>{s.emoji}</span>
            <span style={{ fontFamily: f.serif, fontSize: 20, color: c.text1 }}>{s.title}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, color: c.text1, marginBottom: 12 }}>
            {s.headline}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {s.specs.map(spec => (
              <div key={spec.label} style={{ padding: '8px 12px', background: c.bg, borderRadius: 'var(--r-sm)' }}>
                <div style={{ fontSize: 11, color: c.text3, marginBottom: 2 }}>{spec.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhoneDetailPage({ phone, similar, compareIds, onCompareToggle }: PhoneDetailPageProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'specs' | 'compare'>('overview')
  const [imgErr, setImgErr] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inCompare = compareIds.includes(phone.id)

  const specGroups = getSpecGroups(phone)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const valueScore = (phone as any).value_score

  const quickSpecs = [
    phone.screen_size && { icon: <Monitor size={20} strokeWidth={1.5} />, value: `${phone.screen_size}"`, label: 'Display' },
    phone.main_camera_mp && { icon: <Camera size={20} strokeWidth={1.5} />, value: `${phone.main_camera_mp}MP`, label: 'Camera' },
    phone.battery_capacity && { icon: <Battery size={20} strokeWidth={1.5} />, value: `${phone.battery_capacity.toLocaleString()}`, label: 'mAh Battery' },
    phone.ram_options?.length && { icon: <Cpu size={20} strokeWidth={1.5} />, value: `${Math.max(...(phone.ram_options || [0]))}GB`, label: 'Max RAM' },
    phone.fast_charging_w && { icon: <Zap size={20} strokeWidth={1.5} />, value: `${phone.fast_charging_w}W`, label: 'Charging' },
    phone.weight_g && { icon: <Weight size={20} strokeWidth={1.5} />, value: `${phone.weight_g}g`, label: 'Weight' },
  ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[]

  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 var(--page-px)' }}>

        {/* Breadcrumb */}
        <nav style={{ padding: '16px 0', fontSize: 13, color: c.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href={ROUTES.home} style={{ color: c.text2 }}>Home</Link>
          <ChevronRight size={12} />
          <Link href={ROUTES.brand(brandSlug(phone.brand))} style={{ color: c.text2 }}>
            {phone.brand}
          </Link>
          <ChevronRight size={12} />
          <span>{phone.model_name}</span>
        </nav>

        {/* Hero Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            paddingBottom: 48,
            alignItems: 'start',
          }}
          className="phone-hero-grid"
        >
          {/* Image Panel */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 'var(--r-xl)',
              padding: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1',
              position: 'relative',
            }}
          >
            {phone.main_image_url && !imgErr ? (
              <img
                src={phone.main_image_url}
                alt={phone.model_name}
                onError={() => setImgErr(true)}
                style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }}
              />
            ) : (
              <Smartphone size={120} color={c.border} strokeWidth={0.8} />
            )}

            {/* Release year badge */}
            {phone.release_year && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 'var(--r-full)',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.text3,
                }}
              >
                {phone.release_year}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3, marginBottom: 4 }}>
              {phone.brand}
            </div>

            <h1 style={{ fontFamily: f.serif, fontSize: 40, color: c.text1, letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 8 }}>
              {phone.model_name}
            </h1>

            <div style={{ fontSize: 28, fontWeight: 600, color: c.text1, marginBottom: 4 }}>
              {phone.price_usd ? `$${phone.price_usd.toLocaleString()}` : 'Price TBA'}
            </div>
            {phone.price_usd && (
              <div style={{ fontSize: 13, color: c.text3, marginBottom: 20 }}>Starting price · US</div>
            )}

            {/* Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <span style={{ padding: '5px 12px', background: 'var(--green-light)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600 }}>
                ✓ Available
              </span>
              {(phone as any).chipset_tier === 'flagship' && (
                <span style={{ padding: '5px 12px', background: 'var(--accent-light)', color: c.accent, border: '1px solid var(--accent-border)', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600 }}>
                  Flagship
                </span>
              )}
              {phone.release_year && (
                <span style={{ padding: '5px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 500, color: c.text2 }}>
                  {phone.release_year}
                </span>
              )}
            </div>

            {/* Value Score */}
            {valueScore != null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px',
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 'var(--r-md)',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: valueScoreColor(valueScore),
                  }}
                >
                  {valueScore.toFixed(1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text2, marginBottom: 4 }}>Value Score</div>
                  <div style={{ height: 6, background: c.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${valueScore * 10}%`,
                        background: valueScoreColor(valueScore),
                        borderRadius: 3,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: c.text3 }}>Specs per dollar</div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <button
                onClick={() => onCompareToggle(phone)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: inCompare ? '#fff' : c.primary,
                  background: inCompare ? c.primary : 'transparent',
                  border: `1px solid ${c.primary}`,
                  borderRadius: 'var(--r-full)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
              >
                <GitCompare size={16} strokeWidth={2} />
                {inCompare ? '✓ In Compare' : 'Add to Compare'}
              </button>

              <button
                onClick={() => router.push(ROUTES.compare(...compareIds.map(id => String(id)), phoneSlug(phone)))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.accent,
                  background: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--r-full)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
              >
                Compare with…
              </button>

              {phone.amazon_link && (
                <a
                  href={phone.amazon_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 22px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    background: c.primary,
                    borderRadius: 'var(--r-full)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2A2A42' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.primary }}
                >
                  <ShoppingCart size={16} strokeWidth={2} />
                  Buy on Amazon
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: copied ? 'var(--green)' : c.text3,
                transition: 'color 0.15s',
              }}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Link copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Quick Specs Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(quickSpecs.length, 6)}, 1fr)`,
            gap: 12,
            marginBottom: 48,
          }}
          className="quick-specs-grid"
        >
          {quickSpecs.map((spec, i) => (
            <QuickSpecCard key={i} {...spec} />
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            position: 'sticky',
            top: 'var(--nav-h)',
            zIndex: 50,
            background: 'rgba(248,248,245,0.92)',
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${c.border}`,
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', gap: 0 }}>
            <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
            <TabButton active={tab === 'specs'} onClick={() => setTab('specs')}>Full Specs</TabButton>
            <TabButton active={tab === 'compare'} onClick={() => setTab('compare')}>Compare</TabButton>
          </div>
        </div>

        {/* Tab Content */}
        {tab === 'overview' && <OverviewTab phone={phone} />}

        {tab === 'specs' && (
          <div style={{ marginBottom: 48 }}>
            {specGroups.length > 0 ? (
              specGroups.map(([groupName, groupSpecs]) => (
                <SpecGroup key={groupName} title={groupName} specs={groupSpecs as Record<string, string>} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: c.text3 }}>
                Detailed specifications not available for this model.
              </div>
            )}
          </div>
        )}

        {tab === 'compare' && (
          <div style={{ maxWidth: 600, marginBottom: 48 }}>
            <div style={{ fontFamily: f.serif, fontSize: 24, color: c.text1, marginBottom: 8 }}>
              Compare {phone.model_name.split(' ').slice(-2).join(' ')} with…
            </div>
            <p style={{ fontSize: 14, color: c.text3, marginBottom: 24 }}>
              Select a phone to see a full side-by-side spec comparison.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {similar.slice(0, 5).map(p => (
                <Link
                  key={p.id}
                  href={ROUTES.compare(phoneSlug(phone), phoneSlug(p))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    borderRadius: 'var(--r-md)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    ) : (
                      <Smartphone size={20} color={c.border} strokeWidth={1} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: c.text1 }}>{p.model_name}</div>
                    <div style={{ fontSize: 12, color: c.text3 }}>
                      {p.price_usd ? `$${p.price_usd.toLocaleString()}` : '—'} · {p.battery_capacity ? `${p.battery_capacity.toLocaleString()} mAh` : ''} {p.main_camera_mp ? `· ${p.main_camera_mp}MP` : ''}
                    </div>
                  </div>
                  <ArrowRight size={16} color={c.text3} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Similar Phones */}
        {similar.length > 0 && (
          <section style={{ marginTop: 64, marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: f.serif, fontSize: 28, color: c.text1 }}>Similar Phones</h2>
              <span style={{ fontSize: 14, color: c.text3 }}>Based on price & specs</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                ref={scrollRef}
                className="scrollbar-none"
                style={{
                  display: 'flex',
                  gap: 16,
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  paddingBottom: 4,
                }}
              >
                {similar.map(p => <SimilarCard key={p.id} phone={p} />)}
              </div>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(-90deg, var(--bg) 0%, transparent 100%)', pointerEvents: 'none' }} />
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .phone-hero-grid { grid-template-columns: 1fr !important; }
          .quick-specs-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .quick-specs-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
