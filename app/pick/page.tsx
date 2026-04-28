'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, ArrowLeft, Camera, Battery, Zap, Smartphone,
  Feather, Monitor, Bolt, BadgeDollarSign, Check, X, Star,
  TrendingUp, Clock, ChevronRight, Crosshair, Info,
} from 'lucide-react'
import Navbar from '@/app/components/Navbar'
import CompareBar from '@/app/components/CompareBar'
import { ToastProvider, useToast } from '@/app/components/Toast'
import { api } from '@/lib/api'
import { ROUTES, phoneSlug, brandSlug, MAX_COMPARE } from '@/lib/config'
import { c } from '@/lib/tokens'
import type { Phone } from '@/lib/types'

/* ─── STEP CONFIG ─── */
const STEPS = [
  { num: 1, label: 'Budget' },
  { num: 2, label: 'Priorities' },
  { num: 3, label: 'Results' },
]

/* ─── BUDGET PRESETS ─── */
const BUDGET_PRESETS = [
  { id: 'under-300', label: 'Under $300', sub: 'Budget', min: 0, max: 300, icon: <BadgeDollarSign size={22} strokeWidth={1.5} /> },
  { id: '300-600', label: '$300 – $600', sub: 'Mid-Range', min: 300, max: 600, icon: <BadgeDollarSign size={22} strokeWidth={1.5} /> },
  { id: '600-1000', label: '$600 – $1,000', sub: 'Flagship', min: 600, max: 1000, icon: <BadgeDollarSign size={22} strokeWidth={1.5} /> },
  { id: '1000-plus', label: '$1,000+', sub: "Sky's the limit", min: 1000, max: undefined, icon: <BadgeDollarSign size={22} strokeWidth={1.5} /> },
]

/* ─── PRIORITY OPTIONS ─── */
const PRIORITIES = [
  { id: 'camera', label: 'Camera Quality', desc: 'Great photos & video', icon: <Camera size={24} strokeWidth={1.5} /> },
  { id: 'battery', label: 'Battery Life', desc: 'Last all day and beyond', icon: <Battery size={24} strokeWidth={1.5} /> },
  { id: 'performance', label: 'Performance', desc: 'No lag, fast for anything', icon: <Zap size={24} strokeWidth={1.5} /> },
  { id: 'compact', label: 'Compact Size', desc: 'Easy to use one-handed', icon: <Smartphone size={24} strokeWidth={1.5} /> },
  { id: 'lightweight', label: 'Lightweight', desc: "Doesn't weigh you down", icon: <Feather size={24} strokeWidth={1.5} /> },
  { id: 'display', label: 'Display Quality', desc: 'Sharp, bright, smooth', icon: <Monitor size={24} strokeWidth={1.5} /> },
  { id: 'fast_charging', label: 'Fast Charging', desc: 'Quick top-ups, less waiting', icon: <Bolt size={24} strokeWidth={1.5} /> },
  { id: 'value', label: 'Best Value', desc: 'Most specs per dollar', icon: <BadgeDollarSign size={24} strokeWidth={1.5} /> },
]

/* ─── SCORE COLOR ─── */
function scoreColor(score: number): string {
  if (score >= 9) return 'var(--green)'
  if (score >= 7.5) return 'var(--blue)'
  if (score >= 6) return 'var(--text-2)'
  return 'var(--orange)'
}

