// app/components/mobile/MobileDetail.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Camera, Battery, Bolt, Smartphone, ArrowLeft, Heart, Maximize2, 
  Cpu, MemoryStick, HardDrive, Search, Monitor, Zap, 
  Video, Wifi, Weight, Ruler, Calendar, Award, Signal, Volume2, Info, Package, Bell,
  ChevronDown, ChevronUp, Star, Users, TrendingUp, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Phone, Favorite } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { api } from '@/lib/api';
import { cleanHTMLText } from '@/lib/utils';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { extractCleanSpecs } from '@/lib/cleanSpecExtractor';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { ReviewSection } from '@/app/components/shared/ReviewSection';
import { HorizontalPhoneScroll } from '@/app/components/shared/HorizontalPhoneScroll';
import { UserMenu } from '@/app/components/shared/UserMenu';
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal';
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel';
import MobyMonCard from '@/app/components/shared/MobyMonCard'; 
import { color, font } from '@/lib/tokens';
import { createPhoneSlug } from '@/lib/config';

interface MobileDetailProps {
  phone: Phone;
  initialReviews?: any[];
  initialStats?: any;
}

const ICON_MAP: Record<string, any> = {
  '📱': Maximize2,
  '☀️': Zap,
  '🔧': Cpu,
  '📷': Camera,
  '🔍': Search,
  '🤳': Camera,
  '🔋': Battery,
  '💾': MemoryStick,
  '📂': HardDrive,
  '🏗️': Package,
  '📡': Wifi,
  '⚡': Bolt,
  '📏': Ruler,
  '🔘': Info,
  '✏️': Info,
  '🛰️': Signal,
  '💰': Info,
  '📸': Camera,
  '🔭': Video,
  '🔬': Camera,
};

const SPEC_TOOLTIPS: Record<string, { layman: string; nerd: string }> = {
  'Display': { layman: 'Screen size and type', nerd: 'Display diagonal, resolution, and panel technology' },
  'Chipset': { layman: 'Brain of the phone', nerd: 'System on Chip processor' },
  'RAM': { layman: 'Memory for running apps', nerd: 'LPDDR5/5X RAM capacity' },
  'Storage': { layman: 'Space for files', nerd: 'UFS 3.1/4.0 storage' },
  'Camera': { layman: 'Photo quality', nerd: 'Main sensor resolution' },
  'Video': { layman: 'Video quality', nerd: 'Max video resolution' },
  'Battery': { layman: 'Battery life', nerd: 'Battery capacity' },
  'Charging': { layman: 'Charging speed', nerd: 'Max charging power' },
  'Weight': { layman: 'Device weight', nerd: 'Total weight in grams' },
  'AnTuTu': { layman: 'Performance score', nerd: 'AnTuTu benchmark' },
};

