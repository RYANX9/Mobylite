'use client';
import React, { useRef, useMemo } from 'react';
import { X, Download, Smartphone, Sun, Cpu, Camera, Battery, HardDrive, Wifi, Zap, Maximize2, Ruler, Weight } from 'lucide-react';
import { Phone } from '@/lib/types';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { color, font } from '@/lib/tokens';
import html2canvas from 'html2canvas';

interface MobyMonCardProps {
  phone: Phone;
  onClose: () => void;
}

interface Spec {
  icon: any;
  label: string;
  value: string;
}

export default function MobyMonCard({ phone, onClose }: MobyMonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const getProxiedImageUrl = (url: string | null) => {
    if (!url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
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
    }
  };

  const specs = useMemo(() => {
    const result: Spec[] = [];
    const phoneSpecs = phone.full_specifications?.specifications || {};
    const quickSpecs = phone.full_specifications?.quick_specs || {};

      const extractDisplayType = (displaytype) => {
      if (!displaytype) return "OLED";
      
      const match = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
      const type = match ? match[0] : "OLED";
      
      // Extract refresh rate - only valid display refresh rates (60, 90, 120, 144, etc.)
      // Ignore PWM frequencies which are typically 1000Hz+
      const allHzMatches = displaytype.match(/(\d+)Hz/g);
      let refreshRate = "";
      
      if (allHzMatches) {
        for (const hzMatch of allHzMatches) {
          const value = parseInt(hzMatch);
          // Standard display refresh rates are typically between 30-240Hz
          // PWM frequencies are usually 1000Hz+
          if (value >= 30 && value <= 240) {
            refreshRate = ` (${value}Hz)`;
            break;
          }
        }
      }
      
      return `${type}${refreshRate}`;
    };


    const extractBrightness = (displaytype: string) => {
      if (!displaytype) return null;
      const match = displaytype.match(/(\d+)\s*nits/i);
      return match ? match[0] : null;
    };

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

    const parseMemoryOptions = (internalMemory: string) => {
      if (!internalMemory) return { ram: "", storage: "" };
    
      // Split by comma to get individual combos like "256GB 12GB RAM"
      const combos = internalMemory.split(',');
      
      const ramSet = new Set<string>();
      const storageSet = new Set<string>();
    
      combos.forEach(combo => {
        // Find all numbers followed by GB or TB
        const matches = combo.match(/(\d+)(GB|TB)/gi);
        
        if (matches) {
          matches.forEach(match => {
            const value = parseInt(match);
            const isTB = match.toLowerCase().includes('tb');
            
            // Logic: RAM is currently < 32GB, Storage is >= 64GB or is in TB
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


    const extractMainCamera = (cam1modules: string) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP (f/${match[2]})` : null;
    };

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'MAIN CAMERA', value: mainCam });
    }

    const extractUltrawideCamera = (cam1modules: string) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP (f/${match[2]})` : null;
    };

    const ultrawideCam = extractUltrawideCamera(quickSpecs.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'ULTRAWIDE CAMERA', value: ultrawideCam });
    }

    const extractFrontCamera = (cam2modules: string) => {
      if (!cam2modules) return null;
      const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
      const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
      if (mpMatch && apertureMatch) return `${mpMatch[1]}MP (f/${apertureMatch[1]})`;
      return mpMatch ? `${mpMatch[1]}MP` : null;
    };

    const frontCam = extractFrontCamera(quickSpecs.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'FRONT CAMERA', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'BATTERY', value: `${phone.battery_capacity} mAh` });
    }

    const extractDetailedCharging = (chargingStr: string, wiredW: number | null) => {
      if (!chargingStr) return wiredW ? `${wiredW}W (Wired)` : "Fast Charging";

      // 1. Identify the Wireless speed and type
      // Looks for a number followed by W near wireless keywords
      const wirelessMatch = chargingStr.match(/(\d+)W\s*(?=wireless|Qi2|MagSafe|magnetic)/i);
      const wirelessW = wirelessMatch ? wirelessMatch[1] : null;
      
      // 2. Identify wireless standard
      let wirelessType = "Wireless";
      if (/Qi2/i.test(chargingStr)) wirelessType = "Qi2";
      else if (/MagSafe/i.test(chargingStr)) wirelessType = "MagSafe";

      // 3. Build the string
      const wiredPart = wiredW ? `${wiredW}W (Wired)` : "";
      const wirelessPart = wirelessW ? `${wirelessW}W (${wirelessType})` : "";

      if (wiredPart && wirelessPart) return `${wiredPart} / ${wirelessPart}`;
      return wiredPart || wirelessPart || "Fast Charging";
    };

    if (phone.fast_charging_w || phoneSpecs.Battery?.Charging) {
      const chargingDisplay = extractDetailedCharging(
        phoneSpecs.Battery?.Charging, 
        phone.fast_charging_w
      );
      
      result.push({
        icon: Zap,
        label: 'CHARGING',
        value: chargingDisplay
      });
    }
    

    const extractWiFi = (wlan: string) => {
      if (!wlan) return null;
      if (/7|be/i.test(wlan)) return 'Wi-Fi 7';
      if (/6e/i.test(wlan)) return 'Wi-Fi 6E';
      if (/6|ax/i.test(wlan)) return 'Wi-Fi 6';
      return 'Wi-Fi';
    };

    const wifi = extractWiFi(quickSpecs.wlan);
    if (wifi) {
      result.push({ icon: Wifi, label: 'WI-FI', value: wifi });
    }

    const extractDimensions = (dimensions: string) => {
      if (!dimensions) return null;
      const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
      return match ? `${match[1]} mm` : null;
    };

    const dimensions = extractDimensions(phoneSpecs.Body?.Dimensions);
    if (dimensions) {
      result.push({ icon: Ruler, label: 'DIMENSIONS', value: dimensions });
    }

    if (phone.weight_g) {
      result.push({ icon: Weight, label: 'WEIGHT', value: `${phone.weight_g}g` });
    }

    return result.slice(0, 12);
  }, [phone]);

  const formatReleaseDate = (dateStr: string) => {
    if (!dateStr) return '';
  // Removes "Released" or "Announced" and keeps the specific date
  // e.g., "Released 2025, August 20" -> "2025, August 20"
    return dateStr.replace(/(Released|Announced)\s+/i, '').trim();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center">
        <div className="flex justify-end gap-3 mb-4 w-full">
          <ButtonPressFeedback
            onClick={downloadCard}
            className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: color.success, color: '#FFFFFF' }}
          >
            <Download size={18} />
            Download
          </ButtonPressFeedback>
          <ButtonPressFeedback
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            <X size={18} />
          </ButtonPressFeedback>
        </div>

        <div className="w-full h-full max-h-[calc(100vh-100px)] overflow-auto flex items-center justify-center">
          <div
            ref={cardRef}
            className="w-full overflow-hidden shadow-2xl"
            style={{
              backgroundColor: '#FFFFFF',
              maxWidth: '450px',
              border: '3px solid #000000',
            }}
          >
            <div
              className="relative"
              style={{
                padding: '40px 40px 32px 40px',
                borderBottom: '3px solid #000000',
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <span
                    className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-2"
                    style={{ color: 'rgba(0,0,0,0.25)' }}
                  >
                    MOBYMON CARD
                  </span>
                  <h2
                    className="text-xs font-medium uppercase tracking-wide mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    {phone.brand?.toUpperCase()}
                  </h2>
                  <h1
                    className="text-3xl font-black leading-tight mb-2"
                    style={{ color: '#000000', fontFamily: 'Young Serif' }}
                  >
                    {/* Splits the string and removes the first word */}
                    {phone.model_name.split(' ').slice(1).join(' ')}
                  </h1>
                  {phone.release_date_full && (
                    <p
                      className="text-[9px] font-semibold uppercase tracking-wide"
                      style={{ color: 'rgba(0,0,0,0.35)' }}
                    >
                      {formatReleaseDate(phone.release_date_full)}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    width: '120px',
                    height: '150px',
                    backgroundColor: '#f9f9f9',
                    border: '3px solid #222222',
                  }}
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

            <div style={{ padding: '30px 30px' }}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {specs.map((spec, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <spec.icon
                        className="flex-shrink-0"
                        size={20}
                        style={{ color: 'rgba(0,0,0,0.5)' }}
                        strokeWidth={1.5}
                      />
                      <p
                        className="text-[9px] font-bold tracking-wide uppercase mb-1.4"
                        style={{ color: 'rgba(0,0,0,0.4)' }}
                      >
                        {spec.label}
                      </p>
                    </div>
                    <p
                      className="text-base font-semibold leading-tight"
                      style={{ color: '#000000' }}
                    >
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-between"
              style={{
                backgroundColor: '#000000',
                padding: '24px 40px',
                borderTop: '3px solid #000000',
              }}
            >
              {/* Changed to flex-col and removed items-center to align left */}
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
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    MOBYMON ARCHIVE
                  </p>
                  <p
                    className="text-[8px] font-bold mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
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
                    style={{ color: 'rgba(255,255,255,0.7)' }}
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
  );
}