/* ─── PROGRESS DOTS ─── */
function ProgressDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
      {STEPS.map(step => (
        <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: step.num <= current ? c.primary : c.border,
              transition: 'all 0.3s ease',
              boxShadow: step.num === current ? '0 0 0 4px rgba(26,26,46,0.08)' : 'none',
            }}
          />
          {step.num < STEPS.length && (
            <div style={{
              width: 40, height: 2,
              background: step.num < current ? c.primary : c.border,
              transition: 'all 0.3s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── STEP 1: BUDGET ─── */
function StepBudget({
  selected,
  onSelect,
  customMin,
  customMax,
  onCustomChange,
}: {
  selected: string | null
  onSelect: (id: string, min?: number, max?: number) => void
  customMin: string
  customMax: string
  onCustomChange: (min: string, max: string) => void
}) {
  const hasSelection = selected || (customMin && customMax)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 40px)',
          color: c.text1, letterSpacing: '-0.5px', marginBottom: 8,
        }}>
          Let's find your perfect phone.
        </h1>
        <p style={{ fontSize: 15, color: c.text3 }}>Step 1 of 3</p>
      </div>

      <p style={{
        textAlign: 'center', fontSize: 18, fontWeight: 500,
        color: c.text1, marginBottom: 28,
      }}>
        What's your budget?
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        {BUDGET_PRESETS.map(preset => {
          const active = selected === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id, preset.min, preset.max)}
              style={{
                background: active ? 'rgba(26,26,46,0.04)' : c.surface,
                border: `2px solid ${active ? c.primary : c.border}`,
                borderRadius: 'var(--r-lg)', padding: '24px 16px',
                cursor: 'pointer', transition: 'all 0.15s ease',
                textAlign: 'center', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.borderColor = c.border
                  ;(e.currentTarget as HTMLElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ color: active ? c.primary : c.text3, marginBottom: 4 }}>
                {preset.icon}
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 18,
                color: c.text1, fontWeight: 500,
              }}>
                {preset.label}
              </div>
              <div style={{ fontSize: 13, color: c.text3 }}>
                {preset.sub}
              </div>
              {active && (
                <div style={{
                  marginTop: 4, width: 24, height: 24, borderRadius: '50%',
                  background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        alignItems: 'center', marginBottom: 32,
      }}>
        <span style={{ fontSize: 14, color: c.text3 }}>Or set a custom range:</span>
        <input
          type="number"
          placeholder="Min"
          value={customMin}
          onChange={e => onCustomChange(e.target.value, customMax)}
          style={{
            width: 100, padding: '10px 14px', border: `1px solid ${c.border}`,
            borderRadius: 'var(--r-sm)', fontSize: 14, color: c.text1,
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = c.primary }}
          onBlur={e => { e.currentTarget.style.borderColor = c.border }}
        />
        <span style={{ color: c.text3 }}>to</span>
        <input
          type="number"
          placeholder="Max"
          value={customMax}
          onChange={e => onCustomChange(customMin, e.target.value)}
          style={{
            width: 100, padding: '10px 14px', border: `1px solid ${c.border}`,
            borderRadius: 'var(--r-sm)', fontSize: 14, color: c.text1,
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = c.primary }}
          onBlur={e => { e.currentTarget.style.borderColor = c.border }}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ─── STEP 2: PRIORITIES ─── */
function StepPriorities({
  selected,
  onToggle,
}: {
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const count = selected.size
  const canProceed = count >= 2
  const isMax = count >= 3

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 40px)',
          color: c.text1, letterSpacing: '-0.5px', marginBottom: 8,
        }}>
          What matters most to you?
        </h1>
        <p style={{ fontSize: 15, color: c.text3 }}>
          Pick 2 or 3. <span style={{ color: c.text2 }}>Step 2 of 3</span>
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        {PRIORITIES.map(p => {
          const active = selected.has(p.id)
          const dimmed = isMax && !active
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              disabled={dimmed}
              style={{
                background: active ? 'rgba(26,26,46,0.04)' : c.surface,
                border: `2px solid ${active ? c.primary : c.border}`,
                borderRadius: 'var(--r-lg)', padding: '22px 18px',
                cursor: dimmed ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 8,
                opacity: dimmed ? 0.5 : 1,
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active && !dimmed) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
                }
              }}
              onMouseLeave={e => {
                if (!active && !dimmed) {
                  (e.currentTarget as HTMLElement).style.borderColor = c.border
                  ;(e.currentTarget as HTMLElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 22, height: 22, borderRadius: '50%',
                  background: c.primary, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={13} color="#fff" strokeWidth={3} />
                </div>
              )}
              <div style={{ color: active ? c.primary : c.text3 }}>
                {p.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontSize: 17,
                  color: c.text1, fontWeight: 500, marginBottom: 2,
                }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 13, color: c.text3, lineHeight: 1.4 }}>
                  {p.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{
        background: c.bg, padding: '14px 18px', borderRadius: 'var(--r-md)',
        textAlign: 'center', fontSize: 14, color: c.text2,
        marginBottom: 24, minHeight: 48, display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        {count === 0 ? (
          <span>Select at least 2 priorities</span>
        ) : count < 2 ? (
          <span>Select {2 - count} more priority{2 - count > 1 ? 'ies' : 'y'}</span>
        ) : (
          <>
            <Check size={14} color="var(--green)" strokeWidth={2.5} />
            <span>
              Selected: <strong style={{ color: c.text1 }}>
                {Array.from(selected).map(id => PRIORITIES.find(p => p.id === id)?.label).join(', ')}
              </strong> ({count} selected)
            </span>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── STEP 3: RESULT CARD ─── */
function ResultCard({
  phone,
  rank,
  score,
  isBest,
  onCompare,
  isCompared,
}: {
  phone: Phone & { match_score?: number }
  rank: number
  score: number
  isBest: boolean
  onCompare: (p: Phone) => void
  isCompared: boolean
}) {
  const router = useRouter()
  const color = scoreColor(score)

  const whyPoints = [
    phone.main_camera_mp && phone.main_camera_mp >= 48
      ? `Best-in-class ${phone.main_camera_mp}MP camera system with advanced computational photography.`
      : null,
    phone.battery_capacity && phone.battery_capacity >= 4500
      ? `${phone.battery_capacity.toLocaleString()}mAh battery — above average for this price bracket.`
      : null,
    phone.chipset_tier === 'flagship'
      ? `Flagship ${phone.chipset || 'chipset'} delivers top-tier performance for any task.`
      : `Reliable ${phone.chipset_tier || 'mid-range'} performance for everyday use.`,
    phone.fast_charging_w && phone.fast_charging_w >= 30
      ? `${phone.fast_charging_w}W fast charging gets you from 0-50% in under 20 minutes.`
      : null,
  ].filter(Boolean).slice(0, 3)

  const tradeOff = phone.weight_g && phone.weight_g > 200
    ? `Heavy at ${phone.weight_g}g — one of the heavier options in this range.`
    : phone.screen_size && phone.screen_size < 6.0
      ? `Compact ${phone.screen_size}" screen may feel small for media consumption.`
      : phone.price_usd && phone.price_usd > 800
        ? `Premium pricing at $${phone.price_usd.toLocaleString()} — excellent hardware, but value seekers should check alternatives.`
        : `No major trade-offs at this price point — a well-balanced choice.`

  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r-lg)', padding: '24px 28px',
      marginBottom: 16, position: 'relative',
      borderLeft: isBest ? '3px solid var(--accent)' : undefined,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.borderColor = c.border
      }}
    >
      {isBest && (
        <div style={{
          position: 'absolute', top: -12, left: 28,
          background: 'var(--accent)', color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 'var(--r-full)', letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Best Match
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, background: c.bg,
            borderRadius: 'var(--r-md)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {phone.main_image_url ? (
              <img
                src={phone.main_image_url}
                alt={phone.model_name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Smartphone size={28} color={c.border} strokeWidth={1} />
            )}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: isBest ? 24 : 20,
              color: c.text1, letterSpacing: '-0.3px',
            }}>
              {isBest ? phone.model_name : `#${rank} ${phone.model_name}`}
            </div>
            <div style={{ fontSize: 13, color: c.text3, marginTop: 2 }}>
              {phone.brand} · {phone.chipset_tier || 'Mid-range'} · {phone.release_year}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', background: `${color}10`,
          borderRadius: 'var(--r-md)', border: `1px solid ${color}25`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color }}>
            {isBest ? `Score: ${score.toFixed(1)}/10 match` : `Score: ${score.toFixed(1)}/10`}
          </span>
        </div>
      </div>

      {isBest ? (
        <>
          <div style={{ marginBottom: 14, paddingLeft: 4 }}>
            {whyPoints.map((pt, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginBottom: 8, fontSize: 14, color: c.text2, lineHeight: 1.5,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--green)', flexShrink: 0, marginTop: 7,
                }} />
                <span dangerouslySetInnerHTML={{ __html: pt }} />
              </div>
            ))}
          </div>

          <div style={{
            fontSize: 13, color: 'var(--orange)', fontStyle: 'italic',
            marginBottom: 18, background: 'rgba(231,111,81,0.06)',
            padding: '10px 14px', borderRadius: 'var(--r-sm)',
            display: 'inline-flex', alignItems: 'flex-start', gap: 8,
          }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Trade-off:</strong> {tradeOff}</span>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.6, marginBottom: 14 }}>
          {tradeOff}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push(ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone)))}
          style={{
            padding: '9px 18px', background: c.primary, color: '#fff',
            borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2A2A42' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.primary }}
        >
          View Details <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} />
        </button>
        <button
          onClick={() => onCompare(phone)}
          style={{
            padding: '9px 18px', border: `1px solid ${c.border}`,
            color: c.text2, borderRadius: 'var(--r-full)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            background: 'transparent', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.color = c.text1 }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.text2 }}
        >
          {isCompared ? '✓ In Compare' : '+ Compare'}
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: c.text1 }}>
          {phone.price_usd ? `$${phone.price_usd.toLocaleString()}` : 'Price TBA'}
        </span>
      </div>
    </div>
  )
}

