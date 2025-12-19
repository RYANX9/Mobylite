import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Download, 
  Smartphone, 
  Camera, 
  Cpu, 
  Battery,
  Bolt,
  Scaling,
  Sun,
  MemoryStick,
  Wifi,
  Ruler as RulerIcon,
  Weight as WeightIcon,
  X
} from 'lucide-react';

const CARD_DIMENSIONS = {
  width: 708,
  height: 1000,
  sections: {
    header: 280,
    specs: 580,
    footer: 140
  },
  padding: {
    outer: 40,
    inner: 32
  }
};

const SOCIAL_MEDIA_SPECS = {
  instagram: { width: 1080, height: 1080, scale: 1.53 },
  story: { width: 1080, height: 1920, scale: 1.53 },
  twitter: { width: 1200, height: 675, scale: 1.69 }
};

class SpecExtractor {
  static displayType(displaytype) {
    if (!displaytype) return "LTPO AMOLED";
    const typeMatch = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
    const refreshMatch = displaytype.match(/(\d+)Hz/);
    const type = typeMatch ? typeMatch[0] : "LTPO AMOLED";
    return refreshMatch ? `${type} ${refreshMatch[1]}Hz` : type;
  }

  static brightness(displaytype) {
    if (!displaytype) return null;
    const match = displaytype.match(/(\d+)\s*nits/i);
    return match ? match[0] : null;
  }

  static camera(modules, type = 'main') {
    if (!modules) return null;
    const patterns = {
      main: /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i,
      ultrawide: /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i,
      front: /(\d+)\s*MP(?:,\s*f\/([0-9.]+))?/i
    };
    const match = modules.match(patterns[type]);
    if (!match) return null;
    return match[2] ? `${match[1]}MP f/${match[2]}` : `${match[1]}MP`;
  }

  static storage(internalmemory) {
    if (!internalmemory) return null;
    const matches = internalmemory.match(/(\d+(?:GB|TB))/g);
    return matches ? [...new Set(matches)].join(" / ") : null;
  }

  static chargingType(charging) {
    if (!charging) return "Fast";
    const types = ["MagSafe", "SuperVOOC", "HyperCharge", "Qi2", "SUPERVOOC", "FlashCharge"];
    for (const t of types) {
      if (new RegExp(t, "i").test(charging)) return t;
    }
    return "Fast";
  }

  static wifi(wlan) {
    if (!wlan) return null;
    if (/7|be/i.test(wlan)) return "Wi-Fi 7";
    if (/6e/i.test(wlan)) return "Wi-Fi 6E";
    if (/6|ax/i.test(wlan)) return "Wi-Fi 6";
    if (/5|ac/i.test(wlan)) return "Wi-Fi 5";
    return "Wi-Fi";
  }

  static dimensions(dimensions) {
    if (!dimensions) return null;
    const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
    return match ? `${match[1]} mm` : null;
  }
}

