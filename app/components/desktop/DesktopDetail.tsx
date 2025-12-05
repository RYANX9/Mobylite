// desktop/DesktopDetail.tsx - UPDATED IMPORTS ONLY
'use client';
import React, { useState, useEffect } from 'react';
import {
  Camera, Battery, Bolt, Smartphone, ArrowLeft, Heart, Maximize2, 
  Plus, Cpu, MemoryStick, HardDrive, Search, Monitor, Zap, 
  Video, Wifi, Weight, Ruler, Calendar, Award, Signal, Volume2, Info, Package
} from 'lucide-react';

import { Phone, Review } from '../../components/shared/types';
import { API_BASE } from '../../components/shared/constants';
import { cleanHTMLText } from '../../components/shared/utils';
import { ButtonPressFeedback } from '../../components/shared/ButtonPressFeedback';
import { Tooltip } from '../../components/shared/Tooltip';
import { ReviewCard } from '../../components/shared/ReviewCard';
import { RatingsSummary } from '../../components/shared/RatingsSummary';
import { HorizontalPhoneScroll } from '../../components/shared/HorizontalPhoneScroll';


interface DesktopDetailProps {
  phone: Phone;
  setView: (view: string) => void;
  setComparePhones: (phones: Phone[]) => void;
  setSelectedPhone: (phone: Phone) => void;
}