/* ─── STEP 3: RESULTS ─── */
function StepResults({
  phones,
  priorities,
  budgetLabel,
  onCompare,
  compareIds,
}: {
  phones: (Phone & { match_score?: number })[]
  priorities: string[]
  budgetLabel: string
  onCompare: (p: Phone) => void
  compareIds: number[]
}) {
  const router = useRouter()
  const priorityLabels = priorities.map(id => PRIORITIES.find(p => p.id === id)?.label || id)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 40px)',
          color: c.text1, letterSpacing: '-0.5px', marginBottom: 8,
        }}>
          Your top picks
        </h1>
        <p style={{ fontSize: 15, color: c.text3 }}>Step 3 of 3</p>
      </div>

      <div style={{
        background: c.bg, padding: '14px 18px', borderRadius: 'var(--r-md)',
        textAlign: 'center', fontSize: 14, color: c.text2,
        marginBottom: 32,
      }}>
        Based on: <strong style={{ color: c.text1 }}>{budgetLabel}</strong> budget ·{' '}
        {priorityLabels.join(' · ')}
      </div>

      {phones.map((phone, i) => (
        <ResultCard
          key={phone.id}
          phone={phone}
          rank={i + 1}
          score={phone.match_score || phone.value_score || 7.5}
          isBest={i === 0}
          onCompare={onCompare}
          isCompared={compareIds.includes(phone.id)}
        />
      ))}

      {phones.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Crosshair size={48} color={c.border} strokeWidth={1} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: c.text1, marginBottom: 8 }}>
            No matches found
          </h3>
          <p style={{ fontSize: 14, color: c.text3 }}>
            Try adjusting your budget or selecting different priorities.
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── FOOTER ─── */
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