const MobyMonCard = ({ phone, onClose }) => {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [exportFormat, setExportFormat] = useState('default');
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touchEnd = e.changedTouches[0].clientY;
    if (touchStart - touchEnd < -100) {
      onClose();
    }
  }, [touchStart, onClose]);

  const imageUrl = useMemo(() => {
    if (!phone?.main_image_url) return null;
    return phone.main_image_url;
  }, [phone?.main_image_url]);

  const releaseDate = useMemo(() => {
    const specs = phone?.full_specifications?.specifications || {};
    const launch = specs.Launch;
    if (launch?.Released) return launch.Released;
    if (launch?.Announced) return `Announced ${launch.Announced}`;
    if (phone?.release_year) return phone.release_year;
    return null;
  }, [phone]);

  const keySpecs = useMemo(() => {
    if (!phone) return [];

    const specs = phone.full_specifications?.specifications || {};
    const quick = phone.full_specifications?.quick_specs || {};
    const result = [];

    const displayType = SpecExtractor.displayType(quick.displaytype);
    if (phone.screen_size || displayType) {
      result.push({ 
        icon: Scaling, 
        label: 'DISPLAY', 
        value: phone.screen_size ? `${phone.screen_size}" ${displayType}` : displayType
      });
    }

    const brightness = SpecExtractor.brightness(quick.displaytype);
    if (brightness) {
      result.push({ icon: Sun, label: 'BRIGHTNESS', value: brightness });
    }

    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'CHIPSET', value: phone.chipset });
    }

    const ram = phone.ram_options?.[0] ? `${phone.ram_options[0]}GB` : null;
    const storage = SpecExtractor.storage(quick.internalmemory);
    if (ram || storage) {
      const value = ram && storage ? `${ram} + ${storage}` : (ram || storage);
      result.push({ icon: MemoryStick, label: 'MEMORY', value });
    }

    const mainCam = SpecExtractor.camera(quick.cam1modules, 'main');
    if (mainCam) {
      result.push({ icon: Camera, label: 'MAIN', value: mainCam });
    }

    const ultrawideCam = SpecExtractor.camera(quick.cam1modules, 'ultrawide');
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'ULTRAWIDE', value: ultrawideCam });
    }

    const frontCam = SpecExtractor.camera(quick.cam2modules, 'front');
    if (frontCam) {
      result.push({ icon: Camera, label: 'SELFIE', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'BATTERY', value: `${phone.battery_capacity} mAh` });
    }

    if (phone.fast_charging_w) {
      const chargingType = SpecExtractor.chargingType(specs.Battery?.Charging);
      result.push({ 
        icon: Bolt, 
        label: 'CHARGING', 
        value: `${phone.fast_charging_w}W ${chargingType}`
      });
    }

    const wifi = SpecExtractor.wifi(quick.wlan);
    if (wifi) {
      result.push({ icon: Wifi, label: 'CONNECTIVITY', value: wifi });
    }

    const dimensions = SpecExtractor.dimensions(specs.Body?.Dimensions);
    if (dimensions) {
      result.push({ icon: RulerIcon, label: 'SIZE', value: dimensions });
    }

    if (phone.weight_g) {
      result.push({ icon: WeightIcon, label: 'WEIGHT', value: `${phone.weight_g}g` });
    }

    return result.slice(0, 9);
  }, [phone]);

  const formattedPrice = useMemo(() => {
    return phone?.price_usd 
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(phone.price_usd) 
      : null;
  }, [phone?.price_usd]);

  const downloadCard = async () => {
    if (!cardRef.current || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!imageLoaded && imageUrl) {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = resolve;
          img.onerror = resolve;
          img.src = imageUrl;
          setTimeout(resolve, 3000);
        });
      }

      const html2canvas = (await import('html2canvas-pro')).default;
      
      const formatConfig = SOCIAL_MEDIA_SPECS[exportFormat] || {
        width: CARD_DIMENSIONS.width,
        height: CARD_DIMENSIONS.height,
        scale: 2
      };

      const canvas = await html2canvas(cardRef.current, {
        scale: formatConfig.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        width: CARD_DIMENSIONS.width,
        height: CARD_DIMENSIONS.height,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector('[data-card-root]');
          if (clonedCard) {
            clonedCard.style.transform = 'none';
            clonedCard.style.position = 'relative';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const filename = `mobymon-${phone.model_name.replace(/\s+/g, '-').toLowerCase()}-${exportFormat}.png`;
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      canvas.width = 0;
      canvas.height = 0;

    } catch (error) {
      console.error('Export failed:', error);
      alert('Download failed. Please try again or use a different browser.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!phone) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');
        
        .mobymon-card {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      <div className="relative w-full h-full md:w-auto md:h-auto flex flex-col items-center justify-center p-4 md:p-8">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all md:hidden"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          ref={cardRef}
          data-card-root
          className="mobymon-card relative bg-white shadow-2xl"
          style={{ 
            width: `${CARD_DIMENSIONS.width}px`, 
            height: `${CARD_DIMENSIONS.height}px`,
            maxWidth: '100vw',
            maxHeight: '85vh',
            objectFit: 'contain'
          }}
        >
          <div 
            className="relative border-b-2 border-black/10" 
            style={{ 
              height: `${CARD_DIMENSIONS.sections.header}px`, 
              padding: `${CARD_DIMENSIONS.padding.outer}px` 
            }}
          >
            <div className="flex justify-between items-start h-full gap-6">
              <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                  <span className="block text-[9px] font-bold tracking-[0.4em] text-black/20 uppercase mb-3">
                    MOBYMON CARD
                  </span>
                  <h2 className="text-sm font-semibold text-black/40 uppercase tracking-wider mb-1">
                    {phone.brand?.toUpperCase() || 'BRAND'}
                  </h2>
                  <h1 className="text-[44px] font-black text-black leading-[0.9] tracking-tight">
                    {phone.model_name}
                  </h1>
                </div>
                {releaseDate && (
                  <p className="text-[9px] font-bold text-black/30 uppercase tracking-[0.2em]">
                    {releaseDate}
                  </p>
                )}
              </div>
              
              <div 
                style={{ width: '200px', height: '200px' }} 
                className="flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden"
              >
                {imageUrl && !imageError ? (
                  <img 
                    src={imageUrl} 
                    alt={phone.model_name}
                    crossOrigin="anonymous"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-contain p-4"
                    loading="eager"
                  />
                ) : (
                  <Smartphone className="w-20 h-20 text-black/10" strokeWidth={1.5} />
                )}
              </div>
            </div>
          </div>

          <div 
            style={{ 
              height: `${CARD_DIMENSIONS.sections.specs}px`, 
              padding: `${CARD_DIMENSIONS.padding.outer}px ${CARD_DIMENSIONS.padding.outer}px`
            }}
          >
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 h-full content-start">
              {keySpecs.map((spec, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <spec.icon className="w-4 h-4 text-black/30 flex-shrink-0" strokeWidth={2} />
                    <p className="text-[8px] font-bold text-black/30 tracking-[0.15em] uppercase">
                      {spec.label}
                    </p>
                  </div>
                  <p className="text-[15px] font-bold text-black leading-tight">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="bg-black text-white" 
            style={{ 
              height: `${CARD_DIMENSIONS.sections.footer}px`, 
              padding: `${CARD_DIMENSIONS.padding.inner}px ${CARD_DIMENSIONS.padding.outer}px`
            }}
          >
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-4">
                <div style={{ width: '48px', height: '48px' }}>
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M50 10 L90 50 L50 90 L10 50 Z M50 30 L70 50 L50 70 L30 50 Z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] font-black tracking-[0.3em] uppercase">
                    MOBYMON
                  </p>
                  <p className="text-[7px] font-light opacity-50 mt-0.5">
                    mobylite.vercel.app
                  </p>
                </div>
              </div>

              {formattedPrice && (
                <div className="text-right">
                  <p className="text-[36px] font-light leading-none tracking-tight">
                    {formattedPrice}
                  </p>
                  <p className="text-[7px] font-bold tracking-[0.2em] uppercase opacity-60 mt-1">
                    LAUNCH PRICE
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 w-full max-w-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <button 
            onClick={onClose}
            className="hidden md:block text-xs font-bold tracking-wider text-white/50 hover:text-white uppercase transition-colors"
          >
            ESC TO CLOSE
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full md:w-auto bg-white/10 text-white text-xs font-bold tracking-wider px-4 py-3 rounded border border-white/20 hover:bg-white/20 transition-colors uppercase cursor-pointer"
              disabled={isGenerating}
            >
              <option value="default">Default (708x1000)</option>
              <option value="instagram">Instagram Post (1:1)</option>
              <option value="story">Instagram Story (9:16)</option>
              <option value="twitter">Twitter Post (16:9)</option>
            </select>

            <button
              onClick={downloadCard}
              disabled={isGenerating}
              className="w-full md:w-auto bg-white text-black px-8 py-3 text-xs font-bold tracking-wider hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase rounded"
            >
              {isGenerating ? 'GENERATING...' : 'DOWNLOAD'}
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-white/40 text-[10px] tracking-wide">
          Swipe down or press ESC to close
        </p>
      </div>
    </div>
  );
};

export default MobyMonCard;
