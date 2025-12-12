// app/components/mobile/MobileCompare.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Plus, X, Share2, Check, Smartphone,
  DollarSign, Cpu, Camera, Battery, Zap, Monitor, 
  Weight, Ruler, Calendar, Award, HardDrive, MemoryStick
} from 'lucide-react';
import { Phone } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { api } from '@/lib/api';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { color, font } from '@/lib/tokens';
import { createPhoneSlug } from '@/lib/config';
import AddPhoneModalMobile from './AddPhoneModalMobile';

interface MobileCompareProps {
  phones: Phone[];
  setComparePhones: (phones: Phone[]) => void;
  setView: (view: string) => void;
  setSelectedPhone: (phone: Phone) => void;
}

export default function MobileCompare({ 
  phones, 
  setComparePhones, 
  setView, 
  setSelectedPhone
}: MobileCompareProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const addPhone = async (phone: Phone) => {
    if (phones.length >= 4) return;
    
    try {
      // ✅ Fetch full phone details
      const fullPhone = await api.phones.getDetails(phone.id);
      
      if (isAuthenticated()) {
        fetch(`${API_BASE_URL}/comparisons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ 
            phoneIds: [...phones.map(p => p.id), fullPhone.id],
            comparisonName: `${phones.map(p => p.model_name).join(' vs ')} vs ${fullPhone.model_name}`
          })
        }).catch(console.error);
      }
      
      setComparePhones([...phones, fullPhone]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding phone:', error);
      alert('Failed to load phone details');
    }
  };

  const removePhone = (id: number) => {
    const updated = phones.filter(p => p.id !== id);
    if (updated.length === 0) {
      window.history.replaceState(null, '', window.location.pathname);
      setView('home');
    } else {
      setComparePhones(updated);
    }
  };

  const shareComparison = () => {
    const phoneNames = phones.map(p => 
      p.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    ).join('-vs-');
    const url = `${window.location.origin}${APP_ROUTES.compare([phoneNames])}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = createPhoneSlug(phone);
    window.location.href = APP_ROUTES.phoneDetail(brandSlug, modelSlug);
  };

  const getRefreshRate = (phone: Phone) => {
    const specs = phone.full_specifications?.specifications?.Display;
    if (!specs) return null;
    const typeStr = String(specs.Type || '');
    const match = typeStr.match(/(\d+)\s*Hz/i);
    return match ? parseInt(match[1]) : null;
  };

  const ROWS = [
    { label: 'Price', key: 'price_usd', icon: DollarSign, type: 'low_wins', fmt: (v: any) => v ? `$${v}` : '—' },
    { label: 'Chipset', key: 'chipset', icon: Cpu, type: 'flagship', fmt: (v: any) => v || '—' },
    { label: 'Camera', key: 'main_camera_mp', icon: Camera, type: 'high_wins', fmt: (v: any) => v ? `${v}MP` : '—' },
    { label: 'RAM', key: 'ram_options', icon: MemoryStick, type: 'high_wins', fmt: (v: any) => (v && v.length ? `${Math.max(...v)}GB` : '—') },
    { label: 'Storage', key: 'storage_options', icon: HardDrive, type: 'high_wins', fmt: (v: any) => (v && v.length ? `${Math.max(...v)}GB` : '—') },
    { label: 'Battery', key: 'battery_capacity', icon: Battery, type: 'high_wins', fmt: (v: any) => v ? `${v}mAh` : '—' },
    { label: 'Charging', key: 'fast_charging_w', icon: Zap, type: 'high_wins', fmt: (v: any) => v ? `${v}W` : '—' },
    { label: 'Screen', key: 'screen_size', icon: Monitor, type: 'high_wins', fmt: (v: any) => v ? `${v}"` : '—' },
    { label: 'Refresh', key: 'refresh_rate', icon: Monitor, type: 'high_wins', fmt: (v: any, phone: any) => { const hz = getRefreshRate(phone); return hz ? `${hz}Hz` : '—'; } },
    { label: 'Weight', key: 'weight_g', icon: Weight, type: 'low_wins', fmt: (v: any) => v ? `${v}g` : '—' },
    { label: 'Thickness', key: 'thickness_mm', icon: Ruler, type: 'low_wins', fmt: (v: any) => v ? `${v}mm` : '—' },
    { label: 'Year', key: 'release_year', icon: Calendar, type: 'high_wins', fmt: (v: any) => v || '—' },
    { label: 'AnTuTu', key: 'antutu_score', icon: Award, type: 'high_wins', fmt: (v: any) => v ? v.toLocaleString() : '—' },
  ];

  const getWinnerIdx = (row: any) => {
    if (row.type === 'flagship') {
      const flagshipChips = ['snapdragon 8', 'dimensity 9', 'exynos 2', 'apple a1', 'apple a2', 'tensor', 'snapdragon 8 elite', 'snapdragon 8 gen'];
      const scores = phones.map((p) => {
        const chipset = (p.chipset || '').toLowerCase();
        return flagshipChips.some(flag => chipset.includes(flag)) ? 1 : 0;
      });
      const maxScore = Math.max(...scores);
      if (maxScore === 0) return -1;
      const winners = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
      return winners.length === phones.length ? -1 : winners[0];
    }

    const raw = phones.map((p) => p[row.key]);
    const vals = raw.map((v) => (Array.isArray(v) && v.length ? Math.max(...v) : v));
    if (row.type === 'none') return -1;
    const valid = vals.filter((v) => v != null);
    if (valid.length < 2) return -1;
    const unique = new Set(valid);
    if (unique.size === 1) return -1;

    let bestVal;
    if (row.type === 'low_wins') bestVal = Math.min(...valid);
    else bestVal = Math.max(...valid);

    const bestIndices: number[] = [];
    vals.forEach((v, i) => {
      if (v === bestVal) bestIndices.push(i);
    });

    return bestIndices.length === phones.length ? -1 : bestIndices[0];
  };

  // ✅ Handle scroll to show/hide labels
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowLabels(container.scrollLeft < 10);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <ButtonPressFeedback 
              onClick={() => {
                window.history.replaceState(null, '', window.location.pathname);
                setView('home');
              }}
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
              
              <ButtonPressFeedback
                onClick={() => {
                  setComparePhones([]);
                  window.history.replaceState(null, '', window.location.pathname);
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ backgroundColor: color.borderLight, color: color.text }}
              >
                Clear
              </ButtonPressFeedback>

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
              Swipe to compare • Black = Winner • {phones.length}/4 phones
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Unified Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto hide-scrollbar"
      >
        <div className="inline-block min-w-full">
          {/* Phone Cards Row */}
          <div 
            className="flex sticky top-[73px] z-20 border-b"
            style={{ 
              backgroundColor: color.bg, 
              borderColor: color.borderLight,
              paddingLeft: showLabels ? '120px' : '56px',
              transition: 'padding-left 0.3s ease'
            }}
          >
            {/* Specs Label Placeholder */}
            <div 
              className="sticky left-0 z-10 flex items-center justify-center border-r"
              style={{ 
                backgroundColor: color.bg,
                borderColor: color.borderLight,
                width: showLabels ? '120px' : '56px',
                transition: 'width 0.3s ease',
                marginLeft: showLabels ? '-120px' : '-56px'
              }}
            >
              <span 
                className="text-xs font-bold uppercase tracking-wide transform origin-left transition-all duration-300"
                style={{ 
                  color: color.textMuted,
                  opacity: showLabels ? 1 : 0,
                  transform: showLabels ? 'scale(1)' : 'scale(0.8)'
                }}
              >
                {showLabels && 'Specs'}
              </span>
            </div>

            {/* Phone Cards */}
            {phones.map((phone) => (
              <div 
                key={phone.id}
                className="w-[140px] flex-shrink-0 p-3 border-r relative"
                style={{ borderColor: color.borderLight }}
              >
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
              </div>
            ))}

            {/* Add Phone Card */}
            {phones.length < 4 && (
              <div className="w-[140px] flex-shrink-0 p-3">
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6"
                  style={{ borderColor: color.border }}
                >
                  <Plus size={24} style={{ color: color.textMuted }} />
                  <p className="text-[10px] font-bold mt-2" style={{ color: color.textMuted }}>Add</p>
                </ButtonPressFeedback>
              </div>
            )}
          </div>

          {/* ✅ Specs Rows */}
          {ROWS.map((row) => {
            const winner = getWinnerIdx(row);

            return (
              <div 
                key={row.label}
                className="flex border-b"
                style={{ 
                  borderColor: color.borderLight,
                  paddingLeft: showLabels ? '120px' : '56px',
                  transition: 'padding-left 0.3s ease'
                }}
              >
                {/* Spec Label */}
                <div 
                  className="sticky left-0 z-10 flex items-center gap-2 px-3 py-3 border-r"
                  style={{ 
                    backgroundColor: color.bg, 
                    borderColor: color.borderLight,
                    width: showLabels ? '120px' : '56px',
                    transition: 'width 0.3s ease',
                    marginLeft: showLabels ? '-120px' : '-56px'
                  }}
                >
                  <row.icon size={16} style={{ color: color.textMuted }} className="flex-shrink-0" />
                  <span 
                    className="text-xs font-bold truncate transform origin-left transition-all duration-300"
                    style={{ 
                      color: color.text,
                      opacity: showLabels ? 1 : 0,
                      transform: showLabels ? 'scale(1)' : 'scale(0.8)',
                      width: showLabels ? 'auto' : '0',
                    }}
                  >
                    {showLabels && row.label}
                  </span>
                </div>

                {/* Spec Values */}
                {phones.map((phone, idx) => {
                  const isWinner = winner === idx;
                  const rawVal = phone[row.key];
                  const displayVal = row.fmt(rawVal, phone);

                  return (
                    <div 
                      key={phone.id}
                      className="w-[140px] flex-shrink-0 px-2 py-3 flex items-center justify-center border-r"
                      style={{ 
                        borderColor: color.border,
                        backgroundColor: isWinner ? color.bgInverse : color.bg,
                        color: isWinner ? color.textInverse : color.text
                      }}
                    >
                      <span className={`text-[11px] text-center ${isWinner ? 'font-bold' : 'font-semibold'}`}>
                        {displayVal}
                      </span>
                    </div>
                  );
                })}

                {/* Empty Cell for Add Button */}
                {phones.length < 4 && (
                  <div className="w-[140px] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
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
        <AddPhoneModalMobile
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map((p) => p.id)}
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