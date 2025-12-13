// app\components\mobile\MobileDetail.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Camera, Battery, Bolt, Smartphone, ArrowLeft, Heart, Maximize2, 
  Plus, Cpu, MemoryStick, HardDrive, Search, Monitor, Zap, 
  Video, Wifi, Weight, Ruler, Calendar, Award, Signal, Volume2, Info, Package, Bell,
  ChevronDown, ChevronUp, GitCompare, Star, X, TrendingUp, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Phone, Review, Favorite } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES } from '@/lib/config';
import { api } from '@/lib/api';
import { cleanHTMLText } from '@/lib/utils';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { ReviewSection } from '@/app/components/shared/ReviewSection';
import { color, font } from '@/lib/tokens';
import { createPhoneSlug } from '@/lib/config';
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal';
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel';
import { RatingsSummary } from '@/app/components/shared/RatingsSummary';
import { UserMenu } from './UserMenu';

interface MobileDetailProps {
  phone: Phone;
  setView: (view: string) => void;
  setComparePhones: (phones: Phone[]) => void;
  setSelectedPhone: (phone: Phone) => void;
}

export default function MobileDetail({ phone, setView, setComparePhones, setSelectedPhone }: MobileDetailProps) {
  const router = useRouter();
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [similarPhones, setSimilarPhones] = useState<Phone[]>([]);
  const [alsoComparedWith, setAlsoComparedWith] = useState<Phone[]>([]);
  const [comparisonCounts, setComparisonCounts] = useState<{ [key: number]: number }>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneStats, setPhoneStats] = useState<any>(null);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Launch', 'Body', 'Display']));
  const [expandedSpec, setExpandedSpec] = useState<number | null>(null);
  const [compareList, setCompareList] = useState<Phone[]>([]);

  // Check if phone is in user's favorites
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
    fetchPhoneStats();
    
    // Add to view history
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
      const params: any = {
        page_size: 30,
      };
      
      if (phone.price_usd) {
        const minPrice = Math.floor(phone.price_usd * 0.7);
        const maxPrice = Math.ceil(phone.price_usd * 1.3);
        params.min_price = minPrice;
        params.max_price = maxPrice;
      }
      
      if (phone.ram_options && phone.ram_options.length > 0) {
        const avgRam = Math.max(...phone.ram_options);
        params.min_ram = Math.max(avgRam - 2, 4);
      }
      
      if (phone.storage_options && phone.storage_options.length > 0) {
        const avgStorage = Math.max(...phone.storage_options);
        params.min_storage = Math.max(avgStorage / 2, 64);
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
            const priceScore = Math.max(0, 25 - (priceDiff / phone.price_usd) * 25);
            score += priceScore;
          }
          if (phone.ram_options && p.ram_options && phone.ram_options.length && p.ram_options.length) {
            const phoneRam = Math.max(...phone.ram_options);
            const pRam = Math.max(...p.ram_options);
            const ramDiff = Math.abs(phoneRam - pRam);
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
    }
  };

  const handleStartCompare = () => {
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ phoneIds: [phone.id] })
      }).catch(console.error);
    }
    
    const phoneSlug = createPhoneSlug(phone);
    router.push(APP_ROUTES.compare([phoneSlug]));
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

  const simpleSpecs = [
    { 
      icon: Cpu, 
      label: 'Chipset', 
      value: phone.chipset || 'N/A',
      tooltip: { layman: 'Brain of the phone', nerd: 'System on Chip processor' }
    },
    {
      icon: MemoryStick,
      label: 'RAM',
      value: phone.ram_options && phone.ram_options.length > 0 ? phone.ram_options.join(' / ') + ' GB' : 'N/A',
      tooltip: { layman: 'Memory for running apps', nerd: 'LPDDR5/5X RAM capacity' }
    },
    {
      icon: HardDrive,
      label: 'Storage',
      value: phone.storage_options && phone.storage_options.length > 0 ? phone.storage_options.join(' / ') + ' GB' : 'N/A',
      tooltip: { layman: 'Space for files', nerd: 'UFS 3.1/4.0 storage' }
    },
    { 
      icon: Maximize2, 
      label: 'Display', 
      value: phone.screen_size ? `${phone.screen_size}" ${phone.screen_resolution || ''}` : 'N/A',
      tooltip: { layman: 'Screen size', nerd: 'Display diagonal and resolution' }
    },
    { 
      icon: Camera, 
      label: 'Camera', 
      value: phone.main_camera_mp ? `${phone.main_camera_mp}MP` : 'N/A',
      tooltip: { layman: 'Photo quality', nerd: 'Main sensor resolution' }
    },
    { 
      icon: Video, 
      label: 'Video', 
      value: phone.video_resolution || 'N/A',
      tooltip: { layman: 'Video quality', nerd: 'Max video resolution' }
    },
    { 
      icon: Battery, 
      label: 'Battery', 
      value: phone.battery_capacity ? `${phone.battery_capacity} mAh` : 'N/A',
      tooltip: { layman: 'Battery life', nerd: 'Battery capacity' }
    },
    { 
      icon: Bolt, 
      label: 'Charging', 
      value: phone.fast_charging_w ? `${phone.fast_charging_w}W` : 'N/A',
      tooltip: { layman: 'Charging speed', nerd: 'Max charging power' }
    },
    {
      icon: Weight,
      label: 'Weight',
      value: phone.weight_g ? `${phone.weight_g}g` : 'N/A',
      tooltip: { layman: 'Device weight', nerd: 'Total weight in grams' }
    },
    {
      icon: Ruler,
      label: 'Thickness',
      value: phone.thickness_mm ? `${phone.thickness_mm}mm` : 'N/A',
      tooltip: { layman: 'How thin it is', nerd: 'Device thickness' }
    },
    {
      icon: Award,
      label: 'AnTuTu',
      value: phone.antutu_score || 'N/A',
      tooltip: { layman: 'Performance score', nerd: 'AnTuTu benchmark' }
    }
  ];

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

  const containerBgStyle: React.CSSProperties = {
    backgroundColor: color.bg,
  };

  const navbarBgStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    borderColor: color.borderLight,
  };

  return (
    <div className="min-h-screen" style={containerBgStyle}>
      {/* Sticky Header with UserMenu */}
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
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Compact Hero Section - Image left, text right */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Smaller image on left */}
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
          
          {/* Text and info on right - left aligned */}
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
            
            {/* Price under title */}
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
            
            {/* Single, smaller rating section using RatingsSummary */}
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
        
        {/* Buy on Amazon on top */}
        {phone.amazon_link && (
          <ButtonPressFeedback onClick={() => window.open(phone.amazon_link, '_blank')} className="w-full mb-3">
            <div className="w-full py-4 text-center font-bold rounded-xl text-sm" style={{ backgroundColor: color.primary, color: color.primaryText }}>
              Buy on Amazon
            </div>
          </ButtonPressFeedback>
        )}
        
        {/* Buttons row - Visit Brand Site and Set Price Alert side by side */}
        <div className="flex gap-3">
          {phone.brand_link && (
            <ButtonPressFeedback onClick={() => window.open(phone.brand_link, '_blank')} className="flex-1">
              <div className="w-full py-3 text-center font-bold rounded-xl text-sm" style={{ backgroundColor: color.borderLight, color: color.text }}>
                Visit Brand Site
              </div>
            </ButtonPressFeedback>
          )}
          
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

      {/* Specs Toggle */}
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
              className={`px-4 py-2 text-xs font-bold rounded-full ${
                !isExpertMode ? 'shadow-sm' : ''
              }`}
              style={!isExpertMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
            >
              SIMPLE
            </button>
            <button
              onClick={() => setIsExpertMode(true)}
              className={`px-4 py-2 text-xs font-bold rounded-full ${
                isExpertMode ? 'shadow-sm' : ''
              }`}
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
                  
                  {/* Expanded Details */}
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
                'Selfie camera', 'Selfie Camera','Battery', 'Comms', 'Sound', 
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
                                {/* Label Column - spans 4 of 12 columns */}
                                <span 
                                  className="col-span-4 text-xs font-bold uppercase tracking-wide pr-4" 
                                  style={{ color: color.textMuted }}
                                >
                                  {key}
                                </span>
                                
                                {/* Value Column - spans 8 of 12 columns */}
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

      {/* Similar Phones */}
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
          <MobileHorizontalPhoneScroll
            phones={similarPhones}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
          />
        </div>
      )}

      {/* Also Compared With */}
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
          <MobileHorizontalPhoneScroll
            phones={alsoComparedWith}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            showComparisonCount={true}
            comparisonCounts={comparisonCounts}
          />
        </div>
      )}

      {/* Reviews Section - Only ReviewSection, no duplicate RatingsSummary */}
      <div className="px-4 pb-20">
        <div className="flex items-center gap-2 mb-4">
          <Star size={20} style={{ color: color.text }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>
            Reviews & Ratings
          </h3>
        </div>
        <ReviewSection phoneId={phone.id} variant="mobile" />
      </div>

      {/* Compare Floating Panel */}
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
    </div>
  );
}

