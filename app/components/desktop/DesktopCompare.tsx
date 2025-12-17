// app/components/desktop/DesktopCompare.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Search, GitCompare, Share2, Check, RefreshCw, Smartphone } from 'lucide-react';
import { Phone } from '@/lib/types';
import { CleanSpec, extractCleanSpecs } from '@/lib/cleanSpecExtractor';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { Tooltip } from '@/app/components/shared/Tooltip';
import { UserMenu } from '@/app/components/shared/UserMenu';
import { AddPhoneModal } from '@/app/components/shared/AddPhoneModal';
import { color, font } from '@/lib/tokens';
import { createPhoneSlug } from '@/lib/config';

interface DesktopCompareProps {
  phones: Phone[];
  onPhonesChange: (phones: Phone[]) => void;
}

interface Row {
  label: string;
  type: 'high_wins' | 'low_wins' | 'flagship' | 'none';
  tooltip?: { layman: string; nerd: string };
  fmt: (specs: CleanSpec[], phone: Phone) => string;
  parse: (value: string) => number | string | null;
}

export default function DesktopCompare({ phones, onPhonesChange }: DesktopCompareProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const findSpec = (specs: CleanSpec[], icon: string, matcher?: (spec: CleanSpec) => boolean): string => {
    const spec = specs.find(s => s.icon === icon && (matcher ? matcher(s) : true));
    return spec ? spec.value : '—';
  };

  const flagshipChips = ['snapdragon 8', 'dimensity 9', 'exynos 2', 'apple a1', 'apple a2', 'tensor', 'snapdragon 8 elite', 'snapdragon 8 gen'];

  const ALL_ROWS: Row[] = [
    {
      label: 'Price',
      type: 'low_wins',
      tooltip: { layman: 'Total cost to buy the phone', nerd: 'MSRP at launch in USD' },
      fmt: (specs) => findSpec(specs, "💰"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null,
    },
    {
      label: 'Chipset',
      type: 'flagship',
      tooltip: { layman: 'Brain of the phone', nerd: 'System on Chip processor' },
      fmt: (specs) => findSpec(specs, "🔧"),
      parse: (v) => v === '—' ? null : v,
    },
    {
      label: 'Display',
      type: 'none',
      tooltip: { layman: 'Screen type and refresh rate', nerd: 'Display technology and specs' },
      fmt: (specs) => findSpec(specs, "📱"),
      parse: (v) => null,
    },
    {
      label: 'Screen Size',
      type: 'high_wins',
      tooltip: { layman: 'Display diagonal size', nerd: 'Screen diagonal in inches' },
      fmt: (specs) => {
        const v = findSpec(specs, "📱");
        const match = v.match(/([\d.]+)"/);
        return match ? `${match[1]}"` : '—';
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('"', '')),
    },
    {
      label: 'Refresh Rate',
      type: 'high_wins',
      tooltip: { layman: 'How smooth the screen feels', nerd: 'Display refresh rate in Hz' },
      fmt: (specs) => {
        const v = findSpec(specs, "📱");
        const match = v.match(/(\d+)Hz/);
        return match ? `${match[1]} Hz` : '—';
      },
      parse: (v) => v === '—' ? null : Number(v.replace(' Hz', '')),
    },
    {
      label: 'Brightness',
      type: 'high_wins',
      tooltip: { layman: 'How bright the screen gets', nerd: 'Maximum brightness in nits' },
      fmt: (specs) => findSpec(specs, "☀️"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null,
    },
    {
      label: 'Main Camera',
      type: 'high_wins',
      tooltip: { layman: 'Photo quality', nerd: 'Main sensor resolution' },
      fmt: (specs) => findSpec(specs, "📷", (s) => s.label.includes('Wide')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Ultrawide',
      type: 'high_wins',
      tooltip: { layman: 'Wide-angle lens', nerd: 'Ultrawide sensor resolution' },
      fmt: (specs) => findSpec(specs, "📸", (s) => s.label.includes('Ultrawide')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Telephoto',
      type: 'high_wins',
      tooltip: { layman: 'Zoom lens', nerd: 'Telephoto sensor resolution' },
      fmt: (specs) => findSpec(specs, "🔭", (s) => s.label.includes('Telephoto') || s.label.includes('Periscope')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Optical Zoom',
      type: 'high_wins',
      tooltip: { layman: 'How much zoom', nerd: 'Optical zoom factor' },
      fmt: (specs) => findSpec(specs, "🔍"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)x/)?.[1]) ?? null,
    },
    {
      label: 'Front Camera',
      type: 'high_wins',
      tooltip: { layman: 'Selfie camera', nerd: 'Front sensor resolution' },
      fmt: (specs) => findSpec(specs, "🤳"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Battery',
      type: 'high_wins',
      tooltip: { layman: 'Battery life', nerd: 'Battery capacity in mAh' },
      fmt: (specs) => findSpec(specs, "🔋"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null,
    },
    {
      label: 'Fast Charging',
      type: 'high_wins',
      tooltip: { layman: 'Charging speed', nerd: 'Max charging power in watts' },
      fmt: (specs) => findSpec(specs, "⚡"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)W/)?.[1]) ?? null,
    },
    {
      label: 'RAM',
      type: 'high_wins',
      tooltip: { layman: 'Memory for apps', nerd: 'Maximum RAM capacity' },
      fmt: (specs) => findSpec(specs, "💾"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)GB/)?.[1]) ?? null,
    },
    {
      label: 'Storage',
      type: 'high_wins',
      tooltip: { layman: 'Space for files', nerd: 'Maximum storage capacity' },
      fmt: (specs) => findSpec(specs, "📂"),
      parse: (v) => v === '—' ? null : Math.max(...(v.match(/\d+/g) || []).map(Number)),
    },
    {
      label: 'Frame',
      type: 'high_wins',
      tooltip: { layman: 'Frame material', nerd: 'Frame build material' },
      fmt: (specs) => findSpec(specs, "🏗️"),
      parse: (v) => {
        if (v === '—') return null;
        if (v.includes('Titanium')) return 4;
        if (v.includes('Aluminum')) return 3;
        if (v.includes('Steel')) return 2;
        if (v.includes('Plastic')) return 1;
        return 0;
      },
    },
    {
      label: 'Wi-Fi',
      type: 'high_wins',
      tooltip: { layman: 'Wi-Fi version', nerd: 'Wi-Fi protocol support' },
      fmt: (specs) => findSpec(specs, "📡"),
      parse: (v) => {
        const map: Record<string, number> = { 'Wi-Fi 7': 7, 'Wi-Fi 6E': 6.5, 'Wi-Fi 6': 6, 'Wi-Fi 5': 5, 'Wi-Fi': 4 };
        return map[v] || 0;
      },
    },
    {
      label: 'Weight',
      type: 'low_wins',
      tooltip: { layman: 'How heavy', nerd: 'Device weight in grams' },
      fmt: (specs, phone) => {
        const v = findSpec(specs, "📏");
        if (v.includes('g')) return v;
        return phone.weight_g ? `${phone.weight_g}g` : '—';
      },
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null,
    },
    {
      label: 'Thickness',
      type: 'low_wins',
      tooltip: { layman: 'How thin', nerd: 'Device thickness in mm' },
      fmt: (specs, phone) => {
        const v = findSpec(specs, "📏");
        if (v.includes('mm')) {
          const match = v.match(/([\d.]+)\s*mm/);
          return match ? `${match[1]}mm` : (phone.thickness_mm ? `${phone.thickness_mm}mm` : '—');
        }
        return phone.thickness_mm ? `${phone.thickness_mm}mm` : '—';
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('mm', '')),
    },
    {
      label: 'Release Year',
      type: 'high_wins',
      tooltip: { layman: 'When released', nerd: 'Year of market release' },
      fmt: (specs, phone) => phone.release_year?.toString() || '—',
      parse: (v) => v === '—' ? null : Number(v),
    },
    {
      label: 'AnTuTu Score',
      type: 'high_wins',
      tooltip: { layman: 'Performance', nerd: 'AnTuTu benchmark score' },
      fmt: (specs, phone) => phone.antutu_score ? phone.antutu_score.toLocaleString() : '—',
      parse: (v) => v === '—' ? null : Number(v.replace(/,/g, '')),
    },
  ];

  const phoneSpecs = phones.map((phone) => extractCleanSpecs(phone));

  const getWinnerIdx = (row: Row) => {
    if (row.type === 'none') return -1;

    const parsed = phones.map((phone, i) => row.parse(row.fmt(phoneSpecs[i], phone)));

    if (row.type === 'flagship') {
      const scores = parsed.map(p => {
        const chipset = (p as string || '').toLowerCase();
        return flagshipChips.some(flag => chipset.includes(flag)) ? 1 : 0;
      });
      const maxScore = Math.max(...scores);
      if (maxScore === 0) return -1;
      const winners = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
      return winners.length === phones.length ? -1 : winners[0];
    }

    const vals = parsed as (number | null)[];
    const valid = vals.filter((v): v is number => v != null);
    if (valid.length < 2) return -1;
    const unique = new Set(valid);
    if (unique.size === 1) return -1;

    const bestVal = row.type === 'low_wins' ? Math.min(...valid) : Math.max(...valid);
    const winners = vals.map((v, i) => v === bestVal ? i : -1).filter(i => i !== -1);
    return winners.length === phones.length ? -1 : winners[0];
  };

  const addPhone = async (phone: Phone) => {
    if (phones.length >= 4) return;

    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          phoneIds: [...phones.map(p => p.id), phone.id],
        })
      }).catch(console.error);
    }

    onPhonesChange([...phones, phone]);
    setShowAddModal(false);
  };

  const removePhone = (id: number) => {
    onPhonesChange(phones.filter(p => p.id !== id));
  };

  const clearAll = () => {
    onPhonesChange([]);
  };

  const shareComparison = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = createPhoneSlug(phone);
    router.push(APP_ROUTES.phoneDetail(brandSlug, modelSlug));
  };

  const COLUMN_WIDTH = 240;

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <ButtonPressFeedback
              onClick={() => router.push(APP_ROUTES.home)}
              className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            >
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="block w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={{
                  backgroundColor: color.borderLight,
                  border: `1px solid ${color.border}`,
                  color: color.text,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = color.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = color.border}
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

              {phones.length > 0 && (
                <ButtonPressFeedback
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{ backgroundColor: color.borderLight, color: color.text }}
                  hoverStyle={{ backgroundColor: color.border }}
                >
                  <RefreshCw size={16} />
                  <span className="text-xs font-bold">Clear All</span>
                </ButtonPressFeedback>
              )}

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

      <div className="border-b" style={{ backgroundColor: color.bgInverse }}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color.bg }}>
                  <GitCompare size={24} style={{ color: color.bgInverse }} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: font.primary, color: color.textInverse }}>
                  Phone Comparison
                </h1>
              </div>
              <p className="text-xl font-medium" style={{ color: color.textLight }}>
                Compare specifications side-by-side • Black highlights winner
              </p>
            </div>
            <div className="text-center rounded-2xl px-10 py-6 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
              <div className="text-5xl font-bold mb-2" style={{ fontFamily: font.numeric, color: color.text }}>
                {phones.length}/4
              </div>
              <div className="text-sm font-medium" style={{ color: color.textMuted }}>Phones</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="overflow-x-auto">
          <table className="w-full border-2 rounded-2xl" style={{ borderColor: color.border, backgroundColor: color.bg, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: color.bg }}>
                <th 
                  className="border-r-2 p-6 text-left sticky left-0 z-20" 
                  style={{ 
                    borderColor: color.border, 
                    backgroundColor: color.bg,
                    width: '200px',
                    minWidth: '200px'
                  }}
                >
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
                    Specification
                  </span>
                </th>

                {[0, 1, 2, 3].map((idx) => {
                  const phone = phones[idx];
                  
                  return (
                    <th 
                      key={idx}
                      className="border-r-2 p-6 relative"
                      style={{ 
                        borderColor: color.border, 
                        backgroundColor: color.bg,
                        width: `${COLUMN_WIDTH}px`,
                        minWidth: `${COLUMN_WIDTH}px`,
                        maxWidth: `${COLUMN_WIDTH}px`
                      }}
                    >
                      {phone ? (
                        <>
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
                              className="w-40 h-40 rounded-2xl mx-auto mb-5 flex items-center justify-center overflow-hidden border-2 shadow-sm transition-all cursor-pointer"
                              style={{ backgroundColor: color.bg, borderColor: color.border }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = color.text}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = color.border}
                            >
                              {phone.main_image_url ? (
                                <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-6" />
                              ) : (
                                <Smartphone size={48} style={{ color: color.textLight }} />
                              )}
                            </div>

                            <div className="text-center">
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                                {phone.brand}
                              </p>
                              <p className="text-base font-bold leading-tight mb-3 px-2 line-clamp-2" style={{ color: color.text }}>
                                {phone.model_name}
                              </p>
                              {phone.price_usd && (
                                <div className="inline-block px-4 py-2 rounded-lg" style={{ backgroundColor: color.text, color: color.bg }}>
                                  <p className="text-xl font-bold">${phone.price_usd}</p>
                                </div>
                              )}
                            </div>
                          </ButtonPressFeedback>
                        </>
                      ) : (
                        <ButtonPressFeedback
                          onClick={() => setShowAddModal(true)}
                          className="w-full h-full flex flex-col items-center justify-center gap-4 rounded-2xl transition-all py-8 border-2 border-dashed"
                          style={{ borderColor: color.border, backgroundColor: color.bg }}
                          hoverStyle={{ borderColor: color.text }}
                        >
                          <div className="w-40 h-40 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: color.bg }}>
                            <Plus size={48} style={{ color: color.textMuted }} />
                          </div>
                          <span className="text-base font-bold" style={{ color: color.textMuted }}>Add Phone</span>
                        </ButtonPressFeedback>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {ALL_ROWS.map((row) => {
                const winner = getWinnerIdx(row);

                return (
                  <tr key={row.label} className="border-t-2" style={{ borderColor: color.border }}>
                    <td 
                      className="border-r-2 p-5 sticky left-0 z-10" 
                      style={{ 
                        borderColor: color.border, 
                        backgroundColor: color.bg,
                        width: '200px',
                        minWidth: '200px'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold" style={{ color: color.text }}>
                          {row.label}
                        </span>
                        {row.tooltip && (
                          <Tooltip term={row.label} layman={row.tooltip.layman} nerd={row.tooltip.nerd} />
                        )}
                      </div>
                    </td>

                    {[0, 1, 2, 3].map((idx) => {
                      const phone = phones[idx];
                      const isWinner = winner === idx;
                      const displayVal = phone ? row.fmt(phoneSpecs[idx], phone) : '';

                      return (
                        <td
                          key={idx}
                          className="border-r-2 p-5 transition-all"
                          style={{
                            borderColor: color.border,
                            backgroundColor: isWinner ? color.bgInverse : color.bg,
                            color: isWinner ? color.textInverse : color.text,
                            width: `${COLUMN_WIDTH}px`,
                            minWidth: `${COLUMN_WIDTH}px`,
                            maxWidth: `${COLUMN_WIDTH}px`
                          }}
                        >
                          <span className={`block text-center text-sm ${isWinner ? 'font-bold' : 'font-semibold'}`}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddPhoneModal
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map(p => p.id)}
          variant="desktop"
        />
      )}
    </div>
  );
}