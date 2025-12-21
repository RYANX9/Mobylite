// app/components/shared/MobyMonCard.tsx
'use client';
import React, { useRef, useMemo } from 'react';
import { 
  X, Download, Smartphone, Sun, Cpu, Camera, Battery, 
  HardDrive, Wifi, Zap, Maximize2, Ruler, Weight 
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
        refreshRate = ` (${value}Hz)`;
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
    ram: Array.from(ramSet).join(' / '),
    storage: Array.from(storageSet).join(' / ')
  };
};

const extractMainCamera = (cam1modules?: string): string | null => {
  if (!cam1modules) return null;
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
  const match = regex.exec(cam1modules);
  return match ? `${match[1]}MP (f/${match[2]})` : null;
};

const extractUltrawideCamera = (cam1modules?: string): string | null => {
  if (!cam1modules) return null;
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
  const match = regex.exec(cam1modules);
  return match ? `${match[1]}MP (f/${match[2]})` : null;
};

const extractFrontCamera = (cam2modules?: string): string | null => {
  if (!cam2modules) return null;
  const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
  const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
  if (mpMatch && apertureMatch) return `${mpMatch[1]}MP (f/${apertureMatch[1]})`;
  return mpMatch ? `${mpMatch[1]}MP` : null;
};

const extractDetailedCharging = (chargingStr?: string, wiredW?: number): string => {
  if (!chargingStr) return wiredW ? `${wiredW}W (Wired)` : "Fast Charging";

  const wirelessMatch = chargingStr.match(/(\d+)W\s*(?=wireless|Qi2|MagSafe|magnetic)/i);
  const wirelessW = wirelessMatch ? wirelessMatch[1] : null;
  
  let wirelessType = "Wireless";
  if (/Qi2/i.test(chargingStr)) wirelessType = "Qi2";
  else if (/MagSafe/i.test(chargingStr)) wirelessType = "MagSafe";

  const wiredPart = wiredW ? `${wiredW}W (Wired)` : "";
  const wirelessPart = wirelessW ? `${wirelessW}W (${wirelessType})` : "";

  if (wiredPart && wirelessPart) return `${wiredPart} / ${wirelessPart}`;
  return wiredPart || wirelessPart || "Fast Charging";
};

const extractWiFi = (wlan?: string): string | null => {
  if (!wlan) return null;
  if (/7|be/i.test(wlan)) return 'Wi-Fi 7';
  if (/6e/i.test(wlan)) return 'Wi-Fi 6E';
  if (/6|ax/i.test(wlan)) return 'Wi-Fi 6';
  return 'Wi-Fi';
};

