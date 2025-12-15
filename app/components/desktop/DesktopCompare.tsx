// app/components/desktop/DesktopCompare.tsx
'use client';
import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Search, GitCompare, Share2, Info, Check, RefreshCw } from 'lucide-react';
import { Phone } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { api } from '@/lib/api';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { Tooltip } from '@/app/components/shared/Tooltip';
import { UserMenu } from './UserMenu';
import { color, font } from '@/lib/tokens';
import { Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddPhoneModalDesktop from './AddPhoneModalDesktop';

interface DesktopCompareProps {
  phones: Phone[];
  setComparePhones: (phones: Phone[]) => void;
  setView: (view: string) => void;
  setSelectedPhone: (phone: Phone) => void;
}

export default function DesktopCompare({ phones, setComparePhones, setView, setSelectedPhone }: DesktopCompareProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const addPhone = async (phone: Phone) => {
    if (phones.length >= 4) return;
    
    try {
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
  };

  const shareComparison = () => {
    const phoneNames = phones.map(p => 
      p.model_name
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

  const extractDisplayType = (phone: Phone) => {
    const displayType = phone.full_specifications?.quick_specs?.displaytype || '';
    const match = displayType.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
    const refreshMatch = displayType.match(/(\d+)Hz/);
    
    const type = match ? match[0] : 'OLED';
    const refresh = refreshMatch ? ` (${refreshMatch[1]}Hz)` : '';
    
    return `${type}${refresh}`;
  };

  const extractBrightness = (phone: Phone) => {
    const displayType = phone.full_specifications?.quick_specs?.displaytype || '';
    
    const hbmMatch = displayType.match(/(\d+)\s*nits\s*\(HBM\)/i);
    if (hbmMatch) return parseInt(hbmMatch[1]);
    
    const peakMatch = displayType.match(/(\d+)\s*nits\s*\(peak\)/i);
    if (peakMatch) return parseInt(peakMatch[1]);
    
    return null;
  };

  const extractCameras = (phone: Phone) => {
    const cam1modules = phone.full_specifications?.quick_specs?.cam1modules || '';
    const cameras: Array<{mp: number, type: string, aperture: string}> = [];
    const cameraLines = cam1modules.split(/\r?\n/).filter(line => line.trim());
    
    cameraLines.forEach((line) => {
      const mpMatch = line.match(/(\d+)\s*MP/i);
      const apertureMatch = line.match(/f\/([0-9.]+)/i);
      const typeMatch = line.match(/\((wide|ultrawide|ultra wide|telephoto|periscope|macro)\)/i);
      
      if (mpMatch && apertureMatch && typeMatch) {
        cameras.push({
          mp: parseInt(mpMatch[1]),
          type: typeMatch[1],
          aperture: apertureMatch[1]
        });
      }
    });
    
    return cameras;
  };

  const extractOpticalZoom = (phone: Phone) => {
    const cam1modules = phone.full_specifications?.quick_specs?.cam1modules || '';
    const zoomMatch = cam1modules.match(/(\d+)x\s*optical\s*zoom/i);
    return zoomMatch ? parseInt(zoomMatch[1]) : null;
  };

  const extractFrontCamera = (phone: Phone) => {
    const cam2modules = phone.full_specifications?.quick_specs?.cam2modules || '';
    const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
    const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
    
    if (mpMatch && apertureMatch) {
      return { mp: parseInt(mpMatch[1]), aperture: apertureMatch[1] };
    }
    return null;
  };

  const extractFrameMaterial = (phone: Phone) => {
    const build = phone.full_specifications?.specifications?.Body?.Build || '';
    
    if (/titanium/i.test(build)) {
      const gradeMatch = build.match(/Grade\s+(\d+)/i);
      return gradeMatch ? `Titanium Frame (Grade ${gradeMatch[1]})` : 'Titanium Frame';
    }
    if (/aluminum|aluminium/i.test(build)) return 'Aluminum Frame';
    if (/steel/i.test(build)) return 'Steel Frame';
    if (/plastic/i.test(build)) return 'Plastic Frame';
    
    return null;
  };

  const extractWiFi = (phone: Phone) => {
    const wlan = phone.full_specifications?.quick_specs?.wlan || '';
    
    if (/Wi-Fi\s*7/i.test(wlan) || /802\.11be/i.test(wlan)) return 7;
    if (/Wi-Fi\s*6[eE]/i.test(wlan)) return 6.5;
    if (/Wi-Fi\s*6/i.test(wlan) || /802\.11ax/i.test(wlan)) return 6;
    if (/802\.11ac/i.test(wlan)) return 5;
    
    return null;
  };

  const extractAIFeature = (phone: Phone) => {
    const brand = phone.brand.toLowerCase();
    if (brand.includes('google')) return 'Google AI';
    if (brand.includes('apple')) return 'Apple Intelligence';
    if (brand.includes('samsung')) return 'Galaxy AI';
    if (brand.includes('xiaomi')) return 'Xiaomi HyperOS AI';
    return null;
  };

  const ALL_ROWS = [
    { 
      label: 'Price', 
      type: 'low_wins', 
      getValue: (p: Phone) => p.price_usd,
      format: (v: any) => v ? `$${v}` : '—',
      tooltip: { layman: 'Total cost to buy the phone', nerd: 'MSRP at launch in USD' }
    },
    { 
      label: 'Display Size & Tech', 
      type: 'none', 
      getValue: (p: Phone) => `${p.screen_size}" ${extractDisplayType(p)}`,
      format: (v: any) => v || '—',
      tooltip: { layman: 'Screen size and display technology', nerd: 'Display diagonal and panel type' }
    },
    { 
      label: 'Display Brightness', 
      type: 'high_wins', 
      getValue: (p: Phone) => extractBrightness(p),
      format: (v: any) => v ? `${v} nits (HBM)` : '—',
      tooltip: { layman: 'How bright the screen gets outdoors', nerd: 'Peak brightness in nits' }
    },
    { 
      label: 'Chipset', 
      type: 'flagship', 
      getValue: (p: Phone) => p.chipset,
      format: (v: any) => v || '—',
      tooltip: { layman: 'Brain of the phone - flagship processors win', nerd: 'System on Chip processor' }
    },
    { 
      label: 'Main Camera', 
      type: 'none', 
      getValue: (p: Phone) => {
        const cameras = extractCameras(p);
        return cameras[0] ? `${cameras[0].mp}MP (Wide, f/${cameras[0].aperture})` : null;
      },
      format: (v: any) => v || '—',
      tooltip: { layman: 'Primary camera quality', nerd: 'Main sensor specs' }
    },
    { 
      label: 'Ultra Wide Camera', 
      type: 'none', 
      getValue: (p: Phone) => {
        const cameras = extractCameras(p);
        const ultraWide = cameras.find(c => c.type.toLowerCase().includes('ultra'));
        return ultraWide ? `${ultraWide.mp}MP (Ultra Wide, f/${ultraWide.aperture})` : null;
      },
      format: (v: any) => v || '—',
      tooltip: { layman: 'Wide-angle camera for landscapes', nerd: 'Ultra-wide sensor specs' }
    },
    { 
      label: 'Telephoto Camera', 
      type: 'none', 
      getValue: (p: Phone) => {
        const cameras = extractCameras(p);
        const telephoto = cameras.find(c => c.type.toLowerCase().includes('tele') || c.type.toLowerCase().includes('periscope'));
        return telephoto ? `${telephoto.mp}MP (${telephoto.type.includes('periscope') ? 'Periscope' : 'Telephoto'})` : null;
      },
      format: (v: any) => v || '—',
      tooltip: { layman: 'Zoom camera for distant subjects', nerd: 'Telephoto/periscope sensor' }
    },
    { 
      label: 'Optical Zoom', 
      type: 'high_wins', 
      getValue: (p: Phone) => extractOpticalZoom(p),
      format: (v: any) => v ? `${v}x Optical Zoom` : '—',
      tooltip: { layman: 'How much you can zoom without quality loss', nerd: 'Maximum optical zoom factor' }
    },
    { 
      label: 'Front Camera', 
      type: 'high_wins', 
      getValue: (p: Phone) => {
        const front = extractFrontCamera(p);
        return front ? front.mp : null;
      },
      format: (v: any, p: Phone) => {
        const front = extractFrontCamera(p);
        return front ? `${front.mp}MP (f/${front.aperture}) Front` : '—';
      },
      tooltip: { layman: 'Selfie camera quality', nerd: 'Front-facing camera specs' }
    },
    { 
      label: 'Battery', 
      type: 'high_wins', 
      getValue: (p: Phone) => p.battery_capacity,
      format: (v: any) => v ? `${v} mAh Battery` : '—',
      tooltip: { layman: 'How long the battery lasts', nerd: 'Li-Po/Li-Ion capacity in mAh' }
    },
    { 
      label: 'RAM', 
      type: 'high_wins', 
      getValue: (p: Phone) => p.ram_options?.[0],
      format: (v: any) => v ? `${v}GB RAM` : '—',
      tooltip: { layman: 'Memory for running apps', nerd: 'LPDDR RAM capacity' }
    },
    { 
      label: 'Storage Options', 
      type: 'none', 
      getValue: (p: Phone) => p.storage_options?.join('/'),
      format: (v: any) => v ? `${v}GB` : '—',
      tooltip: { layman: 'Space for apps and files', nerd: 'UFS storage variants' }
    },
    { 
      label: 'Frame Material', 
      type: 'none', 
      getValue: (p: Phone) => extractFrameMaterial(p),
      format: (v: any) => v || '—',
      tooltip: { layman: 'What the frame is made of', nerd: 'Frame construction material' }
    },
    { 
      label: 'Wi-Fi', 
      type: 'high_wins', 
      getValue: (p: Phone) => extractWiFi(p),
      format: (v: any) => v ? `Wi-Fi ${v}` : '—',
      tooltip: { layman: 'Wireless internet generation', nerd: 'Wi-Fi standard version' }
    },
    { 
      label: 'AI Feature', 
      type: 'none', 
      getValue: (p: Phone) => extractAIFeature(p),
      format: (v: any) => v || '—',
      tooltip: { layman: 'AI assistant built-in', nerd: 'Manufacturer AI platform' }
    },
    { 
      label: 'Fast Charging', 
      type: 'high_wins', 
      getValue: (p: Phone) => p.fast_charging_w,
      format: (v: any) => v ? `${v}W` : '—',
      tooltip: { layman: 'How fast it charges', nerd: 'Max wired charging power in watts' }
    },
    { 
      label: 'Dimensions', 
      type: 'none', 
      getValue: (p: Phone) => p.full_specifications?.specifications?.Body?.Dimensions,
      format: (v: any) => v || '—',
      tooltip: { layman: 'Phone physical size', nerd: 'Length x Width x Thickness in mm' }
    },
    { 
      label: 'Weight', 
      type: 'low_wins', 
      getValue: (p: Phone) => p.weight_g,
      format: (v: any) => v ? `${v}g` : '—',
      tooltip: { layman: 'How heavy the phone is', nerd: 'Total device weight in grams' }
    },
    { 
      label: 'Thickness', 
      type: 'low_wins', 
      getValue: (p: Phone) => p.thickness_mm,
      format: (v: any) => v ? `${v}mm` : '—',
      tooltip: { layman: 'How thin the phone is', nerd: 'Device thickness in millimeters' }
    },
    { 
      label: 'Release Year', 
      type: 'high_wins', 
      getValue: (p: Phone) => p.release_year,
      format: (v: any) => v || '—',
      tooltip: { layman: 'When it was released', nerd: 'Year of market release' }
    },
    { 
      label: 'AnTuTu Score', 
      type: 'high_wins', 
      getValue: (p: Phone) => p.antutu_score,
      format: (v: any) => v ? v.toLocaleString() : '—',
      tooltip: { layman: 'Performance benchmark', nerd: 'AnTuTu v10 benchmark score' }
    },
  ];

  const getWinnerIdx = (row: any) => {
    if (row.type === 'none') return -1;
    
    if (row.type === 'flagship') {
      const flagshipChips = ['snapdragon 8', 'dimensity 9', 'exynos 2', 'apple a1', 'apple a2', 'tensor', 'snapdragon 8 elite', 'snapdragon 8 gen'];
      
      const scores = phones.map((p) => {
        const chipset = (p.chipset || '').toLowerCase();
        const isFlagship = flagshipChips.some(flag => chipset.includes(flag));
        return isFlagship ? 1 : 0;
      });
      
      const maxScore = Math.max(...scores);
      if (maxScore === 0) return -1;
      
      const winners = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
      return winners.length === phones.length ? -1 : winners[0];
    }

    const vals = phones.map((p) => row.getValue(p));
    const valid = vals.filter((v) => v != null && v !== '—');
    
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

  const tdBorderStyle = (isWinner: boolean): React.CSSProperties => ({
    borderColor: color.border,
    backgroundColor: isWinner ? color.bgInverse : color.bg,
    color: isWinner ? color.textInverse : color.text,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <div 
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <ButtonPressFeedback onClick={() => setView('home')} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
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
                style={linkCopied ? 
                  { backgroundColor: color.success, color: color.bg } : 
                  { backgroundColor: color.borderLight, color: color.text }
                }
              >
                {linkCopied ? <Check size={16} /> : <Share2 size={16} />}
                <span className="text-xs font-bold">{linkCopied ? 'Copied!' : 'Share'}</span>
              </ButtonPressFeedback>
              <ButtonPressFeedback
                onClick={() => setComparePhones([])}
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

      <div className="border-b" style={{ backgroundColor: color.bgInverse }}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: color.bg }}
                >
                  <GitCompare size={24} style={{ color: color.bgInverse }} />
                </div>
                <h1 
                  className="text-4xl font-bold tracking-tight"
                  style={{ fontFamily: font.primary, color: color.textInverse }}
                >
                  Phone Comparison
                </h1>
              </div>
              <p className="text-xl font-medium" style={{ color: color.textLight }}>
                Compare specifications side-by-side • Black highlights the winner
              </p>
            </div>
            <div 
              className="text-center rounded-2xl px-10 py-6 border"
              style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
            >
              <div 
                className="text-5xl font-bold mb-2"

                style={{ fontFamily: font.numeric, color: color.text }}
              >
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
                    <ButtonPressFeedback
                      onClick={() => handlePhoneClick(phone)}
                      className="w-full"
                    >
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
                const raw = phones.map((p) => p[row.key]);
                const vals = raw.map((v) => (Array.isArray(v) && v.length ? Math.max(...v) : v));
                const valid = vals.filter((v) => v != null);
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
                          <Tooltip 
                            term={row.label}
                            layman={row.tooltip.layman}
                            nerd={row.tooltip.nerd}
                          />
                        )}
                      </div>
                    </td>
                    {phones.map((phone, idx) => {
                      const isWinner = winner === idx;
                      const rawVal = phone[row.key];
                      const displayVal = row.fmt(rawVal, phone);
                      return (
                        <td key={phone.id} className="border-r-2 p-5 transition-all" style={tdBorderStyle(isWinner, isEqual)}>
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
