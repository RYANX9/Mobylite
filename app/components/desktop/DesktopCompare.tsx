'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Search, GitCompare, Share2, Check, RefreshCw, Smartphone, Trophy } from 'lucide-react'
import { Phone } from '@/lib/types'
import { CleanSpec, extractCleanSpecs } from '@/lib/cleanSpecExtractor'
import { API_BASE_URL, APP_ROUTES } from '@/lib/config'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback'
import { Tooltip } from '@/app/components/shared/Tooltip'
import { UserMenu } from '@/app/components/shared/UserMenu'
import { AddPhoneModal } from '@/app/components/shared/AddPhoneModal'
import { color, font } from '@/lib/tokens'
import { createPhoneSlug } from '@/lib/config'

interface DesktopCompareProps {
  phones: Phone[]
  onPhonesChange: (phones: Phone[]) => void
  setComparePhones?: (phones: Phone[]) => void
  setView?: (view: string) => void
  setSelectedPhone?: (phone: Phone) => void
}

interface Row {
  label: string
  type: 'high_wins' | 'low_wins' | 'flagship' | 'none'
  tooltip?: { layman: string; nerd: string }
  fmt: (specs: CleanSpec[], phone: Phone) => string
  parse: (value: string) => number | string | null
}

const FLAGSHIP_CHIP_PATTERNS = [
  /snapdragon 8 gen \d/i,
  /snapdragon 8s gen \d/i,
  /snapdragon 8 elite/i,
  /dimensity 9\d{3}/i,
  /exynos 2\d{3}/i,
  /apple a1[4-9] bionic/i,
  /apple a\d+ pro/i,
  /tensor g[3-9]/i,
]

const isFlagshipChip = (chipset: string) => FLAGSHIP_CHIP_PATTERNS.some((p) => p.test(chipset))

