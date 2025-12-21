'use client';
import React, { useRef, useMemo } from 'react';
import { X, Download, Smartphone, Maximize2, Cpu, HardDrive, Camera, Battery, Wifi, Weight } from 'lucide-react';

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

    const clone = cardRef.current.cloneNode(true);
    const scale = 1080 / 562;
    
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-99999px';
    wrapper.style.top = '0';
    wrapper.style.width = '1080px';
    wrapper.style.height = '1920px';
    wrapper.style.overflow = 'hidden';
    
    clone.style.width = '562px';
    clone.style.maxWidth = '562px';
    clone.style.height = '1000px';
    clone.style.transformOrigin = 'top left';
    clone.style.transform = `scale(${scale})`;
    clone.style.overflow = 'hidden';
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(wrapper, {
        scale: 1,
        width: 1080,
        height: 1920,
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
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  const specs = useMemo(() => {
    const result = [];
    const phoneSpecs = phone.full_specifications?.specifications || {};
    const quickSpecs = phone.full_specifications?.quick_specs || {};

    const extractDisplayType = (displaytype) => {
      if (!displaytype) return "OLED";
      const match = displaytype.match(/(Foldable\s+)?(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
      const type = match ? match[0] : "OLED";
      const allHzMatches = displaytype.match(/(\d+)Hz/g);
      let refreshRate = "";
      if (allHzMatches) {
        for (const hzMatch of allHzMatches) {
          const value = parseInt(hzMatch);
          if (value >= 30 && value <= 240) {
            refreshRate = `${value}Hz`;
            break;
          }
        }
      }
      return refreshRate ? `${type} · ${refreshRate}` : type;
    };

    const extractBrightness = (displaytype) => {
      if (!displaytype) return null;
      const peakMatch = displaytype.match(/(\d+)\s*nits\s*\(peak\)/i);
      if (peakMatch) return `${peakMatch[1]} nits`;
      const match = displaytype.match(/(\d+)\s*nits/i);
      return match ? `${match[1]} nits` : null;
    };

    if (phone.screen_size) {
      const displayType = extractDisplayType(quickSpecs.displaytype);
      const brightness = extractBrightness(quickSpecs.displaytype);
      result.push({
        icon: Maximize2,
        label: 'Display',
        main: `${phone.screen_size}"`,
        sub: displayType,
        extra: brightness
      });
    }

    if (phone.chipset) {
      result.push({ 
        icon: Cpu, 
        label: 'Chipset', 
        main: phone.chipset.split(' ').slice(0, 2).join(' '),
        sub: phone.chipset.split(' ').slice(2).join(' ')
      });
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
        main: memoryData.ram || '',
        sub: memoryData.storage || ''
      });
    }

    const extractMainCamera = (cam1modules) => {
      if (!cam1modules) return null;
      const regex = /(\d+)\s*MP/i;
      const match = regex.exec(cam1modules);
      return match ? `${match[1]}MP` : null;
    };

    const extractCameraCount = (cam1modules) => {
      if (!cam1modules) return null;
      const cameras = cam1modules.split(/\d+\s*MP/).length - 1;
      return cameras > 1 ? `${cameras} Cameras` : null;
    };

    const mainCam = extractMainCamera(quickSpecs.cam1modules);
    const camCount = extractCameraCount(quickSpecs.cam1modules);

    if (mainCam) {
      result.push({ 
        icon: Camera, 
        label: 'Camera', 
        main: mainCam,
        sub: camCount
      });
    }

    if (phone.battery_capacity) {
      const wireless = phoneSpecs.Battery?.Charging?.includes('wireless') ? 'Wireless' : null;
      result.push({ 
        icon: Battery, 
        label: 'Battery', 
        main: `${phone.battery_capacity}mAh`,
        sub: phone.fast_charging_w ? `${phone.fast_charging_w}W` : 'Fast',
        extra: wireless
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
      result.push({ icon: Wifi, label: 'Connectivity', main: wifi });
    }

    if (phone.weight_g) {
      result.push({ 
        icon: Weight, 
        label: 'Weight', 
        main: `${phone.weight_g}g`,
        sub: phone.thickness_mm ? `${phone.thickness_mm}mm` : null
      });
    }

    return result.slice(0, 6);
  }, [phone]);

  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return '';
    const match = dateStr.match(/(\d{4}),?\s+(\w+)/);
    return match ? `${match[2]} ${match[1]}` : dateStr.replace(/(Released|Announced)\s+/i, '').trim();
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .spec-item {
          animation: fadeInUp 0.4s ease-out backwards;
        }
        
        .spec-item:nth-child(1) { animation-delay: 0.1s; }
        .spec-item:nth-child(2) { animation-delay: 0.15s; }
        .spec-item:nth-child(3) { animation-delay: 0.2s; }
        .spec-item:nth-child(4) { animation-delay: 0.25s; }
        .spec-item:nth-child(5) { animation-delay: 0.3s; }
        .spec-item:nth-child(6) { animation-delay: 0.35s; }
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
        <div className="relative w-full h-full flex flex-col p-2 sm:p-4" style={{ maxWidth: '562px' }}>
          <div className="flex justify-end gap-2 sm:gap-3 mb-3 sm:mb-4 w-full">
            <ButtonPressFeedback
              onClick={downloadCard}
              className="px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Save</span>
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-2xl backdrop-blur-md transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </ButtonPressFeedback>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div
              ref={cardRef}
              className="w-full hide-scrollbar"
              style={{
                background: 'linear-gradient(165deg, #0a0a0a 0%, #1a1a1a 100%)',
                width: '100%',
                maxWidth: '562px',
                aspectRatio: '9/16',
                fontFamily: 'DM Sans, sans-serif',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '300px',
                background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15), transparent 50%)',
                pointerEvents: 'none'
              }} />

              <div style={{ padding: '40px 36px 28px 36px', flex: '0 0 auto', position: 'relative', zIndex: 1 }}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div 
                      className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-2"
                      style={{ color: '#6366f1', letterSpacing: '0.2em' }}
                    >
                      {phone.brand}
                    </div>
                    <h1
                      className="text-[42px] font-normal leading-[0.95] mb-2"
                      style={{ 
                        color: '#ffffff',
                        fontFamily: 'DM Serif Display, serif',
                        fontWeight: 400,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {phone.model_name.split(' ').slice(1).join(' ')}
                    </h1>
                    {phone.release_date_full && (
                      <div 
                        className="text-[11px] font-medium tracking-wide"
                        style={{ color: '#525252', letterSpacing: '0.05em' }}
                      >
                        {formatReleaseDate(phone.release_date_full)}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      width: '110px',
                      height: '130px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                      borderRadius: '16px',
                      flexShrink: 0,
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                    className="flex items-center justify-center"
                  >
                    {phone.main_image_url ? (
                      <img
                        src={getProxiedImageUrl(phone.main_image_url)}
                        alt={phone.model_name}
                        className="w-full h-full object-contain"
                        style={{ padding: '20px' }}
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
                        size={48}
                        style={{ color: 'rgba(99, 102, 241, 0.3)' }}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 36px', flex: '1 1 auto', overflow: 'auto', position: 'relative', zIndex: 1 }} className="hide-scrollbar">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingBottom: '20px' }}>
                  {specs.map((spec, i) => (
                    <div 
                      key={i}
                      className="spec-item"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '18px 16px',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <spec.icon
                          size={16}
                          style={{ color: '#6366f1' }}
                          strokeWidth={2}
                        />
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wider"
                          style={{ color: '#737373', letterSpacing: '0.1em' }}
                        >
                          {spec.label}
                        </span>
                      </div>
                      <div
                        className="text-[22px] font-semibold leading-tight mb-1"
                        style={{ color: '#ffffff', letterSpacing: '-0.01em' }}
                      >
                        {spec.main}
                      </div>
                      {spec.sub && (
                        <div
                          className="text-[11px] font-medium"
                          style={{ color: '#a3a3a3' }}
                        >
                          {spec.sub}
                        </div>
                      )}
                      {spec.extra && (
                        <div
                          className="text-[9px] font-medium mt-1 px-2 py-1 inline-block rounded-full"
                          style={{ 
                            color: '#6366f1', 
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}
                        >
                          {spec.extra}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div 
                style={{
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '24px 36px',
                  flex: '0 0 auto',
                  position: 'relative',
                  zIndex: 1,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{ width: '28px', height: '28px' }}>
                      <img
                        src="/logowhite.svg"
                        alt="Mobylite"
                        className="w-full h-full object-contain"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-[11px] font-semibold tracking-wide"
                        style={{ color: '#ffffff', letterSpacing: '0.05em' }}
                      >
                        MOBYLITE
                      </p>
                      <p
                        className="text-[9px] font-medium"
                        style={{ color: '#525252' }}
                      >
                        Archive
                      </p>
                    </div>
                  </div>

                  {phone.price_usd && (
                    <div className="text-right">
                      <div 
                        className="text-[9px] font-semibold tracking-wider uppercase mb-1"
                        style={{ color: '#737373', letterSpacing: '0.1em' }}
                      >
                        From
                      </div>
                      <div 
                        className="text-[32px] font-normal tracking-tight"
                        style={{ 
                          color: '#ffffff',
                          fontFamily: 'DM Serif Display, serif',
                          letterSpacing: '-0.02em'
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
      </div>
    </>
  );
      }
      
