'use client';
import React, { useRef, useMemo } from 'react';
import { X, Download, Smartphone, Sun, Cpu, Camera, Battery, HardDrive, Wifi, Zap, Maximize2, Ruler, Weight, Sparkles } from 'lucide-react';
import { Phone } from '@/lib/types';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { color } from '@/lib/tokens';
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
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        width: 450,
        backgroundColor: '#0a0a0a',
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

  const specs = useMemo(() => {
    const result: Spec[] = [];
    const phoneSpecs = phone.full_specifications?.specifications || {};
    const quickSpecs = phone.full_specifications?.quick_specs || {};

    const extractDisplayType = (displaytype) => {
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
    
    const memoryData = parseMemoryOptions(quickSpecs.internalmemory);
    
    if (memoryData.ram || memoryData.storage) {
      result.push({
        icon: HardDrive,
        label: 'MEMORY',
        value: memoryData.ram && memoryData.storage 
          ? `${memoryData.ram} • ${memoryData.storage}`
          : (memoryData.ram || memoryData.storage)
      });
    }

    const extractMainCamera = (cam1modules: string) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP • f/${match[2]}` : null;
    };

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'MAIN', value: mainCam });
    }

    const extractUltrawideCamera = (cam1modules: string) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP • f/${match[2]}` : null;
    };

    const ultrawideCam = extractUltrawideCamera(quickSpecs.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'ULTRA', value: ultrawideCam });
    }

    const extractFrontCamera = (cam2modules: string) => {
      if (!cam2modules) return null;
      const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
      const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
      if (mpMatch && apertureMatch) return `${mpMatch[1]}MP • f/${apertureMatch[1]}`;
      return mpMatch ? `${mpMatch[1]}MP` : null;
    };

    const frontCam = extractFrontCamera(quickSpecs.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'SELFIE', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'BATTERY', value: `${phone.battery_capacity} mAh` });
    }

    const extractDetailedCharging = (chargingStr: string, wiredW: number | null) => {
      if (!chargingStr) return wiredW ? `${wiredW}W` : "Fast";

      const wirelessMatch = chargingStr.match(/(\d+)W\s*(?=wireless|Qi2|MagSafe|magnetic)/i);
      const wirelessW = wirelessMatch ? wirelessMatch[1] : null;

      const wiredPart = wiredW ? `${wiredW}W` : "";
      const wirelessPart = wirelessW ? `${wirelessW}W Wireless` : "";

      if (wiredPart && wirelessPart) return `${wiredPart} • ${wirelessPart}`;
      return wiredPart || wirelessPart || "Fast";
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
      return 'Wi-Fi 5';
    };

    const wifi = extractWiFi(quickSpecs.wlan);
    if (wifi) {
      result.push({ icon: Wifi, label: 'CONNECTIVITY', value: wifi });
    }

    const extractDimensions = (dimensions: string) => {
      if (!dimensions) return null;
      const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
      return match ? match[1] : null;
    };

    const dimensions = extractDimensions(phoneSpecs.Body?.Dimensions);
    if (dimensions) {
      result.push({ icon: Ruler, label: 'SIZE', value: `${dimensions} mm` });
    }

    if (phone.weight_g) {
      result.push({ icon: Weight, label: 'WEIGHT', value: `${phone.weight_g}g` });
    }

    return result.slice(0, 12);
  }, [phone]);

  const formatReleaseDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.replace(/(Released|Announced)\s+/i, '').trim();
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
        <div className="relative w-full max-w-md h-full flex flex-col p-2 sm:p-4">
          <div className="flex justify-end gap-2 sm:gap-3 mb-3 sm:mb-4 w-full">
            <ButtonPressFeedback
              onClick={downloadCard}
              className="px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: '#8b5cf6', color: '#FFFFFF' }}
            >
              <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Save</span>
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-lg"
              style={{ backgroundColor: '#1f2937', color: '#FFFFFF' }}
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </ButtonPressFeedback>
          </div>

          <div className="flex-1 flex items-start sm:items-center justify-center">
            <div
              ref={cardRef}
              className="w-full h-full overflow-y-auto overflow-x-hidden shadow-2xl hide-scrollbar"
              style={{
                backgroundColor: '#0a0a0a',
                maxWidth: '450px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
                  padding: '24px 20px 140px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-100px',
                    right: '-100px',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }}
                />

                <div className="flex items-center gap-2 mb-3" style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <p
                      className="text-[10px] font-black tracking-wider uppercase"
                      style={{ color: '#ffffff' }}
                    >
                      {phone.brand}
                    </p>
                  </div>
                  {phone.release_date_full && (
                    <p
                      className="text-[9px] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {formatReleaseDate(phone.release_date_full)}
                    </p>
                  )}
                </div>

                <h1
                  className="text-4xl sm:text-5xl font-black leading-[1.1] mb-4"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {phone.model_name.split(' ').slice(1).join(' ')}
                </h1>

                {phone.price_usd && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <span
                      className="text-3xl font-black"
                      style={{ color: '#ffffff' }}
                    >
                      ${phone.price_usd}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      USD
                    </span>
                  </div>
                )}
              </div>

              <div className="relative -mt-24 px-5 mb-5">
                <div
                  style={{
                    width: '100%',
                    maxWidth: '260px',
                    height: '260px',
                    margin: '0 auto',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    padding: '3px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '21px',
                      background: '#0f0f0f',
                      overflow: 'hidden',
                    }}
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
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        display: phone.main_image_url ? 'none' : 'flex',
                      }}
                    >
                      <Smartphone
                        size={70}
                        style={{ color: 'rgba(255,255,255,0.1)' }}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 20px 24px 20px' }}>
                <div className="grid grid-cols-2 gap-3">
                  {specs.map((spec, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid #262626',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <spec.icon
                            size={14}
                            style={{ color: '#ffffff' }}
                            strokeWidth={2.5}
                          />
                        </div>
                        <p
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: '#737373' }}
                        >
                          {spec.label}
                        </p>
                      </div>
                      <p
                        className="text-[13px] font-bold leading-tight"
                        style={{ color: '#e5e5e5' }}
                      >
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src="/logowhite.svg"
                      alt="Mobylite"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-wider"
                      style={{ color: '#ffffff' }}
                    >
                      Mobylite
                    </p>
                    <p
                      className="text-[9px] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      MobyMon Archive
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Sparkles size={16} style={{ color: '#fbbf24' }} fill="#fbbf24" />
                  <p
                    className="text-xs font-black"
                    style={{ color: '#ffffff' }}
                  >
                    PREMIUM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