export default function DesktopCompare({ phones, onPhonesChange }: DesktopCompareProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  const findSpec = (specs: CleanSpec[], icon: string, matcher?: (s: CleanSpec) => boolean): string => {
    const spec = specs.find((s) => s.icon === icon && (matcher ? matcher(s) : true))
    return spec ? spec.value : '—'
  }

  const ALL_ROWS: Row[] = [
    { label: 'Price', type: 'low_wins', tooltip: { layman: 'Total cost', nerd: 'MSRP USD' }, fmt: (s) => findSpec(s, '💰'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null },
    { label: 'Chipset', type: 'flagship', tooltip: { layman: 'Brain of the phone', nerd: 'System on Chip' }, fmt: (s) => findSpec(s, '🔧'), parse: (v) => v === '—' ? null : v },
    { label: 'Display', type: 'none', tooltip: { layman: 'Screen type', nerd: 'Display tech and specs' }, fmt: (s) => findSpec(s, '📱'), parse: () => null },
    { label: 'Screen Size', type: 'high_wins', tooltip: { layman: 'Display size', nerd: 'Screen diagonal inches' }, fmt: (s) => { const v = findSpec(s, '📱'); const m = v.match(/([\d.]+)"/); return m ? `${m[1]}"` : '—' }, parse: (v) => v === '—' ? null : parseFloat(v.replace('"', '')) },
    { label: 'Refresh Rate', type: 'high_wins', tooltip: { layman: 'Screen smoothness', nerd: 'Display Hz' }, fmt: (s) => { const v = findSpec(s, '📱'); const m = v.match(/(\d+)Hz/); return m ? `${m[1]} Hz` : '—' }, parse: (v) => v === '—' ? null : Number(v.replace(' Hz', '')) },
    { label: 'Brightness', type: 'high_wins', tooltip: { layman: 'Max brightness', nerd: 'Peak nits' }, fmt: (s) => findSpec(s, '☀️'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null },
    { label: 'Main Camera', type: 'high_wins', tooltip: { layman: 'Photo quality', nerd: 'Main sensor MP' }, fmt: (s) => findSpec(s, '📷', (x) => x.label.includes('Wide')), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null },
    { label: 'Ultrawide', type: 'high_wins', tooltip: { layman: 'Wide-angle', nerd: 'Ultrawide sensor MP' }, fmt: (s) => findSpec(s, '📸', (x) => x.label.includes('Ultrawide')), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null },
    { label: 'Telephoto', type: 'high_wins', tooltip: { layman: 'Zoom lens', nerd: 'Telephoto sensor MP' }, fmt: (s) => findSpec(s, '🔭', (x) => x.label.includes('Telephoto') || x.label.includes('Periscope')), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null },
    { label: 'Optical Zoom', type: 'high_wins', tooltip: { layman: 'Zoom factor', nerd: 'Optical zoom multiplier' }, fmt: (s) => findSpec(s, '🔍'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)x/)?.[1]) ?? null },
    { label: 'Front Camera', type: 'high_wins', tooltip: { layman: 'Selfie camera', nerd: 'Front sensor MP' }, fmt: (s) => findSpec(s, '🤳'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null },
    { label: 'Battery', type: 'high_wins', tooltip: { layman: 'Battery life', nerd: 'Capacity mAh' }, fmt: (s) => findSpec(s, '🔋'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null },
    { label: 'Fast Charging', type: 'high_wins', tooltip: { layman: 'Charging speed', nerd: 'Max watts' }, fmt: (s) => findSpec(s, '⚡'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)W/)?.[1]) ?? null },
    { label: 'RAM', type: 'high_wins', tooltip: { layman: 'App memory', nerd: 'Max RAM GB' }, fmt: (s) => findSpec(s, '💾'), parse: (v) => v === '—' ? null : Number(v.match(/(\d+)GB/)?.[1]) ?? null },
    { label: 'Storage', type: 'high_wins', tooltip: { layman: 'File space', nerd: 'Max storage GB' }, fmt: (s) => findSpec(s, '📂'), parse: (v) => v === '—' ? null : Math.max(...(v.match(/\d+/g) || []).map(Number)) },
    { label: 'Frame', type: 'high_wins', tooltip: { layman: 'Build material', nerd: 'Frame material' }, fmt: (s) => findSpec(s, '🏗️'), parse: (v) => { if (v === '—') return null; if (v.includes('Titanium')) return 4; if (v.includes('Aluminum')) return 3; if (v.includes('Steel')) return 2; if (v.includes('Plastic')) return 1; return 0 } },
    { label: 'Wi-Fi', type: 'high_wins', tooltip: { layman: 'Wi-Fi version', nerd: 'Wi-Fi protocol' }, fmt: (s) => findSpec(s, '📡'), parse: (v) => ({'Wi-Fi 7':7,'Wi-Fi 6E':6.5,'Wi-Fi 6':6,'Wi-Fi 5':5,'Wi-Fi':4} as Record<string,number>)[v] || 0 },
    { label: 'Weight', type: 'low_wins', tooltip: { layman: 'How heavy', nerd: 'Weight grams' }, fmt: (s, p) => { const v = findSpec(s, '📏'); if (v.includes('g')) return v; return p.weight_g ? `${p.weight_g}g` : '—' }, parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null },
    { label: 'Thickness', type: 'low_wins', tooltip: { layman: 'How thin', nerd: 'Thickness mm' }, fmt: (s, p) => { const v = findSpec(s, '📏'); if (v.includes('mm')) { const m = v.match(/([\d.]+)\s*mm/); return m ? `${m[1]}mm` : p.thickness_mm ? `${p.thickness_mm}mm` : '—' } return p.thickness_mm ? `${p.thickness_mm}mm` : '—' }, parse: (v) => v === '—' ? null : parseFloat(v.replace('mm', '')) },
    { label: 'Release Year', type: 'high_wins', tooltip: { layman: 'When released', nerd: 'Year of launch' }, fmt: (_, p) => p.release_year?.toString() || '—', parse: (v) => v === '—' ? null : Number(v) },
    { label: 'AnTuTu Score', type: 'high_wins', tooltip: { layman: 'Performance score', nerd: 'AnTuTu benchmark' }, fmt: (_, p) => p.antutu_score ? p.antutu_score.toLocaleString() : '—', parse: (v) => v === '—' ? null : Number(v.replace(/,/g, '')) },
  ]

  const phoneSpecs = phones.map(extractCleanSpecs)

  const getWinnerIdx = (row: Row): number => {
    if (row.type === 'none') return -1
    const parsed = phones.map((p, i) => row.parse(row.fmt(phoneSpecs[i], p)))

    if (row.type === 'flagship') {
      const scores = parsed.map((p) => isFlagshipChip((p as string) || '') ? 1 : 0)
      const max = Math.max(...scores)
      if (max === 0) return -1
      const winners = scores.map((s, i) => s === max ? i : -1).filter((i) => i !== -1)
      return winners.length === phones.length ? -1 : winners[0]
    }

    const vals = parsed as (number | null)[]
    const valid = vals.filter((v): v is number => v != null)
    if (valid.length < 2 || new Set(valid).size === 1) return -1

    const best = row.type === 'low_wins' ? Math.min(...valid) : Math.max(...valid)
    const winners = vals.map((v, i) => v === best ? i : -1).filter((i) => i !== -1)
    return winners.length === phones.length ? -1 : winners[0]
  }

  const addPhone = async (phone: Phone) => {
    if (phones.length >= 4) return
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ phoneIds: [...phones.map((p) => p.id), phone.id] }),
      }).catch(() => {})
    }
    onPhonesChange([...phones, phone])
    setShowAddModal(false)
  }

  const removePhone = (id: number) => onPhonesChange(phones.filter((p) => p.id !== id))
  const clearAll = () => onPhonesChange([])

  const shareComparison = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handlePhoneClick = (phone: Phone) => {
    router.push(APP_ROUTES.phoneDetail(phone.brand.toLowerCase().replace(/\s+/g, '-'), createPhoneSlug(phone)))
  }

  const COLUMN_WIDTH = 240

  // Empty state
  if (phones.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: color.bg }}>
        <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center gap-6">
            <ButtonPressFeedback onClick={() => router.push(APP_ROUTES.home)} className="flex items-center gap-3 hover:opacity-70">
              <ArrowLeft size={20} style={{ color: color.text }} />
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
              <h2 className="text-xl font-bold" style={{ color: color.text }}>Mobylite</h2>
            </ButtonPressFeedback>
            <UserMenu variant="desktop" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <GitCompare size={64} style={{ color: color.borderLight }} className="mb-6" />
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: font.primary, color: color.text }}>
            No phones to compare
          </h2>
          <p className="text-base mb-8" style={{ color: color.textMuted }}>
            Add up to 4 phones to compare their specifications side-by-side
          </p>
          <ButtonPressFeedback
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold"
            style={{ backgroundColor: color.text, color: color.bg }}
          >
            <Plus size={20} />
            Add Phone
          </ButtonPressFeedback>
        </div>
        {showAddModal && (
          <AddPhoneModal onSelect={addPhone} onClose={() => setShowAddModal(false)} existingIds={[]} variant="desktop" />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <ButtonPressFeedback onClick={() => router.push(APP_ROUTES.home)} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <ArrowLeft size={20} style={{ color: color.text }} />
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
              <h2 className="text-xl font-bold" style={{ color: color.text }}>Mobylite</h2>
            </ButtonPressFeedback>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} style={{ color: color.textMuted }} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && searchQuery.trim()) router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`) }}
                className="block w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={{ backgroundColor: color.borderLight, border: `1px solid ${color.border}`, color: color.text }}
                onFocus={(e) => (e.currentTarget.style.borderColor = color.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = color.border)}
                placeholder="Search phones..."
              />
            </div>

            <UserMenu variant="desktop" />

            <div className="flex items-center gap-3">
              <ButtonPressFeedback
                onClick={shareComparison}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={linkCopied ? { backgroundColor: color.success, color: color.bg } : { backgroundColor: color.borderLight, color: color.text }}
              >
                {linkCopied ? <Check size={16} /> : <Share2 size={16} />}
                <span className="text-xs font-bold">{linkCopied ? 'Copied!' : 'Share'}</span>
              </ButtonPressFeedback>

              <ButtonPressFeedback
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{ backgroundColor: color.borderLight, color: color.text }}
                hoverStyle={{ backgroundColor: color.border }}
              >
                <RefreshCw size={16} />
                <span className="text-xs font-bold">Clear All</span>
              </ButtonPressFeedback>

              {phones.length < 4 && (
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{ backgroundColor: color.text, color: color.bg }}
                >
                  <Plus size={16} />
                  <span className="text-xs font-bold">Add Phone</span>
                </ButtonPressFeedback>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Prompt shown only when < 2 phones — above the table, not mixed into columns */}
        {phones.length < 2 && (
          <div
            className="mb-6 p-5 rounded-2xl border-2 border-dashed flex items-center gap-4"
            style={{ borderColor: color.border }}
          >
            <Plus size={24} style={{ color: color.textMuted }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: color.text }}>Add another phone to compare</p>
              <p className="text-xs mt-0.5" style={{ color: color.textMuted }}>You need at least 2 phones to see a comparison</p>
            </div>
            <ButtonPressFeedback
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ backgroundColor: color.text, color: color.bg }}
            >
              Add Phone
            </ButtonPressFeedback>
          </div>
        )}

        <div className="overflow-x-auto">
          <table
            className="w-full border-2 rounded-2xl"
            style={{ borderColor: color.border, backgroundColor: color.bg, borderCollapse: 'separate', borderSpacing: 0 }}
          >
            <thead>
              <tr style={{ backgroundColor: color.bg }}>
                <th
                  className="border-r-2 p-6 text-left sticky left-0 z-20"
                  style={{ borderColor: color.border, backgroundColor: color.bg, width: '200px', minWidth: '200px' }}
                >
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>Specification</span>
                </th>

                {phones.map((phone) => (
                  <th
                    key={phone.id}
                    className="border-r-2 p-6 relative"
                    style={{ borderColor: color.border, backgroundColor: color.bg, width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
                  >
                    <ButtonPressFeedback
                      onClick={() => removePhone(phone.id)}
                      className="absolute top-4 right-4 p-2 rounded-full transition-all shadow-sm border z-10"
                      style={{ backgroundColor: color.bg, borderColor: color.border }}
                      hoverStyle={{ backgroundColor: color.borderLight }}
                    >
                      <X size={16} style={{ color: color.textMuted }} />
                    </ButtonPressFeedback>

                    <ButtonPressFeedback onClick={() => handlePhoneClick(phone)} className="w-full">
                      <div
                        className="w-36 h-36 rounded-2xl mx-auto mb-5 flex items-center justify-center overflow-hidden border-2"
                        style={{ backgroundColor: color.borderLight, borderColor: color.border }}
                      >
                        {phone.main_image_url ? (
                          <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-5" />
                        ) : (
                          <Smartphone size={48} style={{ color: color.textLight }} />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>{phone.brand}</p>
                        <p className="text-base font-bold leading-tight mb-3 px-2 line-clamp-2" style={{ color: color.text }}>{phone.model_name}</p>
                        {phone.price_usd && (
                          <div className="inline-block px-4 py-2 rounded-lg" style={{ backgroundColor: color.text, color: color.bg }}>
                            <p className="text-xl font-bold">${phone.price_usd}</p>
                          </div>
                        )}
                      </div>
                    </ButtonPressFeedback>
                  </th>
                ))}

                {phones.length < 4 && (
                  <th
                    className="border-r-2 p-6"
                    style={{ borderColor: color.border, backgroundColor: color.bg, width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
                  >
                    <ButtonPressFeedback
                      onClick={() => setShowAddModal(true)}
                      className="w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 transition-all"
                      style={{ borderColor: color.border }}
                      hoverStyle={{ borderColor: color.text }}
                    >
                      <Plus size={32} style={{ color: color.textMuted }} />
                      <span className="text-sm font-bold mt-3" style={{ color: color.textMuted }}>Add Phone</span>
                    </ButtonPressFeedback>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {ALL_ROWS.map((row) => {
                const winner = getWinnerIdx(row)
                return (
                  <tr key={row.label} className="border-t-2" style={{ borderColor: color.border }}>
                    <td
                      className="border-r-2 p-5 sticky left-0 z-10"
                      style={{ borderColor: color.border, backgroundColor: color.bg, width: '200px', minWidth: '200px' }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold" style={{ color: color.text }}>{row.label}</span>
                        {row.tooltip && <Tooltip term={row.label} layman={row.tooltip.layman} nerd={row.tooltip.nerd} />}
                      </div>
                    </td>

                    {phones.map((phone, idx) => {
                      const isWinner = winner === idx
                      const displayVal = row.fmt(phoneSpecs[idx], phone)
                      return (
                        <td
                          key={phone.id}
                          className="border-r-2 p-5"
                          style={{
                            borderColor: color.border,
                            backgroundColor: color.bg,
                            borderLeft: isWinner ? `3px solid ${color.success}` : undefined,
                          }}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {isWinner && <Trophy size={12} style={{ color: color.success, flexShrink: 0 }} />}
                            <span
                              className={`text-sm text-center ${isWinner ? 'font-bold' : 'font-semibold'}`}
                              style={{ color: isWinner ? color.success : color.text }}
                            >
                              {displayVal}
                            </span>
                          </div>
                        </td>
                      )
                    })}

                    {phones.length < 4 && (
                      <td className="border-r-2 p-5" style={{ borderColor: color.border, backgroundColor: color.bg }} />
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddPhoneModal
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map((p) => p.id)}
          variant="desktop"
        />
      )}
    </div>
  )
}
