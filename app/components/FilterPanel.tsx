'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { c } from '@/lib/tokens'
import type { SearchFilters, FilterStats } from '@/lib/types'

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onReset: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function CheckItem({
  label, count, checked, onChange,
}: { label: string; count?: number; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 8px',
        borderRadius: 'var(--r-sm)',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.bg }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `1.5px solid ${checked ? c.primary : c.border}`,
          background: checked ? c.primary : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.12s',
        }}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: c.text1, flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, color: c.text3 }}>{count}</span>
      )}
    </label>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        background: on ? c.primary : c.border,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.18s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'transform 0.18s',
          transform: on ? 'translateX(16px)' : 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  )
}

function RangeSelect({
  label, value, options, onChange,
}: {
  label: string
  value: string | number | undefined
  options: { label: string; value: string | number }[]
  onChange: (v: string | number | undefined) => void
}) {
  return (
    <div style={{ marginBottom: 0 }}>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 'var(--r-sm)',
          border: `1px solid ${c.border}`,
          background: c.surface,
          fontSize: 13,
          color: c.text1,
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A9A9A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: 30,
        }}
      >
        <option value="">Any</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

const SECTION_DIVIDER = <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

export default function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const [mode, setMode] = useState<'simple' | 'expert'>('simple')
  const [stats, setStats] = useState<FilterStats | null>(null)
  const [brandsExpanded, setBrandsExpanded] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    filters.brand ? [filters.brand] : []
  )

  useEffect(() => {
    api.filters.stats().then(setStats).catch(() => {})
  }, [])

  const set = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch })

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand]
    setSelectedBrands(next)
    // For single brand, pass it directly; multi-brand requires API support
    set({ brand: next.length === 1 ? next[0] : undefined })
  }

  const visibleBrands = stats
    ? (brandsExpanded ? stats.brands : stats.brands.slice(0, 8))
    : []

  return (
    <div
      style={{
        position: 'sticky',
        top: 'calc(var(--nav-h) + 16px)',
        maxHeight: 'calc(100vh - var(--nav-h) - 32px)',
        overflowY: 'auto',
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--r-xl)',
        padding: 20,
        scrollbarWidth: 'thin',
        scrollbarColor: `${c.border} transparent`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: c.text1 }}>Filters</span>
        <button
          onClick={onReset}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.text3, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.accent }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.text3 }}
        >
          <RotateCcw size={12} />
          Reset all
        </button>
      </div>

      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          background: c.bg,
          borderRadius: 'var(--r-sm)',
          padding: 3,
          marginBottom: 20,
        }}
      >
        {(['simple', 'expert'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '7px 0',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 5,
              color: mode === m ? '#fff' : c.text3,
              background: mode === m ? c.primary : 'transparent',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Price range */}
      <div>
        <SectionTitle>Price Range</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <input
            type="number"
            placeholder="Min $"
            value={filters.min_price ?? ''}
            onChange={e => set({ min_price: e.target.value ? Number(e.target.value) : undefined })}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--r-sm)',
              border: `1px solid ${c.border}`,
              fontSize: 13,
              color: c.text1,
              background: c.surface,
              width: '100%',
            }}
          />
          <input
            type="number"
            placeholder="Max $"
            value={filters.max_price ?? ''}
            onChange={e => set({ max_price: e.target.value ? Number(e.target.value) : undefined })}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--r-sm)',
              border: `1px solid ${c.border}`,
              fontSize: 13,
              color: c.text1,
              background: c.surface,
              width: '100%',
            }}
          />
        </div>
      </div>

      {SECTION_DIVIDER}

      {/* Brand */}
      <div>
        <SectionTitle>Brand</SectionTitle>
        {visibleBrands.map(b => (
          <CheckItem
            key={b.brand}
            label={b.brand}
            count={b.count}
            checked={selectedBrands.includes(b.brand)}
            onChange={() => toggleBrand(b.brand)}
          />
        ))}
        {stats && stats.brands.length > 8 && (
          <button
            onClick={() => setBrandsExpanded(e => !e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
              color: c.text3,
              padding: '6px 8px',
              marginTop: 2,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.text2 }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.text3 }}
          >
            {brandsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {brandsExpanded ? 'Show less' : `Show ${stats.brands.length - 8} more`}
          </button>
        )}
      </div>

      {SECTION_DIVIDER}

      {/* Release Year */}
      <div>
        <SectionTitle>Release Year</SectionTitle>
        <RangeSelect
          label="From year"
          value={filters.min_year}
          options={[2025, 2024, 2023, 2022, 2021, 2020].map(y => ({ label: String(y), value: y }))}
          onChange={v => set({ min_year: v ? Number(v) : undefined })}
        />
      </div>

      {SECTION_DIVIDER}

      {/* RAM */}
      <div>
        <SectionTitle>Min RAM</SectionTitle>
        <RangeSelect
          label="RAM"
          value={filters.min_ram}
          options={[4, 6, 8, 12, 16].map(r => ({ label: `${r} GB`, value: r }))}
          onChange={v => set({ min_ram: v ? Number(v) : undefined })}
        />
      </div>

      {SECTION_DIVIDER}

      {/* Battery */}
      <div>
        <SectionTitle>Min Battery</SectionTitle>
        <RangeSelect
          label="Battery"
          value={filters.min_battery}
          options={[3000, 4000, 4500, 5000, 6000].map(b => ({ label: `${b.toLocaleString()} mAh`, value: b }))}
          onChange={v => set({ min_battery: v ? Number(v) : undefined })}
        />
      </div>

      {SECTION_DIVIDER}

      {/* Camera MP */}
      <div>
        <SectionTitle>Main Camera</SectionTitle>
        <RangeSelect
          label="Camera"
          value={filters.min_camera_mp}
          options={[12, 48, 50, 64, 108, 200].map(m => ({ label: `${m}+ MP`, value: m }))}
          onChange={v => set({ min_camera_mp: v ? Number(v) : undefined })}
        />
      </div>

      {/* Expert-only filters */}
      {mode === 'expert' && (
        <>
          {SECTION_DIVIDER}

          <div>
            <SectionTitle>
              Screen Size
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: c.accent, background: 'var(--accent-light)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                Expert
              </span>
            </SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input
                type="number"
                placeholder='Min "'
                step="0.1"
                value={filters.min_screen_size ?? ''}
                onChange={e => set({ min_screen_size: e.target.value ? Number(e.target.value) : undefined })}
                style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', border: `1px solid ${c.border}`, fontSize: 13, color: c.text1, background: c.surface, width: '100%' }}
              />
              <input
                type="number"
                placeholder='Max "'
                step="0.1"
                value={filters.max_screen_size ?? ''}
                onChange={e => set({ max_screen_size: e.target.value ? Number(e.target.value) : undefined })}
                style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', border: `1px solid ${c.border}`, fontSize: 13, color: c.text1, background: c.surface, width: '100%' }}
              />
            </div>
          </div>

          {SECTION_DIVIDER}

          <div>
            <SectionTitle>
              Chipset Tier
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: c.accent, background: 'var(--accent-light)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                Expert
              </span>
            </SectionTitle>
            {(['flagship', 'mid', 'entry'] as const).map(tier => (
              <CheckItem
                key={tier}
                label={tier === 'flagship' ? 'Flagship (SD 8 Gen, Dimensity 9xxx, A-series)' : tier === 'mid' ? 'Upper Mid (SD 7xxx, Dimensity 8xxx)' : 'Entry / Budget'}
                checked={filters.chipset_tier === tier}
                onChange={checked => set({ chipset_tier: checked ? tier : undefined })}
              />
            ))}
          </div>

          {SECTION_DIVIDER}

          <div>
            <SectionTitle>
              Fast Charging
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: c.accent, background: 'var(--accent-light)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                Expert
              </span>
            </SectionTitle>
            <RangeSelect
              label="Charging"
              value={filters.min_charging_w}
              options={[18, 33, 45, 65, 100, 120].map(w => ({ label: `${w}W+`, value: w }))}
              onChange={v => set({ min_charging_w: v ? Number(v) : undefined })}
            />
          </div>

          {SECTION_DIVIDER}

          <div>
            <SectionTitle>
              Max Weight
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: c.accent, background: 'var(--accent-light)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                Expert
              </span>
            </SectionTitle>
            <RangeSelect
              label="Weight"
              value={filters.max_weight}
              options={[160, 170, 180, 190, 200, 220].map(w => ({ label: `Under ${w}g`, value: w }))}
              onChange={v => set({ max_weight: v ? Number(v) : undefined })}
            />
          </div>
        </>
      )}
    </div>
  )
}
