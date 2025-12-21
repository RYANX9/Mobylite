// app/components/shared/MobyMonCard.tsx
'use client';
import React, { useRef, useMemo } from 'react';
import { 
  X, Download, Smartphone, Sun, Cpu, Camera, Battery, 
  HardDrive, Wifi, Zap, Maximize2, Ruler, Weight, Star 
} from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { color, font } from '@/lib/tokens';
import { Phone } from '@/lib/types';

interface MobyMonCardProps {
  phone: Phone;
  onClose: () => void;
}

interface SpecItem {
  icon: React.ElementType;
  label: string;
  value: string;
}

const getProxiedImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

const formatReleaseDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return dateStr.replace(/(Released|Announced)\s+/i, '').trim();
};

const extractDisplayType = (displaytype?: string): string => {
  if (!displaytype) return "OLED";
  
  const match = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
  const type = match ? match[0] : "OLED";
  
  const allHzMatches = displaytype.match(/(\d+)Hz/g);
  let refreshRate = "";
  
  if (allHzMatches) {
    for (const hzMatch of allHzMatches) {
      const value = parseInt(hzMatch);
      if (value >= 30 && value <= 240) {
        refreshRate = ` ${value}Hz`;
        break;
      }
    }
  }
  
  return `${type}${refreshRate}`;
};

const extractBrightness = (displaytype?: string): string | null => {
  if (!displaytype) return null;
  const match = displaytype.match(/(\d+)\s*nits/i);
  return match ? match[0] : null;
};

const parseMemoryOptions = (internalMemory?: string): { ram: string; storage: string } => {
  if (!internalMemory) return { ram: "", storage: "" };

  const combos = internalMemory.split(',');
  const ramSet = new Set<string>();
  const storageSet = new Set<string>();

  combos.forEach(combo => {
    const matches = combo.match(/(\d+)(GB|TB)/gi);
    
    if (matches) {
      matches.forEach(match => {
        const value = parseInt(match);
        const isTB = match.toLowerCase().includes('tb');
        
        if (!isTB && value < 32) {
          ramSet.add(`${value}GB`);
        } else {
          storageSet.add(match.toUpperCase());
        }
      });
    }
  });

  return {
    ram: Array.from(ramSet).join('/'),
    storage: Array.from(storageSet).join('/')
  };
};

const extractMainCamera = (cam1modules?: string): string | null => {
  if (!cam1modules) return null;
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
  const match = regex.exec(cam1modules);
  return match ? `${match[1]}MP • f/${match[2]}` : null;
};

const extractUltrawideCamera = (cam1modules?: string): string | null => {
  if (!cam1modules) return null;
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
  const match = regex.exec(cam1modules);
  return match ? `${match[1]}MP • f/${match[2]}` : null;
};

const extractFrontCamera = (cam2modules?: string): string | null => {
  if (!cam2modules) return null;
  const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
  const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
  if (mpMatch && apertureMatch) return `${mpMatch[1]}MP • f/${apertureMatch[1]}`;
  return mpMatch ? `${mpMatch[1]}MP` : null;
};

const extractDetailedCharging = (chargingStr?: string, wiredW?: number): string => {
  if (!chargingStr) return wiredW ? `${wiredW}W` : "Fast";

  const wirelessMatch = chargingStr.match(/(\d+)W\s*(?=wireless|Qi2|MagSafe|magnetic)/i);
  const wirelessW = wirelessMatch ? wirelessMatch[1] : null;

  const wiredPart = wiredW ? `${wiredW}W` : "";
  const wirelessPart = wirelessW ? `${wirelessW}W Wireless` : "";

  if (wiredPart && wirelessPart) return `${wiredPart} • ${wirelessPart}`;
  return wiredPart || wirelessPart || "Fast Charging";
};

const extractWiFi = (wlan?: string): string | null => {
  if (!wlan) return null;
  if (/7|be/i.test(wlan)) return 'Wi-Fi 7';
  if (/6e/i.test(wlan)) return 'Wi-Fi 6E';
  if (/6|ax/i.test(wlan)) return 'Wi-Fi 6';
  return 'Wi-Fi 5';
};

const extractDimensions = (dimensions?: string): string | null => {
  if (!dimensions) return null;
  const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
  return match ? match[1] : null;
};

