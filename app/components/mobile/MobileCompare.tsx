'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, X, Share2, Check, Smartphone, GitCompare,
  DollarSign, Cpu, Camera, Battery, Zap, Monitor, Weight, Ruler,
  Calendar, Award, HardDrive, MemoryStick, Sun, VideoIcon, Wifi, Box,
} from 'lucide-react'
import { Phone } from '@/lib/types'
import { API_BASE_URL, APP_ROUTES } from '@/lib/config'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback'
import { AddPhoneModal } from '@/app/components/shared/AddPhoneModal'
import { color, font } from '@/lib/tokens'
import { createPhoneSlug } from '@/lib/config'
import { extractCleanSpecs, CleanSpec } from '@/lib/cleanSpecExtractor'

interface MobileCompareProps {
  phones: Phone[]
  onPhonesChange: (phones: Phone[]) => void
  onBack?: () => void
}

interface Row {
  label: string
  icon: any
  type: 'low_wins' | 'high_wins' | 'flagship' | 'none'
  fmt: (specs: CleanSpec[], phone: Phone) => string
  parse: (v: string) => number | string | null
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

const isFlagshipChip = (chipset: string): boolean =>
  FLAGSHIP_CHIP_PATTERNS.some(p => p.test(chipset))

export default function MobileCompare({ phones, onPhonesChange, onBack }: MobileCompareProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const findSpec = (
    specs: CleanSpec[],
    iconMatch: string,
    filter?: (s: CleanSpec) => boolean
  ): string => {
    const spec = specs.find(s => s.icon === iconMatch && (!filter || filter(s)))
    return spec?.value || '—'
  }

  const ROWS: Row[] = [
    {
      label: 'Price', icon: DollarSign, type: 'low_wins',
      fmt: (specs) => findSpec(specs, '💰'),
      parse: (v) => v === '—' ? null : Number(v.replace(/[^0-9.]/g, '')),
    },
    {
      label: 'Chipset', icon: Cpu, type: 'flagship',
      fmt: (specs) => findSpec(specs, '🔧'),
      parse: (v) => v,
    },
    {
      label: 'Display', icon: Monitor, type: 'none',
      fmt: (specs) => findSpec(specs, '📱'),
      parse: () => null,
    },
    {
      label: 'Screen Size', icon: Monitor, type: 'high_wins',
      fmt: (specs) => {
        const d = findSpec(specs, '📱')
        const m = d.match(/([\d.]+)"/)
        return m ? `${m[1]}"` : '—'
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('"', '')),
    },
    {
      label: 'Refresh', icon: Monitor, type: 'high_wins',
      fmt: (specs) => {
        const d = findSpec(specs, '📱')
        const m = d.match(/(\d+)Hz/)
        return m ? `${m[1]}Hz` : '—'
      },
      parse: (v) => v === '—' ? null : Number(v.replace('Hz', '')),
    },
    {
      label: 'Brightness', icon: Sun, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '☀️'),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]),
    },
    {
      label: 'Main Cam', icon: Camera, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '📷', s => s.label.includes('Wide')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Ultrawide', icon: Camera, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '📸', s => s.label.includes('Ultrawide')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Telephoto', icon: VideoIcon, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '🔭', s => s.label.includes('Telephoto') || s.label.includes('Periscope')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Zoom', icon: VideoIcon, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '🔍'),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)x/)?.[1]),
    },
    {
      label: 'Front Cam', icon: Camera, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '🤳'),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]),
    },
    {
      label: 'Battery', icon: Battery, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '🔋'),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]),
    },
    {
      label: 'Charging', icon: Zap, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '⚡'),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)W/)?.[1]),
    },
    {
      label: 'RAM', icon: MemoryStick, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '💾'),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]),
    },
    {
      label: 'Storage', icon: HardDrive, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '📂'),
      parse: (v) => {
        if (v === '—') return null
        const matches = v.match(/\d+/g)
        return matches ? Math.max(...matches.map(Number)) : null
      },
    },
    {
      label: 'Frame', icon: Box, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '🏗️'),
      parse: (v) => {
        if (v === '—') return null
        if (v.includes('Titanium')) return 4
        if (v.includes('Aluminum')) return 3
        if (v.includes('Steel')) return 2
        if (v.includes('Plastic')) return 1
        return 0
      },
    },
    {
      label: 'Wi-Fi', icon: Wifi, type: 'high_wins',
      fmt: (specs) => findSpec(specs, '📡'),
      parse: (v) => {
        const map: Record<string, number> = {
          'Wi-Fi 7': 7, 'Wi-Fi 6E': 6.5, 'Wi-Fi 6': 6, 'Wi-Fi 5': 5, 'Wi-Fi': 4,
        }
        return map[v] || 0
      },
    },
    {
      label: 'Weight', icon: Weight, type: 'low_wins',
      fmt: (specs, phone) => {
        const v = findSpec(specs, '📏')
        if (v.includes('g')) return v
        return phone.weight_g ? `${phone.weight_g}g` : '—'
      },
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]),
    },
    {
      label: 'Thickness', icon: Ruler, type: 'low_wins',
      fmt: (specs, phone) => {
        const v = findSpec(specs, '📏')
        if (v.includes('mm')) {
          const m = v.match(/([\d.]+)\s*mm/)
          return m ? `${m[1]}mm` : phone.thickness_mm ? `${phone.thickness_mm}mm` : '—'
        }
        return phone.thickness_mm ? `${phone.thickness_mm}mm` : '—'
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('mm', '')),
    },
    {
      label: 'Year', icon: Calendar, type: 'high_wins',
      fmt: (_, phone) => phone.release_year?.toString() || '—',
      parse: (v) => v === '—' ? null : Number(v),
    },
    {
      label: 'AnTuTu', icon: Award, type: 'high_wins',
      fmt: (_, phone) => phone.antutu_score ? phone.antutu_score.toLocaleString() : '—',
      parse: (v) => v === '—' ? null : Number(v.replace(/,/g, '')),
    },
  ]

  const phoneSpecs = phones.map(phone => extractCleanSpecs(phone))

  const getWinnerIdx = (row: Row): number => {
    if (row.type === 'none') return -1

    if (row.type === 'flagship') {
      const scores = phones.map(p => isFlagshipChip(p.chipset || '') ? 1 : 0)
      const maxScore = Math.max(...scores)
      if (maxScore === 0) return -1
      const winners = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1)
      return winners.length === phones.length ? -1 : winners[0]
    }

    const vals = phones.map((p, i) => row.parse(row.fmt(phoneSpecs[i], p))) as (number | null)[]
    const valid = vals.filter((v): v is number => v != null)
    if (valid.length < 2) return -1
    if (new Set(valid).size === 1) return -1

    const best = row.type === 'low_wins' ? Math.min(...valid) : Math.max(...valid)
    const winners = vals.map((v, i) => v === best ? i : -1).filter(i => i !== -1)
    return winners.length === phones.length ? -1 : winners[0]
  }

  const addPhone = async (phone: Phone) => {
    if (phones.length >= 4) return
    if (phones.some(p => p.id === phone.id)) {
      setShowAddModal(false)
      return
    }

    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ phoneIds: [...phones.map(p => p.id), phone.id] }),
      }).catch(() => {})
    }

    onPhonesChange([...phones, phone])
    setShowAddModal(false)
  }

  const removePhone = (id: number) => {
    onPhonesChange(phones.filter(p => p.id !== id))
  }

  const clearAll = () => onPhonesChange([])

  const shareComparison = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-')
    router.push(APP_ROUTES.phoneDetail(brandSlug, createPhoneSlug(phone)))
  }

  const handleBack = () => {
    if (onBack) onBack()
    else router.push('/')
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const onScroll = () => setShowLabels(container.scrollLeft < 10)
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  const labelWidth = showLabels ? 110 : 48
  const COLUMN_WIDTH = 140

  // Empty state
  if (phones.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: color.bg }}>
        <div className="sticky top-0 z-30 border-b px-4 py-3" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
          <div className="flex items-center justify-between">
            <ButtonPressFeedback onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft size={20} style={{ color: color.text }} />
              <span className="text-base font-bold" style={{ color: color.text }}>Back</span>
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-bold"
              style={{ backgroundColor: color.text, color: color.bg }}
            >
              <Plus size={16} />
              Add
            </ButtonPressFeedback>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <GitCompare size={48} style={{ color: color.borderLight }} className="mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: font.primary, color: color.text }}>
            Nothing to compare
          </h2>
          <p className="text-sm mb-6" style={{ color: color.textMuted }}>
            Add at least two phones to start.
          </p>
          <ButtonPressFeedback
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm"
            style={{ backgroundColor: color.text, color: color.bg }}
          >
            <Plus size={16} />
            Add Phone
          </ButtonPressFeedback>
        </div>
        {showAddModal && (
          <AddPhoneModal
            onSelect={addPhone}
            onClose={() => setShowAddModal(false)}
            existingIds={[]}
            variant="mobile"
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      {/* Navbar */}
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <ButtonPressFeedback onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft size={20} style={{ color: color.text }} />
              <span className="text-base font-bold" style={{ color: color.text }}>Back</span>
            </ButtonPressFeedback>

            <div className="flex items-center gap-2">
              <ButtonPressFeedback
                onClick={shareComparison}
                className="p-2 rounded-lg"
                style={
                  linkCopied
                    ? { backgroundColor: color.success, color: color.bg }
                    : { backgroundColor: color.borderLight, color: color.text }
                }
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
              </ButtonPressFeedback>

              <ButtonPressFeedback
                onClick={clearAll}
                className="px-3 py-2 rounded-lg text-xs font-bold"
                style={{ backgroundColor: color.borderLight, color: color.text }}
              >
                Clear
              </ButtonPressFeedback>

              {phones.length < 4 && (
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-bold"
                  style={{ backgroundColor: color.text, color: color.bg }}
                >
                  <Plus size={16} />
                  Add
                </ButtonPressFeedback>
              )}
            </div>
          </div>
          <p className="text-xs font-medium" style={{ color: color.textMuted }}>
            Swipe right — highlighted = winner — {phones.length}/4 phones
          </p>
        </div>
      </div>

      {/* Scrollable table */}
      <div ref={scrollContainerRef} className="overflow-x-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <style>{`.hide-sb::-webkit-scrollbar { display: none; }`}</style>
        <div className="inline-block min-w-full hide-sb">
          {/* Header row */}
          <div
            className="flex sticky z-20 border-b"
            style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
          >
            <div
              className="sticky left-0 z-10 flex items-center justify-center border-r flex-shrink-0"
              style={{ backgroundColor: color.bg, borderColor: color.borderLight, width: `${labelWidth}px`, transition: 'width 0.2s ease' }}
            />

            {phones.map((phone) => (
              <div
                key={phone.id}
                className="flex-shrink-0 p-3 border-r relative"
                style={{ borderColor: color.borderLight, width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
              >
                <ButtonPressFeedback
                  onClick={() => removePhone(phone.id)}
                  className="absolute top-2 right-2 p-1 rounded-full z-10 border"
                  style={{ backgroundColor: color.bg, borderColor: color.border }}
                >
                  <X size={12} style={{ color: color.textMuted }} />
                </ButtonPressFeedback>

                <ButtonPressFeedback onClick={() => handlePhoneClick(phone)} className="w-full">
                  <div
                    className="w-full h-24 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: color.borderLight }}
                  >
                    {phone.main_image_url ? (
                      <img
                        src={phone.main_image_url}
                        alt={phone.model_name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <Smartphone size={24} style={{ color: color.textLight }} />
                    )}
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                    {phone.brand}
                  </p>
                  <p className="text-[11px] font-bold leading-tight mb-2 line-clamp-2 min-h-[28px]" style={{ color: color.text }}>
                    {phone.model_name}
                  </p>
                  {phone.price_usd && (
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: color.text, color: color.bg }}>
                      ${phone.price_usd}
                    </div>
                  )}
                </ButtonPressFeedback>
              </div>
            ))}

            {/* Add slot in header */}
            {phones.length < 4 && (
              <div
                className="flex-shrink-0 border-r"
                style={{ borderColor: color.borderLight, width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
              >
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 m-2"
                  style={{ borderColor: color.border, width: `calc(${COLUMN_WIDTH}px - 16px)` }}
                >
                  <Plus size={20} style={{ color: color.textMuted }} />
                  <p className="text-[10px] font-bold mt-1" style={{ color: color.textMuted }}>Add</p>
                </ButtonPressFeedback>
              </div>
            )}
          </div>

          {/* Data rows */}
          {ROWS.map((row) => {
            const winner = getWinnerIdx(row)
            return (
              <div key={row.label} className="flex border-b" style={{ borderColor: color.borderLight }}>
                <div
                  className="sticky left-0 z-10 flex items-center gap-2 px-3 py-3 border-r flex-shrink-0"
                  style={{ backgroundColor: color.bg, borderColor: color.borderLight, width: `${labelWidth}px`, transition: 'width 0.2s ease' }}
                >
                  <row.icon size={16} style={{ color: color.textMuted }} className="flex-shrink-0" />
                  <span
                    className="text-[11px] font-bold truncate transition-opacity duration-200"
                    style={{ color: color.text, opacity: showLabels ? 1 : 0, whiteSpace: 'nowrap' }}
                  >
                    {showLabels && row.label}
                  </span>
                </div>

                {phones.map((phone, idx) => {
                  const isWinner = winner === idx
                  const displayVal = row.fmt(phoneSpecs[idx], phone)
                  return (
                    <div
                      key={phone.id}
                      className="flex-shrink-0 px-2 py-3 flex items-center justify-center border-r"
                      style={{
                        borderColor: color.border,
                        backgroundColor: isWinner ? color.bgInverse : color.bg,
                        color: isWinner ? color.textInverse : color.text,
                        width: `${COLUMN_WIDTH}px`,
                        minWidth: `${COLUMN_WIDTH}px`,
                      }}
                    >
                      <span className={`text-[11px] text-center ${isWinner ? 'font-bold' : 'font-medium'}`}>
                        {displayVal}
                      </span>
                    </div>
                  )
                })}

                {/* Empty add column padding */}
                {phones.length < 4 && (
                  <div
                    className="flex-shrink-0 border-r"
                    style={{ borderColor: color.border, width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showAddModal && (
        <AddPhoneModal
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map(p => p.id)}
          variant="mobile"
        />
      )}
    </div>
  )
}
