// app/components/mobile/MobileCompare.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, X, Share2, Check, Smartphone,
  DollarSign, Cpu, Camera, Battery, Zap, Monitor, 
  Weight, Ruler, Calendar, Award, HardDrive, MemoryStick,
  Sun, VideoIcon, Wifi, Box
} from 'lucide-react';
import { Phone } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { AddPhoneModal } from '@/app/components/shared/AddPhoneModal';
import { color, font } from '@/lib/tokens';
import { createPhoneSlug } from '@/lib/config';
import { extractCleanSpecs, CleanSpec } from '@/lib/cleanSpecExtractor';

interface MobileCompareProps {
  phones: Phone[];
  onPhonesChange: (phones: Phone[]) => void;
}

interface Row {
  label: string;
  icon: any;
  type: 'low_wins' | 'high_wins' | 'flagship' | 'none';
  fmt: (specs: CleanSpec[], phone: Phone) => string;
  parse: (v: string) => number | string | null;
}

export default function MobileCompare({ phones, onPhonesChange }: MobileCompareProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const findSpec = (specs: CleanSpec[], iconMatch: string, filter?: (s: CleanSpec) => boolean): string => {
    const spec = specs.find(s => s.icon === iconMatch && (!filter || filter(s)));
    return spec?.value || '—';
  };

  const flagshipChips = ['snapdragon 8', 'dimensity 9', 'exynos 2', 'apple a1', 'apple a2', 'tensor', 'snapdragon 8 elite', 'snapdragon 8 gen'];

  const ROWS: Row[] = [
    {
      label: 'Price',
      icon: DollarSign,
      type: 'low_wins',
      fmt: (specs) => findSpec(specs, "💰"),
      parse: (v) => v === '—' ? null : Number(v.replace(/[^0-9.]/g, ''))
    },
    {
      label: 'Chipset',
      icon: Cpu,
      type: 'flagship',
      fmt: (specs) => findSpec(specs, "🔧"),
      parse: (v) => v
    },
    {
      label: 'Display',
      icon: Monitor,
      type: 'none',
      fmt: (specs) => findSpec(specs, "📱"),
      parse: (v) => null
    },
    {
      label: 'Screen Size',
      icon: Monitor,
      type: 'high_wins',
      fmt: (specs) => {
        const display = findSpec(specs, "📱");
        const match = display.match(/([\d.]+)"/);
        return match ? `${match[1]}"` : '—';
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('"', ''))
    },
    {
      label: 'Refresh',
      icon: Monitor,
      type: 'high_wins',
      fmt: (specs) => {
        const display = findSpec(specs, "📱");
        const match = display.match(/(\d+)Hz/);
        return match ? `${match[1]}Hz` : '—';
      },
      parse: (v) => v === '—' ? null : Number(v.replace('Hz', ''))
    },
    {
      label: 'Brightness',
      icon: Sun,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "☀️"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1])
    },
    {
      label: 'Main Cam',
      icon: Camera,  // ✅ Add this
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "📷", (s) => s.label.includes('Wide')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Ultrawide',
      icon: Camera,  // ✅ Add this
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "📸", (s) => s.label.includes('Ultrawide')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Telephoto',
      icon: VideoIcon,  // ✅ Add this
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "🔭", (s) => s.label.includes('Telephoto') || s.label.includes('Periscope')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Zoom',
      icon: VideoIcon,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "🔍"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)x/)?.[1])
    },
    {
      label: 'Front Cam',
      icon: Camera,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "🤳"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1])
    },
    {
      label: 'Battery',
      icon: Battery,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "🔋"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1])
    },
    {
      label: 'Charging',
      icon: Zap,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "⚡"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)W/)?.[1])
    },
    {
      label: 'RAM',
      icon: MemoryStick,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "💾"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1])
    },
    {
      label: 'Storage',
      icon: HardDrive,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "📂"),
      parse: (v) => {
        if (v === '—') return null;
        const matches = v.match(/\d+/g);
        return matches ? Math.max(...matches.map(Number)) : null;
      }
    },
    {
      label: 'Frame',
      icon: Box,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "🏗️"),
      parse: (v) => {
        if (v === '—') return null;
        if (v.includes('Titanium')) return 4;
        if (v.includes('Aluminum')) return 3;
        if (v.includes('Steel')) return 2;
        if (v.includes('Plastic')) return 1;
        return 0;
      }
    },
    {
      label: 'Wi-Fi',
      icon: Wifi,
      type: 'high_wins',
      fmt: (specs) => findSpec(specs, "📡"),
      parse: (v) => {
        const map: Record<string, number> = { 'Wi-Fi 7': 7, 'Wi-Fi 6E': 6.5, 'Wi-Fi 6': 6, 'Wi-Fi 5': 5, 'Wi-Fi': 4 };
        return map[v] || 0;
      }
    },
    {
      label: 'Weight',
      icon: Weight,
      type: 'low_wins',
      fmt: (specs, phone) => {
        const dims = findSpec(specs, "📏");
        if (dims.includes('g')) return dims;
        return phone.weight_g ? `${phone.weight_g}g` : '—';
      },
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1])
    },
    {
      label: 'Thickness',
      icon: Ruler,
      type: 'low_wins',
      fmt: (specs, phone) => {
        const dims = findSpec(specs, "📏");
        if (dims.includes('mm')) {
          const match = dims.match(/([\d.]+)\s*mm/);
          return match ? `${match[1]}mm` : (phone.thickness_mm ? `${phone.thickness_mm}mm` : '—');
        }
        return phone.thickness_mm ? `${phone.thickness_mm}mm` : '—';
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('mm', ''))
    },
    {
      label: 'Year',
      icon: Calendar,
      type: 'high_wins',
      fmt: (specs, phone) => phone.release_year?.toString() || '—',
      parse: (v) => v === '—' ? null : Number(v)
    },
    {
      label: 'AnTuTu',
      icon: Award,
      type: 'high_wins',
      fmt: (specs, phone) => phone.antutu_score ? phone.antutu_score.toLocaleString() : '—',
      parse: (v) => v === '—' ? null : Number(v.replace(/,/g, ''))
    }
  ];

  const phoneSpecs = phones.map((phone) => extractCleanSpecs(phone));

  const getWinnerIdx = (row: Row) => {
    if (row.type === 'flagship') {
      const scores = phones.map((phone) => {
        const chipset = (phone.chipset || '').toLowerCase();
        return flagshipChips.some(flag => chipset.includes(flag)) ? 1 : 0;
      });
      const maxScore = Math.max(...scores);
      if (maxScore === 0) return -1;
      const winners = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
      return winners.length === phones.length ? -1 : winners[0];
    }

    if (row.type === 'none') return -1;

    const vals = phones.map((p, i) => row.parse(row.fmt(phoneSpecs[i], p)));
    const valid = vals.filter((v) => v != null);
    if (valid.length < 2) return -1;
    const unique = new Set(valid);
    if (unique.size === 1) return -1;

    const bestVal = row.type === 'low_wins' 
      ? Math.min(...valid.filter(v => typeof v === 'number') as number[])
      : Math.max(...valid.filter(v => typeof v === 'number') as number[]);

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
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ phoneIds: [...phones.map(p => p.id), phone.id] })
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
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = createPhoneSlug(phone);
    router.push(APP_ROUTES.phoneDetail(brandSlug, modelSlug));
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowLabels(container.scrollLeft < 10);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const labelWidth = showLabels ? 110 : 48;
  const COLUMN_WIDTH = 140;

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <ButtonPressFeedback 
              onClick={() => router.push(APP_ROUTES.home)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} style={{ color: color.text }} />
              <span className="text-base font-bold" style={{ color: color.text }}>Back</span>
            </ButtonPressFeedback>

            <div className="flex items-center gap-2">
              <ButtonPressFeedback
                onClick={shareComparison}
                className="p-2 rounded-lg transition-all"
                style={linkCopied ? 
                  { backgroundColor: color.success, color: color.bg } : 
                  { backgroundColor: color.borderLight, color: color.text }
                }
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
              </ButtonPressFeedback>
              
              {phones.length > 0 && (
                <ButtonPressFeedback
                  onClick={clearAll}
                  className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ backgroundColor: color.borderLight, color: color.text }}
                >
                  Clear
                </ButtonPressFeedback>
              )}

              {phones.length < 4 && (
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-all"
                  style={{ backgroundColor: color.text, color: color.bg }}
                >
                  <Plus size={16} />
                  Add
                </ButtonPressFeedback>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: color.textMuted }}>
              Swipe → • Black = Winner • {phones.length}/4 phones
            </p>
          </div>
        </div>
      </div>
       
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto hide-scrollbar"
      >
        <div className="inline-block min-w-full">
          <div 
            className="flex sticky z-20 border-b"
            style={{ 
              backgroundColor: color.bg, 
              borderColor: color.borderLight,
              top: '0'
            }}
          >
            <div 
              className="sticky left-0 z-10 flex items-center justify-center border-r flex-shrink-0"
              style={{ 
                backgroundColor: color.bg,
                borderColor: color.borderLight,
                width: `${labelWidth}px`,
                transition: 'width 0.2s ease'
              }}
            >
              <span 
                className="text-xs font-bold uppercase tracking-wide transition-opacity duration-200"
                style={{ 
                  color: color.textMuted,
                  opacity: showLabels ? 1 : 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {showLabels && 'Specs'}
              </span>
            </div>

            {[0, 1, 2, 3].map((idx) => {
              const phone = phones[idx];

              return (
                <div 
                  key={idx}
                  className="flex-shrink-0 p-3 border-r relative"
                  style={{ 
                    borderColor: color.borderLight,
                    width: `${COLUMN_WIDTH}px`,
                    minWidth: `${COLUMN_WIDTH}px`
                  }}
                >
                  {phone ? (
                    <>
                      <ButtonPressFeedback
                        onClick={() => removePhone(phone.id)}
                        className="absolute top-2 right-2 p-1 rounded-full z-10"
                        style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
                      >
                        <X size={12} style={{ color: color.textMuted }} />
                      </ButtonPressFeedback>

                      <ButtonPressFeedback
                        onClick={() => handlePhoneClick(phone)}
                        className="w-full"
                      >
                        <div 
                          className="w-full h-24 rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: color.borderLight }}
                        >
                          {phone.main_image_url ? (
                            <img 
                              src={phone.main_image_url} 
                              alt={phone.model_name} 
                              className="w-full h-full object-contain p-2" 
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
                    </>
                  ) : (
                    <ButtonPressFeedback
                      onClick={() => setShowAddModal(true)}
                      className="w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6"
                      style={{ borderColor: color.border }}
                    >
                      <Plus size={24} style={{ color: color.textMuted }} />
                      <p className="text-[10px] font-bold mt-2" style={{ color: color.textMuted }}>Add</p>
                    </ButtonPressFeedback>
                  )}
                </div>
              );
            })}
          </div>

          {ROWS.map((row) => {
            const winner = getWinnerIdx(row);

            return (
              <div 
                key={row.label}
                className="flex border-b"
                style={{ borderColor: color.borderLight }}
              >
                <div 
                  className="sticky left-0 z-10 flex items-center gap-2 px-3 py-3 border-r flex-shrink-0"
                  style={{ 
                    backgroundColor: color.bg, 
                    borderColor: color.borderLight,
                    width: `${labelWidth}px`,
                    transition: 'width 0.2s ease'
                  }}
                >
                  <row.icon size={16} style={{ color: color.textMuted }} className="flex-shrink-0" />
                  <span 
                    className="text-[11px] font-bold truncate transition-opacity duration-200"
                    style={{ 
                      color: color.text,
                      opacity: showLabels ? 1 : 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {showLabels && row.label}
                  </span>
                </div>

                {[0, 1, 2, 3].map((idx) => {
                  const phone = phones[idx];
                  const isWinner = winner === idx;
                  const displayVal = phone ? row.fmt(phoneSpecs[idx], phone) : '';

                  return (
                    <div 
                      key={idx}
                      className="flex-shrink-0 px-2 py-3 flex items-center justify-center border-r"
                      style={{ 
                        borderColor: color.border,
                        backgroundColor: isWinner ? color.bgInverse : color.bg,
                        color: isWinner ? color.textInverse : color.text,
                        width: `${COLUMN_WIDTH}px`,
                        minWidth: `${COLUMN_WIDTH}px`
                      }}
                    >
                      <span className={`text-[11px] text-center ${isWinner ? 'font-bold' : 'font-semibold'}`}>
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
          <p className="text-xs font-bold mb-2" style={{ color: color.text }}>Legend</p>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color.bgInverse }} />
              <span style={{ color: color.textMuted }}>Winner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border" style={{ borderColor: color.border }} />
              <span style={{ color: color.textMuted }}>Standard</span>
            </div>
          </div>
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

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}