export const MobyMonCard: React.FC<MobyMonCardProps> = ({ phone, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const specs = useMemo(() => {
    const result: SpecItem[] = [];
    const phoneSpecs = phone.full_specifications?.specifications || {};
    const quickSpecs = phone.full_specifications?.quick_specs || {};

    if (phone.screen_size) {
      const displayType = extractDisplayType(quickSpecs.displaytype);
      result.push({
        icon: Maximize2,
        label: 'Display',
        value: `${phone.screen_size}" ${displayType}`
      });
    }

    const brightness = extractBrightness(quickSpecs.displaytype);
    if (brightness) {
      result.push({ icon: Sun, label: 'Brightness', value: brightness });
    }

    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'Chipset', value: phone.chipset });
    }

    const memoryData = parseMemoryOptions(quickSpecs.internalmemory);
    if (memoryData.ram || memoryData.storage) {
      result.push({
        icon: HardDrive,
        label: 'Memory',
        value: memoryData.ram && memoryData.storage 
          ? `${memoryData.ram} • ${memoryData.storage}`
          : (memoryData.ram || memoryData.storage)
      });
    }

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'Main', value: mainCam });
    }

    const ultrawideCam = extractUltrawideCamera(quickSpecs.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'Ultrawide', value: ultrawideCam });
    }

    const frontCam = extractFrontCamera(quickSpecs.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'Selfie', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'Battery', value: `${phone.battery_capacity} mAh` });
    }

    if (phone.fast_charging_w || phoneSpecs.Battery?.Charging) {
      const chargingDisplay = extractDetailedCharging(
        phoneSpecs.Battery?.Charging, 
        phone.fast_charging_w
      );
      result.push({ icon: Zap, label: 'Charging', value: chargingDisplay });
    }

    const wifi = extractWiFi(quickSpecs.wlan);
    if (wifi) {
      result.push({ icon: Wifi, label: 'Wi-Fi', value: wifi });
    }

    const dimensions = extractDimensions(phoneSpecs.Body?.Dimensions);
    if (dimensions) {
      result.push({ icon: Ruler, label: 'Size', value: `${dimensions} mm` });
    }

    if (phone.weight_g) {
      result.push({ icon: Weight, label: 'Weight', value: `${phone.weight_g}g` });
    }

    return result.slice(0, 12);
  }, [phone]);

  const downloadCard = async () => {
    if (!cardRef.current) return;

    const originalStyles = {
      width: cardRef.current.style.width,
      height: cardRef.current.style.height,
      maxWidth: cardRef.current.style.maxWidth,
      overflow: cardRef.current.style.overflow,
      position: cardRef.current.style.position,
    };

    cardRef.current.style.width = '450px';
    cardRef.current.style.height = 'auto';
    cardRef.current.style.maxWidth = '450px';
    cardRef.current.style.overflow = 'visible';
    cardRef.current.style.position = 'relative';

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        width: 450,
        backgroundColor: '#FFFFFF',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `mobymon-${phone.brand}-${phone.model_name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
      alert('Failed to generate card. Please try again.');
    } finally {
      Object.assign(cardRef.current.style, originalStyles);
    }
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { 
          scrollbar-width: none; 
          -ms-overflow-style: none; 
        }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="relative w-full max-w-md h-full flex flex-col p-4">
          <div className="flex justify-end gap-3 mb-4">
            <ButtonPressFeedback
              onClick={downloadCard}
              className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              style={{ 
                backgroundColor: '#10b981', 
                color: '#FFFFFF',
                border: '2px solid #059669'
              }}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Save</span>
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all"
              style={{ 
                backgroundColor: '#1f2937', 
                color: '#FFFFFF',
                border: '2px solid #374151'
              }}
            >
              <X size={18} />
            </ButtonPressFeedback>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div
              ref={cardRef}
              className="w-full h-full overflow-y-auto hide-scrollbar shadow-2xl rounded-3xl"
              style={{
                backgroundColor: '#FFFFFF',
                maxWidth: '450px',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {/* Hero Gradient Section */}
              <div 
                className="relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  padding: '32px 24px 180px 24px',
                }}
              >
                {/* Decorative circles */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                  }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '-30px',
                    width: '150px',
                    height: '150px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    filter: 'blur(30px)',
                  }}
                />

                {/* Brand badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#FFFFFF',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {phone.brand}
                  </div>
                  {phone.release_date_full && (
                    <div 
                      className="text-xs font-semibold"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {formatReleaseDate(phone.release_date_full)}
                    </div>
                  )}
                </div>

                {/* Model name */}
                <h1
                  className="text-5xl font-black leading-tight mb-6"
                  style={{ 
                    color: '#FFFFFF',
                    textShadow: '0 2px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  {phone.model_name.split(' ').slice(1).join(' ')}
                </h1>

                {/* Price tag */}
                {phone.price_usd && (
                  <div 
                    className="inline-block px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div className="flex items-baseline gap-1">
                      <span 
                        className="text-3xl font-black"
                        style={{ color: '#FFFFFF' }}
                      >
                        ${phone.price_usd}
                      </span>
                      <span 
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        USD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone image - overlapping */}
              <div className="relative -mt-32 mb-6 px-6">
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl mx-auto"
                  style={{
                    width: '280px',
                    height: '280px',
                    backgroundColor: '#f8f9fa',
                    border: '4px solid #FFFFFF',
                  }}
                >
                  {phone.main_image_url ? (
                    <img
                      src={getProxiedImageUrl(phone.main_image_url)}
                      alt={phone.model_name}
                      className="w-full h-full object-contain p-8"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      display: phone.main_image_url ? 'none' : 'flex',
                    }}
                  >
                    <Smartphone
                      size={80}
                      style={{ color: 'rgba(0,0,0,0.1)' }}
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>

              {/* Specs grid */}
              <div style={{ padding: '0 24px 32px 24px' }}>
                <div className="grid grid-cols-2 gap-4">
                  {specs.map((spec, i) => (
                    <div 
                      key={i} 
                      className="rounded-xl p-4 transition-all"
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="p-1.5 rounded-lg"
                          style={{
                            backgroundColor: '#667eea',
                          }}
                        >
                          <spec.icon
                            size={14}
                            style={{ color: '#FFFFFF' }}
                            strokeWidth={2}
                          />
                        </div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: '#6b7280' }}
                        >
                          {spec.label}
                        </p>
                      </div>
                      <p
                        className="text-sm font-bold leading-snug"
                        style={{ color: '#111827' }}
                      >
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer branding */}
              <div 
                className="flex items-center justify-between px-6 py-5"
                style={{
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ width: '36px', height: '36px' }}>
                    <img
                      src="/logowhite.svg"
                      alt="Mobylite"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-wider"
                      style={{ color: '#FFFFFF' }}
                    >
                      Mobylite
                    </p>
                    <p
                      className="text-[9px] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      MobyMon Archive
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="#fbbf24"
                      style={{ color: '#fbbf24' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
          