/* ─── MAIN PAGE CONTENT ─── */
function PickPageContent() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [customMin, setCustomMin] = useState('')
  const [customMax, setCustomMax] = useState('')
  const [priorities, setPriorities] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<(Phone & { match_score?: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [comparePhones, setComparePhones] = useState<Phone[]>([])

  const handleBudgetSelect = (id: string, min?: number, max?: number) => {
    setBudgetId(id)
    setCustomMin('')
    setCustomMax('')
  }

  const handleCustomChange = (min: string, max: string) => {
    setCustomMin(min)
    setCustomMax(max)
    setBudgetId(null)
  }

  const handlePriorityToggle = (id: string) => {
    setPriorities(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }

  const fetchResults = useCallback(async () => {
    let minPrice: number | undefined
    let maxPrice: number | undefined

    if (budgetId) {
      const preset = BUDGET_PRESETS.find(p => p.id === budgetId)
      if (preset) {
        minPrice = preset.min
        maxPrice = preset.max
      }
    } else if (customMin && customMax) {
      minPrice = Number(customMin)
      maxPrice = Number(customMax)
    }

    const priorityList = Array.from(priorities)
    if (priorityList.length === 0) return

    setLoading(true)
    try {
      const data = await api.phones.recommend({
        min_price: minPrice,
        max_price: maxPrice,
        priorities: priorityList.join(','),
        limit: 5,
      })
      setResults(data.phones as (Phone & { match_score?: number })[])
    } catch {
      setResults([])
      toast('Failed to load recommendations', 'error')
    } finally {
      setLoading(false)
    }
  }, [budgetId, customMin, customMax, priorities, toast])

  const goNext = () => {
    if (step === 2) {
      fetchResults()
    }
    setStep(s => Math.min(s + 1, 3))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompare = (phone: Phone) => {
    setComparePhones(prev => {
      if (prev.find(p => p.id === phone.id)) {
        toast('Removed from compare', 'info')
        return prev.filter(p => p.id !== phone.id)
      }
      if (prev.length >= MAX_COMPARE) {
        toast(`Maximum ${MAX_COMPARE} phones in compare`, 'error')
        return prev
      }
      toast('Added to compare', 'success')
      return [...prev, phone]
    })
  }

  const compareIds = comparePhones.map(p => p.id)

  const budgetLabel = budgetId
    ? BUDGET_PRESETS.find(p => p.id === budgetId)?.label || 'Custom'
    : customMin && customMax
      ? `$${customMin} – $${customMax}`
      : 'Any'

  const canProceedStep1 = budgetId || (customMin && customMax)
  const canProceedStep2 = priorities.size >= 2

  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <Navbar
        compareCount={comparePhones.length}
        onOpenCompare={() => comparePhones.length >= 2 && router.push(ROUTES.compare(...comparePhones.map(p => phoneSlug(p))))}
      />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - 200px)' }}>
        <ProgressDots current={step} />

        {step === 1 && (
          <StepBudget
            selected={budgetId}
            onSelect={handleBudgetSelect}
            customMin={customMin}
            customMax={customMax}
            onCustomChange={handleCustomChange}
          />
        )}

        {step === 2 && (
          <StepPriorities
            selected={priorities}
            onToggle={handlePriorityToggle}
          />
        )}

        {step === 3 && (
          <StepResults
            phones={results}
            priorities={Array.from(priorities)}
            budgetLabel={budgetLabel}
            onCompare={handleCompare}
            compareIds={compareIds}
          />
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 32,
          flexDirection: step === 1 ? 'row-reverse' : 'row',
        }}>
          {step > 1 && step < 3 && (
            <button
              onClick={goBack}
              style={{
                padding: '12px 24px', borderRadius: 'var(--r-md)',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
                border: `1px solid ${c.border}`, background: 'transparent',
                color: c.text2, transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.text2 }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {step === 3 && (
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '12px 24px', borderRadius: 'var(--r-md)',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
                border: `1px solid ${c.border}`, background: 'transparent',
                color: c.text2, transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.text2 }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border }}
            >
              <ArrowLeft size={16} /> Change Priorities
            </button>
          )}

          {step < 3 && (
            <button
              onClick={goNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              style={{
                padding: '12px 28px', borderRadius: 'var(--r-md)',
                fontWeight: 600, fontSize: 14, cursor: (step === 1 ? canProceedStep1 : canProceedStep2) ? 'pointer' : 'not-allowed',
                border: 'none', background: (step === 1 ? canProceedStep1 : canProceedStep2) ? c.primary : '#D0D0CC',
                color: '#fff', transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => {
                if (step === 1 ? canProceedStep1 : canProceedStep2) {
                  (e.currentTarget as HTMLElement).style.background = '#2A2A42'
                }
              }}
              onMouseLeave={e => {
                if (step === 1 ? canProceedStep1 : canProceedStep2) {
                  (e.currentTarget as HTMLElement).style.background = c.primary
                }
              }}
            >
              {step === 1 ? 'Next' : 'Show me results'}
              <ArrowRight size={16} />
            </button>
          )}

          {step === 3 && (
            <Link
              href={ROUTES.home}
              style={{
                padding: '12px 24px', borderRadius: 'var(--r-md)',
                fontWeight: 500, fontSize: 14,
                border: `1px solid ${c.border}`, background: 'transparent',
                color: c.text2, transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                textDecoration: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.text2 }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border }}
            >
              Browse all phones <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 36, height: 36, border: `3px solid ${c.border}`,
              borderTopColor: c.primary, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ fontSize: 14, color: c.text3 }}>Finding your perfect phone...</p>
          </div>
        )}
      </main>

      <Footer />

      <CompareBar
        phones={comparePhones}
        onRemove={id => setComparePhones(prev => prev.filter(p => p.id !== id))}
        onClear={() => setComparePhones([])}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ─── EXPORT WITH SUSPENSE ─── */
export default function PickPage() {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <PickPageContent />
      </Suspense>
    </ToastProvider>
  )
}
