'use client';
import React, { useRef, useMemo } from 'react';
import { X, Download, Smartphone, Maximize2, Cpu, Camera, Battery, HardDrive, Wifi, Weight } from 'lucide-react';

const ButtonPressFeedback = ({ onClick, className, style, children }) => (
  <button onClick={onClick} className={className} style={style}>
    {children}
  </button>
);

export default function MobyMonCard({ phone = samplePhone, onClose = () => {} }) {
  const cardRef = useRef(null);

  const getProxiedImageUrl = (url) => {
    if (!url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const originalElement = cardRef.current;
      // Define our target width for the high-res export
      const targetWidth = 1080;
      const currentWidth = originalElement.offsetWidth;
      // Calculate exact scale to reach 1080px
      const scale = targetWidth / currentWidth;

      const canvas = await html2canvas(originalElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        // Remove manual width/height/windowWidth/windowHeight to 
        // prevent rounding mismatches that cause white borders
      });

      const link = document.createElement('a');
      link.download = `mobymon-${phone.brand}-${phone.model_name}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
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
            refreshRate = ` ${value}Hz`;
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

    const extractFrameMaterial = (build) => {
      if (!build) return null;
      if (/titanium/i.test(build)) {
        const gradeMatch = build.match(/Grade\s+(\d+)/i);
        return gradeMatch ? `Titanium (Grade ${gradeMatch[1]})` : "Titanium";
      }
      if (/aluminum|aluminium/i.test(build)) return "Aluminum";
      if (/steel/i.test(build)) return "Steel";
      if (/plastic/i.test(build)) return "Plastic";
      return null;
    };

    if (phone.screen_size) {
      const displayType = extractDisplayType(quickSpecs.displaytype);
      const brightness = extractBrightness(quickSpecs.displaytype);
      const displayValue = brightness 
        ? `${phone.screen_size}" ${displayType} • ${brightness}`
        : `${phone.screen_size}" ${displayType}`;
      result.push({
        icon: Maximize2,
        label: 'Display',
        value: displayValue
      });
    }

    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'Chipset', value: phone.chipset });
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
        ram: Array.from(ramSet).join('/'),
        storage: Array.from(storageSet).join('/')
      };
    };
    
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

    const extractMainCamera = (cam1modules) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP • f/${match[2]}` : null;
    };

    const extractUltrawideCamera = (cam1modules) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP • f/${match[2]}` : null;
    };

    const extractFrontCamera = (cam2modules) => {
      if (!cam2modules) return null;
      const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
      const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
      if (mpMatch && apertureMatch) return `${mpMatch[1]}MP • f/${apertureMatch[1]}`;
      return mpMatch ? `${mpMatch[1]}MP` : null;
    };

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    const ultrawideCam = extractUltrawideCamera(quickSpecs.cam1modules);
    const frontCam = extractFrontCamera(quickSpecs.cam2modules);

    if (mainCam && ultrawideCam && frontCam) {
      result.push({ 
        icon: Camera, 
        label: 'Cameras', 
        value: `${mainCam} • ${ultrawideCam} • ${frontCam}` 
      });
    } else if (mainCam && ultrawideCam) {
      result.push({ 
        icon: Camera, 
        label: 'Cameras', 
        value: `${mainCam} • ${ultrawideCam}` 
      });
    } else if (mainCam) {
      result.push({ icon: Camera, label: 'Camera', value: mainCam });
    }

    const extractDetailedCharging = (chargingStr, wiredW) => {
      if (!chargingStr) return wiredW ? `${wiredW}W` : "Fast";
      const wirelessMatch = chargingStr.match(/(\d+)W\s*(?=wireless|Qi2|MagSafe|magnetic)/i);
      const wirelessW = wirelessMatch ? wirelessMatch[1] : null;
      const wiredPart = wiredW ? `${wiredW}W` : "";
      const wirelessPart = wirelessW ? `${wirelessW}W Wireless` : "";
      if (wiredPart && wirelessPart) return `${wiredPart} • ${wirelessPart}`;
      return wiredPart || wirelessPart || "Fast";
    };

    if (phone.battery_capacity) {
      const chargingDisplay = extractDetailedCharging(
        phoneSpecs.Battery?.Charging, 
        phone.fast_charging_w
      );
      result.push({ 
        icon: Battery, 
        label: 'Battery', 
        value: `${phone.battery_capacity} mAh • ${chargingDisplay}` 
      });
    }

    const extractWiFi = (wlan) => {
      if (!wlan) return null;
      if (/7|be/i.test(wlan)) return 'Wi-Fi 7';
      if (/6e/i.test(wlan)) return 'Wi-Fi 6E';
      if (/6|ax/i.test(wlan)) return 'Wi-Fi 6';
      return 'Wi-Fi 5';
    };

    const wifi = extractWiFi(quickSpecs.wlan);
    if (wifi) {
      result.push({ icon: Wifi, label: 'Connectivity', value: wifi });
    }

    const extractDimensions = (dimensions) => {
      if (!dimensions) return null;
      const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
      return match ? match[1] : null;
    };

    const dimensions = extractDimensions(phoneSpecs.Body?.Dimensions);
    if (phone.weight_g && dimensions) {
      const frameMaterial = extractFrameMaterial(phoneSpecs.Body?.Build);
      const buildInfo = frameMaterial ? ` • ${frameMaterial}` : "";
      result.push({ 
        icon: Weight, 
        label: 'Dimensions', 
        value: `${dimensions} mm • ${phone.weight_g}g${buildInfo}` 
      });
    } else if (phone.weight_g) {
      const frameMaterial = extractFrameMaterial(phoneSpecs.Body?.Build);
      const weightValue = frameMaterial 
        ? `${phone.weight_g}g • ${frameMaterial}`
        : `${phone.weight_g}g`;
      result.push({ icon: Weight, label: 'Weight & Build', value: weightValue });
    }

    return result.slice(0, 8);
  }, [phone]);

  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/(Released|Announced)\s+/i, '').trim();
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="relative w-full h-full flex flex-col p-2 sm:p-4" style={{ maxWidth: '562px' }}>
          <div className="flex justify-end gap-2 sm:gap-3 mb-3 sm:mb-4 w-full">
            <ButtonPressFeedback
              onClick={downloadCard}
              className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: '#1a1a1a', color: '#FFFFFF' }}
            >
              <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Save</span>
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-lg"
              style={{ backgroundColor: '#525252', color: '#FFFFFF' }}
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </ButtonPressFeedback>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div
              ref={cardRef}
              className="w-full hide-scrollbar"
              style={{
                backgroundColor: '#FFFFFF',
                width: '100%',
                maxWidth: '562px',
                aspectRatio: '9/16',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '48px 42px 32px 42px', flex: '0 0 auto' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1" style={{ paddingRight: '24px' }}>
                    <div 
                      className="text-sm font-medium tracking-[0.15em] uppercase mb-3"
                      style={{ color: '#a3a3a3', letterSpacing: '0.15em' }}
                    >
                      {phone.brand}
                    </div>
                    <h1
                      className="text-5xl font-bold leading-[1.1] mb-3"
                      style={{ 
                        color: '#171717',
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 700,
                      }}
                    >
                      {phone.model_name.split(' ').slice(1).join(' ')}
                    </h1>
                    {phone.release_date_full && (
                      <div 
                        className="text-xs font-medium"
                        style={{ color: '#d4d4d4' }}
                      >
                        {formatReleaseDate(phone.release_date_full)}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      width: '140px',
                      height: '160px',
                      backgroundColor: '#fafafa',
                      borderRadius: '12px',
                      flexShrink: 0,
                    }}
                    className="flex items-center justify-center"
                  >
                    {phone.main_image_url ? (
                      <img
                        src={getProxiedImageUrl(phone.main_image_url)}
                        alt={phone.model_name}
                        className="w-full h-full object-contain"
                        style={{ padding: '24px' }}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling;
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
                        size={60}
                        style={{ color: '#e5e5e5' }}
                        strokeWidth={1}
                      />
                    </div>
                  </div>
                </div>

                <div 
                  className="text-sm font-medium tracking-wider uppercase mb-4"
                  style={{ color: '#a3a3a3' }}
                >
                  Specifications
                </div>

                <div 
                  style={{ 
                    height: '1px', 
                    backgroundColor: '#f5f5f5',
                    margin: '0 0 2px 0',
                  }} 
                />
              </div>

              <div style={{ padding: '0 42px', flex: '1 1 auto', overflow: 'auto' }} className="hide-scrollbar">
                <div className="space-y-0">
                  {specs.map((spec, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between py-4"
                      style={{
                        borderBottom: i < specs.length - 1 ? '1px solid #f5f5f5' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <spec.icon
                          size={20}
                          style={{ color: '#a3a3a3' }}
                          strokeWidth={1.5}
                        />
                        <span
                          className="text-base font-medium"
                          style={{ color: '#737373' }}
                        >
                          {spec.label}
                        </span>
                      </div>
                      <span
                        className="text-base font-medium text-right"
                        style={{ color: '#171717', maxWidth: '60%' }}
                      >
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div 
                className="flex items-center justify-between px-10 py-7"
                style={{
                  backgroundColor: '#fafafa',
                  borderTop: '1px solid #f5f5f5',
                  flex: '0 0 auto',
                }}
              >
                <div className="flex items-center gap-4">
                  <div style={{ width: '36px', height: '36px' }}>
                    <img
                      src="/logo.svg"
                      alt="Mobylite"
                      className="w-full h-full object-contain"
                  
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: '#171717' }}
                    >
                      Mobylite
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: '#a3a3a3' }}
                    >
                      MobyMon Archive
                    </p>
                  </div>
                </div>

                {phone.price_usd && (
                  <div className="text-right">
                    <div 
                      className="text-xs font-medium tracking-wider uppercase mb-1"
                      style={{ color: '#a3a3a3' }}
                    >
                      From
                    </div>
                    <div 
                      className="text-4xl font-light tracking-tight"
                      style={{ 
                        color: '#171717',
                        fontFamily: 'Playfair Display, serif',
                      }}
                    >
                      ${phone.price_usd}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
        }
                      
