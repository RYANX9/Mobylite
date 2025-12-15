// app\components\desktop\DesktopCompare.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Search, GitCompare, Share2, Info, Check, RefreshCw } from 'lucide-react';
import { Phone } from '@/lib/types';
import { CleanSpec, extractCleanSpecs } from '@/lib/cleanSpecExtractor';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { api } from '@/lib/api';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { Tooltip } from '@/app/components/shared/Tooltip';
import { UserMenu } from './UserMenu';
import { color, font } from '@/lib/tokens';
import { Smartphone } from 'lucide-react';
import { createPhoneSlug } from '@/lib/config';
import AddPhoneModalDesktop from './AddPhoneModalDesktop';

interface DesktopCompareProps {
  phones: Phone[];
  setComparePhones: (phones: Phone[]) => void;
  setView: (view: string) => void;
  setSelectedPhone: (phone: Phone) => void;
}

export default function DesktopCompare({
  phones,
  setComparePhones,
  setView,
  setSelectedPhone,
}: DesktopCompareProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const loadPhonesFromURL = async (ids: number[]) => {
    try {
      const phonePromises = ids.map(id => fetch(`${API_BASE_URL}/phones/${id}`).then(res => res.json()));
      const loadedPhones = await Promise.all(phonePromises);
      const validPhones = loadedPhones.filter(p => p && p.id);
      if (validPhones.length > 0) {
        setComparePhones(validPhones);
      } else {
        setView('home');
      }
    } catch (error) {
      console.error('Error loading phones from URL:', error);
      setView('home');
    }
  };

  const loadPhonesFromNames = async (phoneNames: string[]) => {
    try {
      const phonePromises = phoneNames.map(async (slug) => {
        const searchTerm = slug.replace(/-/g, ' ');
        const data = await api.phones.search({ q: searchTerm, page_size: 1 });
        if (data.results && data.results.length > 0) {
          return await api.phones.getDetails(data.results[0].id);
        }
        return null;
      });
      const loadedPhones = await Promise.all(phonePromises);
      const validPhones = loadedPhones.filter(p => p && p.id);
      if (validPhones.length > 0) {
        setComparePhones(validPhones);
      } else {
        setView('home');
      }
    } catch (error) {
      console.error('Error loading phones from names:', error);
      setView('home');
    }
  };

  const addPhone = async (phone: Phone) => {
    if (phones.length >= 4) return;
    try {
      // ✅ Fetch full phone details first
      const fullPhone = await api.phones.getDetails(phone.id);

      if (isAuthenticated()) {
        fetch(`${API_BASE_URL}/comparisons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            phoneIds: [...phones.map(p => p.id), fullPhone.id],
            comparisonName: `${phones.map(p => p.model_name).join(' vs ')} vs ${fullPhone.model_name}`
          })
        }).catch(console.error);
      }

      // ✅ Use fresh array to avoid stale state
      const newPhones = [...phones, fullPhone];
      setComparePhones(newPhones);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding phone:', error);
      alert('Failed to load phone details');
    }
  };

  const removePhone = (id: number) => {
    const updated = phones.filter(p => p.id !== id);
    setComparePhones(updated);
    // ✅ This will trigger URL update in page.tsx
  };

  const shareComparison = () => {
    const phoneNames = phones.map(p => p.model_name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    ).join('-vs-');
    const url = `${window.location.origin}${APP_ROUTES.compare([phoneNames])}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = phone.model_name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    router.push(`/${brandSlug}/${modelSlug}`);
  };

  const phoneSpecs = phones.map((phone) => extractCleanSpecs(phone));

  function findSpec(specs: CleanSpec[], icon: string, matcher?: (spec: CleanSpec) => boolean): string {
    const spec = specs.find(s => s.icon === icon && (matcher ? matcher(s) : true));
    return spec ? spec.value : '—';
  }

  interface Row {
    label: string;
    type: 'high_wins' | 'low_wins' | 'flagship' | 'none';
    tooltip?: { layman: string; nerd: string };
    fmt: (specs: CleanSpec[], phone: Phone) => string;
    parse: (value: string) => number | string | null;
  }

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
      tooltip: { layman: 'Brain of the phone - flagship processors win', nerd: 'System on Chip processor' },
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
      label: 'Display Refresh',
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
      tooltip: { layman: 'How bright the screen can get', nerd: 'Maximum brightness in nits (HBM/peak/typ)' },
      fmt: (specs) => findSpec(specs, "☀️"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null,
    },
    {
      label: 'Main Camera',
      type: 'high_wins',
      tooltip: { layman: 'Photo quality in megapixels', nerd: 'Main sensor resolution' },
      fmt: (specs) => findSpec(specs, "📷", (s) => s.label.includes('MP')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Ultrawide Camera',
      type: 'high_wins',
      tooltip: { layman: 'Wide-angle lens resolution', nerd: 'Ultrawide sensor resolution' },
      fmt: (specs) => findSpec(specs, "📸", (s) => s.label.includes('MP')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Telephoto Camera',
      type: 'high_wins',
      tooltip: { layman: 'Zoom lens resolution', nerd: 'Telephoto/periscope sensor resolution' },
      fmt: (specs) => findSpec(specs, "🔭", (s) => s.label.includes('MP')),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Optical Zoom',
      type: 'high_wins',
      tooltip: { layman: 'How much optical zoom', nerd: 'Optical zoom factor' },
      fmt: (specs) => findSpec(specs, "🔍"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)x/)?.[1]) ?? null,
    },
    {
      label: 'Front Camera',
      type: 'high_wins',
      tooltip: { layman: 'Selfie camera resolution', nerd: 'Front sensor resolution' },
      fmt: (specs) => findSpec(specs, "🤳"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)MP/)?.[1]) ?? null,
    },
    {
      label: 'Battery',
      type: 'high_wins',
      tooltip: { layman: 'How long the battery lasts', nerd: 'Li-Po/Li-Ion capacity in mAh' },
      fmt: (specs) => findSpec(specs, "🔋"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)/)?.[1]) ?? null,
    },
    {
      label: 'Fast Charging',
      type: 'high_wins',
      tooltip: { layman: 'How fast it charges', nerd: 'Max wired charging power in watts' },
      fmt: (specs) => findSpec(specs, "⚡"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)W/)?.[1]) ?? null,
    },
    {
      label: 'RAM',
      type: 'high_wins',
      tooltip: { layman: 'Memory for running apps', nerd: 'Maximum LPDDR RAM capacity' },
      fmt: (specs) => findSpec(specs, "💾"),
      parse: (v) => v === '—' ? null : Number(v.match(/(\d+)GB/)?.[1]) ?? null,
    },
    {
      label: 'Storage',
      type: 'high_wins',
      tooltip: { layman: 'Space for apps and files', nerd: 'Maximum UFS storage capacity' },
      fmt: (specs) => findSpec(specs, "📂"),
      parse: (v) => v === '—' ? null : Math.max(...(v.match(/\d+/g) || []).map(Number)),
    },
    {
      label: 'Frame Material',
      type: 'high_wins',
      tooltip: { layman: 'Material of the frame - Titanium wins', nerd: 'Frame build material' },
      fmt: (specs) => findSpec(specs, "🏗️"),
      parse: (v) => v === '—' ? null : v.includes('Titanium') ? 4 : v.includes('Aluminum') ? 3 : v.includes('Steel') ? 2 : v.includes('Plastic') ? 1 : 0,
    },
    {
      label: 'Wi-Fi',
      type: 'high_wins',
      tooltip: { layman: 'Wi-Fi standard - higher version wins', nerd: 'Wi-Fi protocol support' },
      fmt: (specs) => findSpec(specs, "📡"),
      parse: (v) => v === '—' ? null : ({ 'Wi-Fi 7': 7, 'Wi-Fi 6E': 6.5, 'Wi-Fi 6': 6, 'Wi-Fi 5': 5, 'Wi-Fi': 4 }[v] || 0),
    },
    {
      label: 'Dimensions',
      type: 'none',
      tooltip: { layman: 'Phone size and weight', nerd: 'Dimensions and weight' },
      fmt: (specs) => findSpec(specs, "📏"),
      parse: (v) => null,
    },
    {
      label: 'Weight',
      type: 'low_wins',
      tooltip: { layman: 'How heavy the phone is', nerd: 'Total device weight in grams' },
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
      tooltip: { layman: 'How thin the phone is', nerd: 'Device thickness in millimeters' },
      fmt: (specs, phone) => {
        const v = findSpec(specs, "📏");
        if (v.includes('x')) {
          const parts = v.split(' x ');
          if (parts.length === 3) {
            return parts[2].replace(' mm', '') + 'mm';
          }
        }
        return phone.thickness_mm ? `${phone.thickness_mm}mm` : '—';
      },
      parse: (v) => v === '—' ? null : parseFloat(v.replace('mm', '')),
    },
    {
      label: 'Release Year',
      type: 'high_wins',
      tooltip: { layman: 'When it was released', nerd: 'Year of market release' },
      fmt: (specs, phone) => phone.release_year || '—',
      parse: (v) => v === '—' ? null : Number(v),
    },
    {
      label: 'AnTuTu Score',
      type: 'high_wins',
      tooltip: { layman: 'Performance benchmark', nerd: 'AnTuTu v10 benchmark score' },
      fmt: (specs, phone) => phone.antutu_score ? phone.antutu_score.toLocaleString() : '—',
      parse: (v) => v === '—' ? null : Number(v.replace(/,/g, '')),
    },
    {
      label: 'Special Features',
      type: 'high_wins',
      tooltip: { layman: 'Extra unique features', nerd: 'Brand-specific extras like S Pen or Satellite SOS' },
      fmt: (specs) => {
        const specials = specs.filter(s => ['🔘', '📷', '✏️', '🛰️'].includes(s.icon) && !s.label.includes('MP'));
        return specials.map(s => s.label).join(', ') || '—';
      },
      parse: (v) => v === '—' ? null : v.split(', ').length,
    },
  ];

  const getWinnerIdx = (row: Row) => {
    if (row.type === 'none') return -1;

    const parsed = phones.map((phone, i) => row.parse(row.fmt(phoneSpecs[i], phone)));

    if (row.type === 'flagship') {
      const scores = parsed.map(p => {
        const chipset = (p as string || '').toLowerCase();
        const isFlagship = flagshipChips.some(flag => chipset.includes(flag));
        return isFlagship ? 1 : 0;
      });
      const maxScore = Math.max(...scores);
      if (maxScore === 0) return -1;
      const bestIndices: number[] = [];
      scores.forEach((s, i) => {
        if (s === maxScore) bestIndices.push(i);
      });
      if (bestIndices.length === phones.length) return -1;
      return bestIndices[0];
    }

    const vals = parsed as (number | null)[];
    const valid = vals.filter((v): v is number => v != null);
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

  const containerBgStyle: React.CSSProperties = {
    backgroundColor: color.bg,
  };

  const heroBgStyle: React.CSSProperties = {
    backgroundColor: color.bgInverse,
  };

  const headerBgStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    borderColor: color.borderLight,
  };

  const headerShadowStyle: React.CSSProperties = {
    boxShadow: 'none',
  };

  const thBgStyle: React.CSSProperties = {
    backgroundColor: color.bg,
  };

  const tdBorderStyle = (isWinner: boolean, isEqual: boolean): React.CSSProperties => ({
    borderColor: color.border,
    backgroundColor: isWinner ? color.bgInverse : (isEqual ? color.bg : color.bg),
    color: isWinner ? color.textInverse : color.text,
  });

  return (
    <div className="min-h-screen" style={containerBgStyle}>
      <div
        className={`sticky top-0 z-30 border-b transition-all ${
          phones.length > 0 ? 'shadow-lg' : ''
        }`}
        style={{ ...headerBgStyle, ...(phones.length > 0 ? headerShadowStyle : {}) }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <ButtonPressFeedback
              onClick={() => setView('home')}
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
                    window.history.replaceState(null, '', window.location.pathname);
                    setView('home');
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
            <UserMenu />
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
                onClick={() => {
                  setComparePhones([]);
                  // ✅ This will trigger URL update in page.tsx
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{ backgroundColor: color.borderLight, color: color.text }}
                hoverStyle={{ backgroundColor: color.border }}
              >
                <RefreshCw size={16} style={{ color: color.text }} />
                <span className="text-xs font-bold">Start Over</span>
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
      <div className="border-b" style={heroBgStyle}>
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
                Compare specifications side-by-side • Black highlights the winner
              </p>
            </div>
            <div className="text-center rounded-2xl px-10 py-6 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
              <div className="text-5xl font-bold mb-2" style={{ fontFamily: font.numeric, color: color.text }}>
                {phones.length}/4
              </div>
              <div className="text-sm font-medium" style={{ color: color.textMuted }}>Phones Selected</div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="overflow-x-auto">
          <table className="w-full border-2 rounded-2xl overflow-hidden" style={{ borderColor: color.border, backgroundColor: color.bg }}>
            <thead>
              <tr style={thBgStyle}>
                <th className="border-r-2 p-6 text-left w-56 sticky left-0 z-10" style={{ borderColor: color.border, backgroundColor: color.bg }}>
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
                    Specification
                  </span>
                </th>
                {phones.map((phone) => (
                  <th key={phone.id} className="border-r-2 p-6 relative min-w-[240px]" style={{ borderColor: color.border, backgroundColor: color.bg }}>
                    <ButtonPressFeedback
                      onClick={() => removePhone(phone.id)}
                      className="absolute top-4 right-4 p-2 rounded-full transition-all shadow-sm border"
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
                        <p className="text-base font-bold leading-tight mb-3 px-2" style={{ color: color.text }}>
                          {phone.model_name}
                        </p>
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
                  <th className="border-r-2 p-6 min-w-[240px]" style={{ borderColor: color.border, backgroundColor: color.bg }}>
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
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {ALL_ROWS.map((row) => {
                const winner = getWinnerIdx(row);
                const parsed = phones.map((phone, i) => row.parse(row.fmt(phoneSpecs[i], phone)));
                const valid = parsed.filter(v => v != null);
                const unique = new Set(valid);
                const isEqual = unique.size === 1 && valid.length > 1;
                return (
                  <tr key={row.label} className="border-t-2" style={{ borderColor: color.border }}>
                    <td className="border-r-2 p-5 sticky left-0 z-10" style={{ borderColor: color.border, backgroundColor: color.bg }}>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold" style={{ color: color.text }}>
                          {row.label}
                        </span>
                        {row.tooltip && (
                          <Tooltip term={row.label} layman={row.tooltip.layman} nerd={row.tooltip.nerd} />
                        )}
                      </div>
                    </td>
                    {phones.map((phone, idx) => {
                      const isWinner = winner === idx;
                      const displayVal = row.fmt(phoneSpecs[idx], phone);
                      return (
                        <td
                          key={phone.id}
                          className="border-r-2 p-5 transition-all"
                          style={tdBorderStyle(isWinner, isEqual)}
                        >
                          <span className={`block text-center text-sm ${isWinner ? 'font-bold' : 'font-semibold'}`}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    })}
                    {phones.length < 4 && (
                      <td className="border-r-2 p-5" style={{ borderColor: color.border, backgroundColor: color.bg }}></td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl p-6 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.text }}>
                <GitCompare size={20} style={{ color: color.bg }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: color.text }}>How it works</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: color.textMuted }}>
              Black highlights show the best value for each spec. Lower is better for price, weight, and thickness. Higher is better for everything else. Flagship chipsets win automatically.
            </p>
          </div>
          <div className="rounded-xl p-6 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.text }}>
                <Share2 size={20} style={{ color: color.bg }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: color.text }}>Share Comparison</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: color.textMuted }}>
              Click Share to copy a link. Anyone with the link can view this exact comparison. The URL updates automatically as you add or remove phones.
            </p>
          </div>
          <div className="rounded-xl p-6 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.text }}>
                <Info size={20} style={{ color: color.bg }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: color.text }}>Need more details?</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: color.textMuted }}>
              Click any phone name or image to see full specifications, reviews, and detailed camera info. This table shows key specs for quick comparison.
            </p>
          </div>
        </div>
      </div>
      {showAddModal && (
        <AddPhoneModalDesktop
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map((p) => p.id)}
        />
      )}
    </div>
  );
}