// Mobile-optimized horizontal scroll component
interface MobileHorizontalPhoneScrollProps {
  phones: Phone[];
  onPhoneClick: (phone: Phone) => void;
  onCompareClick: (phone: Phone) => void;
  showComparisonCount?: boolean;
  comparisonCounts?: { [key: number]: number };
}

const MobileHorizontalPhoneScroll: React.FC<MobileHorizontalPhoneScrollProps> = ({
  phones,
  onPhoneClick,
  onCompareClick,
  showComparisonCount,
  comparisonCounts
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
      {phones.map((phone) => (
        <div 
          key={phone.id}
          className="flex-shrink-0 w-56 rounded-xl overflow-hidden border"
          style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
        >
          <ButtonPressFeedback
            onClick={() => onPhoneClick(phone)}
            className="w-full"
          >
            <div 
              className="h-40 flex items-center justify-center border-b"
              style={{ background: `linear-gradient(135deg, ${color.borderLight} 0%, ${color.bg} 50%)`, borderColor: color.borderLight }}
            >
              {phone.main_image_url ? (
                <img
                  src={phone.main_image_url}
                  alt={phone.model_name}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Smartphone size={48} style={{ color: color.textLight, opacity: 0.7 }} />
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-bold mb-1 truncate" style={{ color: color.textMuted }}>
                {phone.brand}
              </p>
              <h4 className="text-sm font-bold mb-2 line-clamp-2" style={{ color: color.text }}>
                {phone.model_name}
              </h4>
              {phone.price_usd && (
                <p className="text-base font-bold" style={{ color: color.text, fontFamily: font.numeric }}>
                  ${phone.price_usd.toLocaleString()}
                </p>
              )}
            </div>
          </ButtonPressFeedback>
          
          <div className="px-3 pb-3">
            <ButtonPressFeedback
              onClick={(e) => {
                e.stopPropagation();
                onCompareClick(phone);
              }}
              className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
              style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}
            >
              <GitCompare size={14} />
              Compare
            </ButtonPressFeedback>
            
            {showComparisonCount && comparisonCounts && (
              <p className="text-[10px] text-center mt-1" style={{ color: color.textMuted }}>
                {comparisonCounts[phone.id]?.toLocaleString() || 0} comparisons
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