const extractDimensions = (dimensions?: string): string | null => {
  if (!dimensions) return null;
  const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
  return match ? `${match[1]} mm` : null;
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
        label: 'DISPLAY',
        value: displayType ? `${phone.screen_size}" ${displayType}` : `${phone.screen_size}"`
      });
    }

    const brightness = extractBrightness(quickSpecs.displaytype);
    if (brightness) {
      result.push({ icon: Sun, label: 'BRIGHTNESS', value: brightness });
    }

    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'CHIPSET', value: phone.chipset });
    }

    const memoryData = parseMemoryOptions(quickSpecs.internalmemory);
    if (memoryData.ram || memoryData.storage) {
      result.push({
        icon: HardDrive,
        label: 'RAM + STORAGE',
        value: memoryData.ram && memoryData.storage 
          ? `${memoryData.ram} / ${memoryData.storage}`
          : (memoryData.ram || memoryData.storage)
      });
    }

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'MAIN CAMERA', value: mainCam });
    }

    const ultrawideCam = extractUltrawideCamera(quickSpecs.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'ULTRAWIDE', value: ultrawideCam });
    }

    const frontCam = extractFrontCamera(quickSpecs.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'FRONT CAMERA', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'BATTERY', value: `${phone.battery_capacity} mAh` });
    }

    if (phone.fast_charging_w || phoneSpecs.Battery?.Charging) {
      const chargingDisplay = extractDetailedCharging(
        phoneSpecs.Battery?.Charging, 
        phone.fast_charging_w
      );
      result.push({ icon: Zap, label: 'CHARGING', value: chargingDisplay });
    }

    const wifi = extractWiFi(quickSpecs.wlan);
    if (wifi) {
      result.push({ icon: Wifi, label: 'WI-FI', value: wifi });
    }

    const dimensions = extractDimensions(phoneSpecs.Body?.Dimensions);
    if (dimensions) {
      result.push({ icon: Ruler, label: 'DIMENSIONS', value: dimensions });
    }

    if (phone.weight_g) {
      result.push({ icon: Weight, label: 'WEIGHT', value: `${phone.weight_g}g` });
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

  const cardHeaderStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '3px solid #000000',
  };

  const brandLabelStyle: React.CSSProperties = {
    color: 'rgba(0,0,0,0.25)',
  };

  const brandNameStyle: React.CSSProperties = {
    color: '#9ca3af',
  };

  const modelNameStyle: React.CSSProperties = {
    color: '#000000',
    fontFamily: 'Young Serif, serif',
  };

  const releaseDateStyle: React.CSSProperties = {
    color: 'rgba(0,0,0,0.35)',
  };

  const imageContainerStyle: React.CSSProperties = {
    width: '120px',
    height: '150px',
    backgroundColor: '#f9f9f9',
    border: '3px solid #222222',
  };

  const specLabelStyle: React.CSSProperties = {
    color: 'rgba(0,0,0,0.4)',
  };

  const specValueStyle: React.CSSProperties = {
    color: '#000000',
  };

  const footerStyle: React.CSSProperties = {
    backgroundColor: '#000000',
    padding: '20px',
    borderTop: '3px solid #000000',
  };

  const footerLogoTextStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.8)',
  };

  const footerUrlStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
  };

  const priceLabelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.7)',
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { 
          scrollbar-width: none; 
          -ms-overflow-style: none; 
        }
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-md h-full flex flex-col p-4">
          <div className="flex justify-end gap-3 mb-4">
            <ButtonPressFeedback
              onClick={downloadCard}
              className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: color.success, color: '#FFFFFF' }}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download</span>
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              <X size={18} />
            </ButtonPressFeedback>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div
              ref={cardRef}
              className="w-full h-full overflow-y-auto hide-scrollbar shadow-2xl"
              style={{
                backgroundColor: '#FFFFFF',
                maxWidth: '450px',
                border: '3px solid #000000',
              }}
            >
              <div style={cardHeaderStyle}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <span
                      className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-1"
                      style={brandLabelStyle}
                    >
                      MOBYMON CARD
                    </span>
                    <h2
                      className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                      style={brandNameStyle}
                    >
                      {phone.brand?.toUpperCase()}
                    </h2>
                    <h1
                      className="text-[26px] font-black leading-tight mb-1"
                      style={modelNameStyle}
                    >
                      {phone.model_name.split(' ').slice(1).join(' ')}
                    </h1>
                    {phone.release_date_full && (
                      <p
                        className="text-[9px] font-semibold uppercase tracking-wide"
                        style={releaseDateStyle}
                      >
                        {formatReleaseDate(phone.release_date_full)}
                      </p>
                    )}
                  </div>
              
                  <div
                    style={imageContainerStyle}
                    className="flex-shrink-0 flex items-center justify-center"
                  >
                    {phone.main_image_url ? (
                      <img
                        src={getProxiedImageUrl(phone.main_image_url)}
                        alt={phone.model_name}
                        className="w-full h-full object-contain p-6"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Smartphone
                      size={60}
                      style={{
                        color: 'rgba(0,0,0,0.15)',
                        display: phone.main_image_url ? 'none' : 'block',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '30px 20px' }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <spec.icon
                          className="flex-shrink-0"
                          size={18}
                          style={{ color: 'rgba(0,0,0,0.5)' }}
                          strokeWidth={1.5}
                        />
                        <p
                          className="text-[9px] font-bold tracking-wide uppercase"
                          style={specLabelStyle}
                        >
                          {spec.label}
                        </p>
                      </div>
                      <p
                        className="text-base font-semibold leading-tight"
                        style={specValueStyle}
                      >
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between" style={footerStyle}>
                <div className="flex flex-col gap-2">
                  <div style={{ width: '40px', height: '40px' }}>
                    <img
                      src="/logowhite.svg"
                      alt="Mobylite"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-black tracking-[0.2em] uppercase"
                      style={footerLogoTextStyle}
                    >
                      MOBYMON ARCHIVE
                    </p>
                    <p
                      className="text-[8px] font-bold mt-0.5"
                      style={footerUrlStyle}
                    >
                      MOBYLITE.VERCEL.APP
                    </p>
                  </div>
                </div>

                {phone.price_usd && (
                  <div className="text-right">
                    <p
                      className="text-4xl font-extralight leading-none tracking-tight"
                      style={{ color: '#FFFFFF' }}
                    >
                      ${phone.price_usd}
                    </p>
                    <p
                      className="text-[7px] font-bold tracking-wide uppercase mt-3"
                      style={priceLabelStyle}
                    >
                      LAUNCH PRICE
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
    