export default function MobileDetail({ phone, initialReviews, initialStats }: MobileDetailProps) {
  const router = useRouter();
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [similarPhones, setSimilarPhones] = useState<Phone[]>([]);
  const [alsoComparedWith, setAlsoComparedWith] = useState<Phone[]>([]);
  const [comparisonCounts, setComparisonCounts] = useState<{ [key: number]: number }>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneStats, setPhoneStats] = useState<any>(initialStats || null);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Launch', 'Body', 'Display']));
  const [expandedSpec, setExpandedSpec] = useState<number | null>(null);
  const [compareList, setCompareList] = useState<Phone[]>([]);
  const [showMobyMon, setShowMobyMon] = useState(false); 


  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated()) return;
      try {
        const data = await api.favorites.list();
        setIsFavorite(data.favorites?.some((f: Favorite) => f.phone_id === phone.id));
      } catch (error) {
        console.error('Failed to check favorite:', error);
      }
    };
    checkFavorite();
  }, [phone.id]);

  useEffect(() => {
    fetchSimilarPhones();
    fetchAlsoComparedWith();
    if (!initialStats) fetchPhoneStats();
    
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/history/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ phoneId: phone.id })
      }).catch(console.error);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phone]);

  const fetchPhoneStats = async () => {
    try {
      const data = await api.phones.getStats(phone.id);
      if (data.success) {
        setPhoneStats(data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching phone stats:', error);
      setPhoneStats({
        average_rating: 0,
        total_reviews: 0,
        total_favorites: 0
      });
    }
  };

  const fetchAlsoComparedWith = async () => {
    try {
      const result = await fetch(`${API_BASE_URL}/phones/${phone.id}/also-compared`);
      const data = await result.json();
      
      if (data.success && data.phones.length > 0) {
        setAlsoComparedWith(data.phones);
        setComparisonCounts(data.comparisonCounts || {});
      }
    } catch (error) {
      console.error('Error fetching also compared:', error);
    }
  };

  const fetchSimilarPhones = async () => {
    try {
      const params: any = { page_size: 30 };
      
      if (phone.price_usd) {
        params.min_price = Math.floor(phone.price_usd * 0.7);
        params.max_price = Math.ceil(phone.price_usd * 1.3);
      }
      
      if (phone.ram_options && phone.ram_options.length > 0) {
        params.min_ram = Math.max(Math.max(...phone.ram_options) - 2, 4);
      }
      
      if (phone.storage_options && phone.storage_options.length > 0) {
        params.min_storage = Math.max(Math.max(...phone.storage_options) / 2, 64);
      }
      
      if (phone.release_year) {
        params.min_year = phone.release_year - 1;
      }

      const data = await api.phones.search(params);
      
      const scoredPhones = (data.results || [])
        .filter((p: Phone) => p.id !== phone.id)
        .map((p: Phone) => {
          let score = 0;
          if (p.brand === phone.brand) score += 40;
          if (phone.price_usd && p.price_usd) {
            const priceDiff = Math.abs(phone.price_usd - p.price_usd);
            score += Math.max(0, 25 - (priceDiff / phone.price_usd) * 25);
          }
          if (phone.ram_options && p.ram_options && phone.ram_options.length && p.ram_options.length) {
            const ramDiff = Math.abs(Math.max(...phone.ram_options) - Math.max(...p.ram_options));
            if (ramDiff === 0) score += 15;
            else if (ramDiff <= 2) score += 10;
            else if (ramDiff <= 4) score += 5;
          }
          if (phone.battery_capacity && p.battery_capacity) {
            const batteryDiff = Math.abs(phone.battery_capacity - p.battery_capacity);
            if (batteryDiff <= 300) score += 10;
            else if (batteryDiff <= 500) score += 7;
            else if (batteryDiff <= 1000) score += 3;
          }
          if (phone.main_camera_mp && p.main_camera_mp) {
            const cameraDiff = Math.abs(phone.main_camera_mp - p.main_camera_mp);
            if (cameraDiff <= 10) score += 5;
            else if (cameraDiff <= 20) score += 3;
          }
          if (phone.release_year && p.release_year && phone.release_year === p.release_year) {
            score += 5;
          }
          return { ...p, similarityScore: score };
        })
        .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
        .slice(0, 12);

      setSimilarPhones(scoredPhones);
    } catch (error) {
      console.error('Error fetching similar phones:', error);
      setSimilarPhones([]);
    }
  };

  const handleCompareWithPhone = async (comparePhone: Phone) => {
    try {
      if (isAuthenticated()) {
        fetch(`${API_BASE_URL}/comparisons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ phoneIds: [phone.id, comparePhone.id] })
        }).catch(console.error);
      }
      
      const phoneSlugs = [phone, comparePhone].map(p => createPhoneSlug(p));
      router.push(APP_ROUTES.compare(phoneSlugs));
    } catch (error) {
      console.error('Error comparing phones:', error);
    }
  };

  const handlePhoneClick = (clickedPhone: Phone) => {
    const brandSlug = clickedPhone.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = createPhoneSlug(clickedPhone);
    router.push(APP_ROUTES.phoneDetail(brandSlug, modelSlug));
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated()) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('returnUrl', currentPath);
      
      if (confirm('Please login to add favorites. Go to login?')) {
        router.push(APP_ROUTES.login);
      }
      return;
    }

    try {
      if (isFavorite) {
        await api.favorites.remove(phone.id);
      } else {
        await api.favorites.add(phone.id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const cleanSpecs = extractCleanSpecs(phone);
  const simpleSpecs = cleanSpecs
    .filter(spec => !['Price'].includes(spec.label))
    .map(spec => {
      // Extract category name for camera specs
      let categoryLabel = spec.label;
      
      // Map camera types to their category names
      if (spec.label.includes('Wide') && !spec.label.includes('Ultrawide')) {
        categoryLabel = 'Main Camera';
      } else if (spec.label.includes('Ultrawide')) {
        categoryLabel = 'Ultrawide Camera';
      } else if (spec.label.includes('Telephoto') || spec.label.includes('Periscope')) {
        categoryLabel = 'Telephoto Camera';
      }
      
      const IconComponent = ICON_MAP[spec.icon] || Info;
      
      return {
        icon: IconComponent,
        label: categoryLabel,
        value: spec.value,
        tooltip: SPEC_TOOLTIPS[categoryLabel] || SPEC_TOOLTIPS[spec.label]
      };
    });

  const getIconForCategory = (category: string) => {
    const icons: { [key: string]: any } = {
      'Launch': Calendar,
      'Body': Package,
      'Display': Monitor,
      'Platform': Cpu,
      'Memory': MemoryStick,
      'Main Camera': Camera,
      'Selfie camera': Camera,
      'Selfie Camera': Camera,
      'Sound': Volume2,
      'Comms': Wifi,
      'Features': Zap,
      'Battery': Battery,
      'Misc': Info,
      'Network': Signal,
      'Our Tests': Award
    };
    return icons[category] || Info;
  };

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.map(v => cleanHTMLText(v)).join(', ');
    if (typeof value === 'object' && value.price_usd) return `$${value.price_usd}`;
    if (typeof value === 'object') return cleanHTMLText(JSON.stringify(value));
    return cleanHTMLText(value);
  };

  const fullSpecs = phone.full_specifications?.specifications || {};

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const toggleSpecExpansion = (index: number) => {
    setExpandedSpec(expandedSpec === index ? null : index);
  };

  const containerBgStyle: React.CSSProperties = { backgroundColor: color.bg };
  const navbarBgStyle: React.CSSProperties = { backgroundColor: color.bg, borderColor: color.borderLight };

  return (
    <div className="min-h-screen" style={containerBgStyle}>
      <div className="sticky top-0 z-40 border-b" style={navbarBgStyle}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <ButtonPressFeedback 
              onClick={() => router.push(APP_ROUTES.home)} 
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} style={{ color: color.text }} />
              <span className="text-base font-bold" style={{ color: color.text }}>Back</span>
            </ButtonPressFeedback>
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0 relative">
                <Search size={16} style={{ color: color.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-full text-sm font-medium focus:outline-none"
                  style={{ backgroundColor: color.borderLight, border: `1px solid ${color.border}`, color: color.text }}
                  placeholder="Search..."
                />
              </div>
              
              <ButtonPressFeedback
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isFavorite ? color.dangerBg : color.borderLight }}
              >
                <Heart 
                  size={20} 
                  style={{ color: isFavorite ? color.danger : color.textMuted }} 
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
              </ButtonPressFeedback>
              
              <UserMenu variant="mobile" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          <div 
            className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0"
            style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
          >
            {phone.main_image_url ? (
              <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-3" />
            ) : (
              <Smartphone size={40} style={{ color: color.textLight }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
              {phone.brand}
            </p>
            <h1 
              className="text-xl font-bold leading-tight mb-2 text-left"
              style={{ fontFamily: font.primary, color: color.text }}
            >
              {phone.model_name}
            </h1>
            
            {phone.price_usd && (
              <div className="mb-2 text-left">
                <p className="text-xs font-bold mb-1" style={{ color: color.textMuted }}>PRICE</p>
                <p 
                  className="text-lg font-bold"
                  style={{ fontFamily: font.numeric, color: color.text }}
                >
                  ${phone.price_usd.toLocaleString()}
                </p>
                {phone.price_original && phone.currency && (
                  <p className="text-xs" style={{ color: color.textMuted }}>
                    {phone.price_original} {phone.currency}
                  </p>
                )}
              </div>
            )}
            
            {phoneStats && (
              <div className="mb-1">
                {phoneStats.average_rating > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star size={14} style={{ color: color.primary }} fill={color.primary} />
                      <span className="text-xs font-bold" style={{ color: color.text }}>
                        {phoneStats.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: color.textMuted }}>
                      ({phoneStats.total_reviews.toLocaleString()} reviews)
                    </span>
                    {phoneStats.verified_owners_percentage > 0 && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: color.success }}>
                        <Users size={12} />
                        {Math.round((phoneStats.verified_owners_percentage / 100) * phoneStats.total_reviews)} owners
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px]" style={{ color: color.textMuted }}>No reviews yet</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {phone.amazon_link && (
          <ButtonPressFeedback onClick={() => window.open(phone.amazon_link, '_blank')} className="w-full mb-3">
            <div className="w-full py-4 text-center font-bold rounded-xl text-sm" style={{ backgroundColor: color.primary, color: color.primaryText }}>
              Buy on Amazon
            </div>
          </ButtonPressFeedback>
        )}
        
        <div className="flex gap-3">
        {/* ← ADD THIS MOBYMON BUTTON */}
        <ButtonPressFeedback
          onClick={() => setShowMobyMon(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          style={{ 
            background: '#0f0f0fff',
            color: '#FFFFFF'
          }}
        >
          <Sparkles size={18} />
          <span>MobyMon Card</span>
        </ButtonPressFeedback>

          
          <ButtonPressFeedback 
            onClick={() => setShowPriceAlert(true)}
            className={`${phone.brand_link ? 'flex-1' : 'w-full'} py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2`}
            style={{ backgroundColor: color.borderLight, color: color.text }}
          >
            <Bell size={16} />
            Set Price Alert
          </ButtonPressFeedback>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-xl font-bold"
            style={{ fontFamily: font.primary, color: color.text }}
          >
            Specifications
          </h2>
          <div 
            className="inline-flex p-1 rounded-full"
            style={{ backgroundColor: color.borderLight }}
          >
            <button
              onClick={() => setIsExpertMode(false)}
              className={`px-4 py-2 text-xs font-bold rounded-full ${!isExpertMode ? 'shadow-sm' : ''}`}
              style={!isExpertMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
            >
              SIMPLE
            </button>
            <button
              onClick={() => setIsExpertMode(true)}
              className={`px-4 py-2 text-xs font-bold rounded-full ${isExpertMode ? 'shadow-sm' : ''}`}
              style={isExpertMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
            >
              EXPERT
            </button>
          </div>
        </div>

        {!isExpertMode ? (
          <div className="grid grid-cols-2 gap-3">
            {simpleSpecs.map((spec, idx) => {
              const isExpanded = expandedSpec === idx;
              
              return (
                <div key={idx} className="rounded-xl overflow-hidden border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
                  <ButtonPressFeedback
                    onClick={() => {
                      if (spec.tooltip) {
                        toggleSpecExpansion(idx);
                      }
                    }}
                    className="w-full p-4 flex flex-col items-start text-left"
                  >
                    <div className="flex items-center gap-2 mb-2 w-full">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color.borderLight }}
                      >
                        <spec.icon size={16} style={{ color: color.text }} />
                      </div>
                      <span 
                        className="text-[11px] font-bold uppercase tracking-wide"
                        style={{ color: color.textMuted }}
                      >
                        {spec.label}
                      </span>
                    </div>
                    <p 
                      className="text-sm font-bold leading-snug text-left"
                      style={{ color: color.text }}
                    >
                      {spec.value}
                    </p>
                  </ButtonPressFeedback>
                  
                  {isExpanded && spec.tooltip && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: color.borderLight }}>
                      <div className="mt-3 space-y-3 text-left">
                        <div>
                          <p className="text-xs font-bold mb-1" style={{ color: color.text }}>What it means</p>
                          <p className="text-xs" style={{ color: color.textMuted }}>{spec.tooltip.layman}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold mb-1" style={{ color: color.text }}>Technical details</p>
                          <p className="text-xs" style={{ color: color.textMuted }}>{spec.tooltip.nerd}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const categoryOrder = [
                'Launch','Body', 'Display', 'Platform', 'Memory', 'Main Camera', 
                'Selfie camera','Battery', 'Comms', 'Sound', 
                'Features',  'Network', 'Misc',  'Our Tests'
              ];
              
              const sortedEntries = Object.entries(fullSpecs).sort(([catA], [catB]) => {
                const indexA = categoryOrder.indexOf(catA);
                const indexB = categoryOrder.indexOf(catB);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
              
              return sortedEntries.map(([category, specs]) => {
                const CategoryIcon = getIconForCategory(category);
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div 
                    key={category} 
                    className="rounded-xl overflow-hidden border"
                    style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
                  >
                    <ButtonPressFeedback
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 flex items-center justify-between border-b"
                      style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center border"
                          style={{ backgroundColor: color.bg, borderColor: color.border }}
                        >
                          <CategoryIcon size={14} style={{ color: color.text }} />
                        </div>
                        <h3 className="text-sm font-bold" style={{ color: color.text }}>{category}</h3>
                      </div>
                      {isExpanded ? 
                        <ChevronUp size={20} style={{ color: color.textMuted }} /> : 
                        <ChevronDown size={20} style={{ color: color.textMuted }} />
                      }
                    </ButtonPressFeedback>
                    
                    {isExpanded && (
                      <div className="p-4" style={{ backgroundColor: color.bg }}>
                        <div className="space-y-3">
                          {Object.entries(specs).map(([key, value]) => (
                            <div 
                              key={key} 
                              className="grid grid-cols-12 py-3 border-b last:border-0 items-start" 
                              style={{ borderColor: color.borderLight }}
                            >
                              <span 
                                className="col-span-4 text-xs font-bold uppercase tracking-wide pr-4" 
                                style={{ color: color.textMuted }}
                              >
                                {key}
                              </span>
                              <span 
                                className="col-span-8 text-xs font-medium leading-relaxed text-left" 
                                style={{ color: color.text }}
                              >
                                {formatSpecValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {similarPhones.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 px-4 mb-4">
            <TrendingUp size={20} style={{ color: color.text }} />
            <h3 
              className="text-lg font-bold"
              style={{ fontFamily: font.primary, color: color.text }}
            >
              Similar Phones
            </h3>
          </div>
          <HorizontalPhoneScroll
            title=""
            phones={similarPhones}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            variant="mobile"
          />
        </div>
      )}

      {alsoComparedWith.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Users size={20} style={{ color: color.text }} />
            <h3 
              className="text-lg font-bold"
              style={{ fontFamily: font.primary, color: color.text }}
            >
              Also Compared With
            </h3>
          </div>
          <p className="px-4 text-xs mb-4" style={{ color: color.textMuted }}>
            {comparisonCounts[alsoComparedWith[0]?.id]?.toLocaleString() || 0}+ users compared these phones
          </p>
          <HorizontalPhoneScroll
            title=""
            phones={alsoComparedWith}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            showComparisonCount={true}
            comparisonCounts={comparisonCounts}
            variant="mobile"
          />
        </div>
      )}

      <div className="px-4 pb-20">
        <div className="flex items-center gap-2 mb-4">
          <Star size={20} style={{ color: color.text }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>
            Reviews & Ratings
          </h3>
        </div>
        <ReviewSection phoneId={phone.id} variant="mobile" />
      </div>

      <CompareFloatingPanel
        compareList={compareList}
        onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
        onClear={() => setCompareList([])}
        onCompare={() => {
          const phoneSlugs = [phone, ...compareList].map(p => createPhoneSlug(p));
          router.push(APP_ROUTES.compare(phoneSlugs));
        }}
        variant="mobile"
      />

      {/* ADD THIS AT THE VERY END, BEFORE CLOSING </div> */}
      {showMobyMon && (
        <MobyMonCard 
          phone={phone} 
          onClose={() => setShowMobyMon(false)} 
        />
      )}

      <PriceAlertModal
        show={showPriceAlert}
        onClose={() => setShowPriceAlert(false)}
        phone={phone}
      />
    </div>
  );
}
