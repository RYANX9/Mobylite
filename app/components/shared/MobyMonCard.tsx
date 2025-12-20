
'use client';
import React, { useRef, useMemo } from 'react';
import { X, Download, Smartphone, Sun, Cpu, Camera, Battery, HardDrive, Wifi, Zap, Maximize2, Ruler, Weight } from 'lucide-react';

const ButtonPressFeedback = ({ onClick, className, style, children }) => (
  <button onClick={onClick} className={className} style={style}>
    {children}
  </button>
);

const color = {
  success: '#10b981',
  bg: '#f3f4f6',
  text: '#111827'
};

export default function MobyMonCard({ phone = samplePhone, onClose = () => {} }) {
  const cardRef = useRef(null);

  const getProxiedImageUrl = (url) => {
    if (!url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    const originalWidth = cardRef.current.style.width;
    cardRef.current.style.width = '450px';

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        width: 450,
        windowWidth: 450,
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
      cardRef.current.style.width = originalWidth;
    }
  };

  const specs = useMemo(() => {
    const result = [];
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
            refreshRate = ` (${value}Hz)`;
            break;
          }
        }
      }
      
      return `${type}${refreshRate}`;
    };

    const extractBrightness = (displaytype) => {
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

    const parseMemoryOptions = (internalMemory) => {
      if (!internalMemory) return { ram: "", storage: "" };
    
      const combos = internalMemory.split(',');
      
      const ramSet = new Set();
      const storageSet = new Set();
    
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

    const extractMainCamera = (cam1modules) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP (f/${match[2]})` : null;
    };

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'MAIN CAMERA', value: mainCam });
    }

    const extractUltrawideCamera = (cam1modules) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP (f/${match[2]})` : null;
    };

    const ultrawideCam = extractUltrawideCamera(quickSpecs.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'ULTRAWIDE CAMERA', value: ultrawideCam });
    }

    const extractFrontCamera = (cam2modules) => {
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

    const extractDetailedCharging = (chargingStr, wiredW) => {
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

    const extractWiFi = (wlan) => {
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

    const extractDimensions = (dimensions) => {
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

  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/(Released|Announced)\s+/i, '').trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-md h-full flex flex-col">
        <div className="flex justify-end gap-2 sm:gap-3 mb-3 sm:mb-4 w-full px-2">
          <ButtonPressFeedback
            onClick={downloadCard}
            className="px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: color.success, color: '#FFFFFF' }}
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Download</span>
          </ButtonPressFeedback>
          <ButtonPressFeedback
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-lg"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </ButtonPressFeedback>
        </div>

        <div className="flex-1 overflow-auto flex items-start sm:items-center justify-center px-2">
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
                padding: '5px 20px',
                borderBottom: '3px solid #000000',
              }}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className="block text-[7px] sm:text-[8px] font-bold tracking-[0.3em] uppercase mb-0.5 sm:mb-1"
                    style={{ color: 'rgba(0,0,0,0.25)' }}
                  >
                    MOBYMON CARD
                  </span>
                  <h2
                    className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide mb-0.5"
                    style={{ color: '#9ca3af' }}
                  >
                    {phone.brand?.toUpperCase()}
                  </h2>
                  <h1
                    className="text-xl sm:text-2xl font-black leading-tight mb-0.5 sm:mb-1"
                    style={{ color: '#000000', fontFamily: 'Young Serif' }}
                  >
                    {phone.model_name.split(' ').slice(1).join(' ')}
                  </h1>
                  {phone.release_date_full && (
                    <p
                      className="text-[7px] sm:text-[8px] font-semibold uppercase tracking-wide"
                      style={{ color: 'rgba(0,0,0,0.35)' }}
                    >
                      {formatReleaseDate(phone.release_date_full)}
                    </p>
                  )}
                </div>
            
                <div
                  style={{
                    width: '100px',
                    height: '125px',
                    backgroundColor: '#f9f9f9',
                    border: '3px solid #222222',
                  }}
                  className="flex-shrink-0 flex items-center justify-center sm:w-[120px] sm:h-[150px]"
                >
                  {phone.main_image_url ? (
                    <img
                      src={getProxiedImageUrl(phone.main_image_url)}
                      alt={phone.model_name}
                      className="w-full h-full object-contain p-4 sm:p-6"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <Smartphone
                    size={50}
                    className="sm:w-[60px] sm:h-[60px]"
                    style={{
                      color: 'rgba(0,0,0,0.15)',
                      display: phone.main_image_url ? 'none' : 'block',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 20px' }} className="sm:p-[30px]">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5">
                {specs.map((spec, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                      <spec.icon
                        className="flex-shrink-0"
                        size={18}
                        style={{ color: 'rgba(0,0,0,0.5)' }}
                        strokeWidth={1.5}
                      />
                      <p
                        className="text-[8px] sm:text-[9px] font-bold tracking-wide uppercase"
                        style={{ color: 'rgba(0,0,0,0.4)' }}
                      >
                        {spec.label}
                      </p>
                    </div>
                    <p
                      className="text-sm sm:text-base font-semibold leading-tight"
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
                padding: '20px 20px',
                borderTop: '3px solid #000000',
              }}
            >
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div style={{ width: '35px', height: '35px' }} className="sm:w-[40px] sm:h-[40px]">
                  <img
                    src="/logowhite.svg"
                    alt="Mobylite"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p
                    className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    MOBYMON ARCHIVE
                  </p>
                  <p
                    className="text-[7px] sm:text-[8px] font-bold mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    MOBYLITE.VERCEL.APP
                  </p>
                </div>
              </div>

              {phone.price_usd && (
                <div className="text-right">
                  <p
                    className="text-3xl sm:text-4xl font-extralight leading-none tracking-tight"
                    style={{ color: '#FFFFFF' }}
                  >
                    ${phone.price_usd}
                  </p>
                  <p
                    className="text-[6px] sm:text-[7px] font-bold tracking-wide uppercase mt-2 sm:mt-3"
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