export default function DesktopDetail({ phone, setView, setComparePhones, setSelectedPhone }: DesktopDetailProps) {
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [similarPhones, setSimilarPhones] = useState<Phone[]>([]);
  const [alsoComparedWith, setAlsoComparedWith] = useState<Phone[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [phoneStats, setPhoneStats] = useState<any>(null);
  const [comparisonCounts, setComparisonCounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchSimilarPhones();
    fetchAlsoComparedWith();
    fetchReviews();
    fetchPhoneStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phone]);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/reviews.json');
      const data = await res.json();
      const phoneReviews = data.reviews
        .filter((r: Review) => r.phone_id === phone.id)
        .sort((a: Review, b: Review) => b.helpful_count - a.helpful_count)
        .slice(0, 5);
      setReviews(phoneReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchPhoneStats = async () => {
    try {
      const res = await fetch('/reviews.json');
      const data = await res.json();
      const stats = data.phone_stats.find((s: any) => s.phone_id === phone.id);
      setPhoneStats(stats);
    } catch (error) {
      console.error('Error fetching phone stats:', error);
    }
  };

  const fetchAlsoComparedWith = async () => {
    try {
      const compRes = await fetch('/reviews.json');
      const compData = await compRes.json();
      const comparisonData = compData.comparisons.find((c: any) => c.phone_id === phone.id);
      
      if (comparisonData && comparisonData.compared_with_ids.length > 0) {
        const phoneIds = comparisonData.compared_with_ids.slice(0, 6);
        const phones = await Promise.all(
          phoneIds.map(async (id: number) => {
            const res = await fetch(`${API_BASE}/phones/${id}`);
            return await res.json();
          })
        );
        setAlsoComparedWith(phones);

        const counts: { [key: number]: number } = {};
        phoneIds.forEach((id: number, index: number) => {
          counts[id] = comparisonData.comparison_count - (index * 100);
        });
        setComparisonCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching also compared:', error);
    }
  };

  const fetchSimilarPhones = async () => {
    try {
      let url = `${API_BASE}/phones/search?page_size=30`;
      
      if (phone.price_usd) {
        const minPrice = Math.floor(phone.price_usd * 0.7);
        const maxPrice = Math.ceil(phone.price_usd * 1.3);
        url += `&min_price=${minPrice}&max_price=${maxPrice}`;
      }
      
      if (phone.ram_options && phone.ram_options.length > 0) {
        const avgRam = Math.max(...phone.ram_options);
        url += `&min_ram=${Math.max(avgRam - 2, 4)}`;
      }
      
      if (phone.storage_options && phone.storage_options.length > 0) {
        const avgStorage = Math.max(...phone.storage_options);
        url += `&min_storage=${Math.max(avgStorage / 2, 64)}`;
      }
      
      if (phone.release_year) {
        url += `&min_year=${phone.release_year - 1}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
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
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 12);

      setSimilarPhones(scoredPhones);
    } catch (error) {
      console.error('Error fetching similar phones:', error);
    }
  };

  const handleStartCompare = () => {
    setComparePhones([phone]);
    setView('compare');
  };

  const handleCompareWithPhone = async (comparePhone: Phone) => {
    try {
      const response = await fetch(`${API_BASE}/phones/${comparePhone.id}`);
      const fullPhone = await response.json();
      setComparePhones([phone, fullPhone]);
      setView('compare');
    } catch (error) {
      console.error('Error comparing phones:', error);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setView('home');
    }
  };

  const handlePhoneClick = async (clickedPhone: Phone) => {
    try {
      const response = await fetch(`${API_BASE}/phones/${clickedPhone.id}`);
      const fullPhone = await response.json();
      setSelectedPhone(fullPhone);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error loading phone details:', error);
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

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <ButtonPressFeedback onClick={() => setView('home')} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <ArrowLeft size={20} className="text-black" strokeWidth={2} />
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
              <h2 className="text-xl font-bold text-black">Mobylite</h2>
            </ButtonPressFeedback>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" strokeWidth={2} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="block w-full pl-12 pr-4 py-3 bg-gray-50 text-black rounded-xl border border-gray-200 focus:border-black focus:outline-none placeholder:text-gray-400 text-sm font-medium transition-all"
                placeholder="Search phones..."
              />
            </div>

            <ButtonPressFeedback
              className={`p-2.5 rounded-full transition-all ${isFavorite ? 'text-black bg-gray-100' : 'text-gray-400 hover:bg-gray-100'}`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
            </ButtonPressFeedback>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="sticky top-24">
              <div className="flex gap-6 mb-6">
                <div className="w-48 h-48 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-6" />
                  ) : (
                    <Smartphone size={80} className="text-gray-300" strokeWidth={1.5} />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">{phone.brand}</p>
                  <h1 className="text-3xl font-bold text-black leading-tight mb-2">{phone.model_name}</h1>
                  {phoneStats && (
                    <RatingsSummary
                      averageRating={phoneStats.average_rating}
                      totalReviews={phoneStats.total_reviews}
                      ownersCount={phoneStats.owners_count}
                      variant="compact"
                    />
                  )}
                  {phone.release_date_full && (
                    <p className="text-sm text-gray-500 font-medium mt-2">{cleanHTMLText(phone.release_date_full)}</p>
                  )}
                </div>
              </div>

              {phone.price_usd && (
                <div className="bg-black text-white rounded-2xl p-6 mb-4">
                  <p className="text-sm font-bold mb-1 opacity-70">PRICE</p>
                  <p className="text-4xl font-bold">${phone.price_usd}</p>
                  {phone.price_original && phone.currency && (
                    <p className="text-sm opacity-70 mt-1">{phone.price_original} {phone.currency}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {phone.amazon_link && (
                  <ButtonPressFeedback className="w-full" onClick={() => window.open(phone.amazon_link, '_blank')}>
                    <div className="w-full py-4 text-center font-bold text-white bg-black hover:bg-gray-900 rounded-xl text-sm transition-all">
                      Buy on Amazon
                    </div>
                  </ButtonPressFeedback>
                )}
                {phone.brand_link && (
                  <ButtonPressFeedback className="w-full" onClick={() => window.open(phone.brand_link, '_blank')}>
                    <div className="w-full py-4 text-center font-bold text-black bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-all">
                      Visit Brand Site
                    </div>
                  </ButtonPressFeedback>
                )}
                <ButtonPressFeedback onClick={handleStartCompare} className="w-full py-4 font-bold text-black bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                  <Plus size={18} strokeWidth={2} />
                  Add to Compare
                </ButtonPressFeedback>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-black">Specifications</h2>
              <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setIsExpertMode(false)}
                  className={`px-6 py-2.5 text-xs font-bold transition-all rounded-lg ${
                    !isExpertMode ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                  }`}
                >
                  SIMPLE
                </button>
                <button
                  onClick={() => setIsExpertMode(true)}
                  className={`px-6 py-2.5 text-xs font-bold transition-all rounded-lg ${
                    isExpertMode ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                  }`}
                >
                  EXPERT
                </button>
              </div>
            </div>

            {!isExpertMode ? (
              <div className="grid grid-cols-2 gap-4">
                {simpleSpecs.map((spec, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-black transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <spec.icon size={20} className="text-gray-700" strokeWidth={2} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{spec.label}</span>
                        {spec.tooltip && (
                          <Tooltip 
                            term={spec.label}
                            layman={spec.tooltip.layman}
                            nerd={spec.tooltip.nerd}
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-base font-bold text-black leading-snug">{spec.value}</p>
                  </div>
                ))}
              </div>               
            ) : (
              <div className="space-y-5">
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
                    return (
                      <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                            <CategoryIcon size={14} className="text-black" strokeWidth={2} />
                          </div>
                          <h3 className="text-sm font-bold text-black">{category}</h3>
                        </div>
                        <div className="p-5">
                          <div className="space-y-3">
                            {Object.entries(specs).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-shrink-0 mr-4">{key}</span>
                                <span className="text-xs font-medium text-black text-right leading-relaxed">
                                  {formatSpecValue(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {similarPhones.length > 0 && (
          <HorizontalPhoneScroll
            title="Similar Phones"
            subtitle="Based on specs, price, and features"
            phones={similarPhones}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
          />
        )}

        {alsoComparedWith.length > 0 && (
          <HorizontalPhoneScroll
            title="Also Compared With"
            subtitle={`${comparisonCounts[alsoComparedWith[0]?.id]?.toLocaleString() || 0}+ users compared these phones`}
            phones={alsoComparedWith}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            showComparisonCount={true}
            comparisonCounts={comparisonCounts}
          />
        )}

        {reviews.length > 0 && phoneStats && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-black">Reviews</h3>
              <button className="text-sm font-bold text-black hover:text-gray-600 transition-colors">
                View All {phoneStats.total_reviews.toLocaleString()} Reviews →
              </button>
            </div>

            <div className="mb-8">
              <RatingsSummary
                averageRating={phoneStats.average_rating}
                totalReviews={phoneStats.total_reviews}
                ownersCount={phoneStats.owners_count}
                wantCount={phoneStats.want_count}
                variant="detailed"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}