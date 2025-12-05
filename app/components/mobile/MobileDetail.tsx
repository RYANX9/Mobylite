'use client';
import React, { useState, useEffect } from 'react';
import {
  Camera, Battery, Bolt, Smartphone, ArrowLeft, Heart, Maximize2, 
  Plus, Cpu, MemoryStick, HardDrive, Search, Monitor, Zap, 
  Video, Wifi, Weight, Ruler, Calendar, Award, Signal, Volume2, Info, Package, GitCompare, ChevronDown
} from 'lucide-react';

const API_BASE = 'https://renderphones.onrender.com';

const ButtonPressFeedback = ({ children, className = '', onClick, disabled = false }) => (
  <button
    className={`active:scale-[0.98] transition-all duration-150 ${className} ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Tooltip = ({ term, layman, nerd }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onTouchStart={() => setShow(true)}
        onTouchEnd={() => setTimeout(() => setShow(false), 2000)}
        className="ml-1 text-gray-400 active:text-black transition-colors"
      >
        <Info size={12} />
      </button>
      {show && (
        <div className="fixed z-50 inset-x-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-black rounded-xl p-4 shadow-2xl">
          <div className="mb-2">
            <div className="text-xs font-bold text-gray-500 mb-1">SIMPLE</div>
            <div className="text-sm text-black">{layman}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">TECHNICAL</div>
            <div className="text-sm text-black">{nerd}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const cleanHTMLText = (text) => {
  if (!text) return '';
  let cleaned = String(text);
  cleaned = cleaned.replace(/<br\s*\/?>/gi, ' • ');
  cleaned = cleaned.replace(/<sup>([^<]*)<\/sup>/gi, '$1');
  cleaned = cleaned.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  return cleaned;
};

export default function MobileDetail({ phone, setView, setComparePhones, setSelectedPhone }) {
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [similarPhones, setSimilarPhones] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSimilarPhones();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phone]);

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
        .filter((p) => p.id !== phone.id)
        .map((p) => {
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
        .slice(0, 6);

      setSimilarPhones(scoredPhones);
    } catch (error) {
      console.error('Error fetching similar phones:', error);
    }
  };

  const handleStartCompare = () => {
    setComparePhones([phone]);
    setView('compare');
  };

  const handleCompareWithSimilar = async (similarPhone) => {
    try {
      const response = await fetch(`${API_BASE}/phones/${similarPhone.id}`);
      const fullSimilarPhone = await response.json();
      setComparePhones([phone, fullSimilarPhone]);
      setView('compare');
    } catch (error) {
      console.error('Error comparing phones:', error);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearch(false);
      setView('home');
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

  const getIconForCategory = (category) => {
    const icons = {
      'Launch': Calendar,
      'Body': Package,
      'Display': Monitor,
      'Platform': Cpu,
      'Memory': MemoryStick,
      'Main Camera': Camera,
      'Selfie camera': Camera,
      'Selfie Camera': Camera,
      'Battery': Battery,
      'Comms': Wifi,
      'Sound': Volume2,
      'Features': Zap,
      'Network': Signal,
      'Misc': Info,
      'Our Tests': Award
    };
    return icons[category] || Info;
  };

  const formatSpecValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (Array.isArray(value)) {
      return value.map(v => cleanHTMLText(v)).join(', ');
    }
    
    if (typeof value === 'object' && value.price_usd) {
      return `$${value.price_usd}`;
    }
    
    if (typeof value === 'object') {
      return cleanHTMLText(JSON.stringify(value));
    }
    
    return cleanHTMLText(value);
  };

  const fullSpecs = phone.full_specifications?.specifications || {};

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <ButtonPressFeedback onClick={() => setView('home')}>
                <ArrowLeft size={24} className="text-black" strokeWidth={2} />
              </ButtonPressFeedback>
              <img src="/logo.svg" alt="Mobylite" className="w-7 h-7" />
              <h2 className="text-lg font-bold text-black">Mobylite</h2>
            </div>
            <div className="flex items-center gap-2">
              <ButtonPressFeedback onClick={() => setShowSearch(!showSearch)}>
                <Search size={22} className="text-black" strokeWidth={2} />
              </ButtonPressFeedback>
              <ButtonPressFeedback
                className={`transition-all ${isFavorite ? 'text-black' : 'text-gray-400'}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
              </ButtonPressFeedback>
            </div>
          </div>
          
          {showSearch && (
            <div className="mt-3 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="block w-full px-4 py-2.5 bg-gray-50 text-black rounded-xl border border-gray-200 focus:border-black focus:outline-none placeholder:text-gray-400 text-sm font-medium"
                placeholder="Search phones..."
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="flex gap-4 mb-4">
          <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
            {phone.main_image_url ? (
              <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-4" />
            ) : (
              <Smartphone size={48} className="text-gray-300" strokeWidth={1.5} />
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wide">{phone.brand}</p>
            <h1 className="text-xl font-bold text-black leading-tight mb-1">{phone.model_name}</h1>
            {phone.release_date_full && (
              <p className="text-xs text-gray-500 font-medium">{cleanHTMLText(phone.release_date_full)}</p>
            )}
          </div>
        </div>

        {phone.price_usd && (
          <div className="bg-black text-white rounded-2xl p-5 mb-4">
            <p className="text-xs font-bold mb-1 opacity-70">PRICE</p>
            <p className="text-3xl font-bold">${phone.price_usd}</p>
            {phone.price_original && phone.currency && (
              <p className="text-xs opacity-70 mt-1">{phone.price_original} {phone.currency}</p>
            )}
          </div>
        )}

        <div className="space-y-2 mb-6">
          {phone.amazon_link && (
            <ButtonPressFeedback className="w-full" onClick={() => window.open(phone.amazon_link, '_blank')}>
              <div className="w-full py-3.5 text-center font-bold text-white bg-black rounded-xl text-sm">
                Buy on Amazon
              </div>
            </ButtonPressFeedback>
          )}
          {phone.brand_link && (
            <ButtonPressFeedback className="w-full" onClick={() => window.open(phone.brand_link, '_blank')}>
              <div className="w-full py-3.5 text-center font-bold text-black bg-gray-100 rounded-xl text-sm">
                Visit Brand Site
              </div>
            </ButtonPressFeedback>
          )}
          <ButtonPressFeedback onClick={handleStartCompare} className="w-full py-3.5 font-bold text-black bg-gray-100 rounded-xl text-sm flex items-center justify-center gap-2">
            <Plus size={18} strokeWidth={2} />
            Add to Compare
          </ButtonPressFeedback>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Specifications</h2>
          <div className="inline-flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setIsExpertMode(false)}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded ${
                !isExpertMode ? 'bg-white text-black shadow-sm' : 'text-gray-500'
              }`}
            >
              SIMPLE
            </button>
            <button
              onClick={() => setIsExpertMode(true)}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded ${
                isExpertMode ? 'bg-white text-black shadow-sm' : 'text-gray-500'
              }`}
            >
              EXPERT
            </button>
          </div>
        </div>

        {!isExpertMode ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {simpleSpecs.map((spec, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <spec.icon size={16} className="text-gray-700" strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide truncate">{spec.label}</span>
                    {spec.tooltip && (
                      <Tooltip 
                        term={spec.label}
                        layman={spec.tooltip.layman}
                        nerd={spec.tooltip.nerd}
                      />
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-black leading-snug">{spec.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5 mb-6">
            {(() => {
              const categoryOrder = [
                'Launch', 'Body', 'Display', 'Platform', 'Memory', 'Main Camera', 
                'Selfie camera', 'Selfie Camera', 'Battery', 'Comms', 'Sound', 
                'Features', 'Network', 'Misc', 'Our Tests'
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

        {similarPhones.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Similar Phones</h3>
              <p className="text-xs text-gray-500 font-medium">Based on specs & price</p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {similarPhones.map((p) => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ width: '200px' }}>
                    <ButtonPressFeedback
                      onClick={async () => {
                        const response = await fetch(`${API_BASE}/phones/${p.id}`);
                        const fullPhone = await response.json();
                        setSelectedPhone(fullPhone);
                      }}
                      className="w-full"
                    >
                      <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {p.main_image_url ? (
                          <img src={p.main_image_url} alt={p.model_name} className="w-full h-full object-contain p-4" />
                        ) : (
                          <Smartphone size={40} className="text-gray-300" strokeWidth={2} />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wide">{p.brand}</p>
                        <p className="text-xs font-bold text-black leading-tight line-clamp-2 mb-1 min-h-[32px]">{p.model_name}</p>
                        {p.price_usd && <p className="text-lg font-bold text-black mb-2">${p.price_usd}</p>}
                      </div>
                    </ButtonPressFeedback>
                    
                    <div className="px-3 pb-3">
                      <ButtonPressFeedback
                        onClick={() => handleCompareWithSimilar(p)}
                        className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <GitCompare size={12} strokeWidth={2} />
                        Compare
                      </ButtonPressFeedback>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}