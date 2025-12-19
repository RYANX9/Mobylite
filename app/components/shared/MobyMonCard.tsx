import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Camera, 
  Video,
  Cpu, 
  Battery,
  Zap,
  Scaling,
  Sun,
  MemoryStick,
  Wifi,
  Ruler as RulerIcon,
  Weight as WeightIcon
} from 'lucide-react';

const MobyMonCard = ({ phone, onClose }) => {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const proxiedImageUrl = useMemo(() => {
    if (!phone?.main_image_url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(phone.main_image_url)}`;
  }, [phone?.main_image_url]);

  const cleanModelName = useMemo(() => {
    if (!phone?.model_name || !phone?.brand) return phone?.model_name || '';
    
    const modelName = phone.model_name.trim();
    const brand = phone.brand.trim();
    
    const regex = new RegExp(`^${brand}\\s+`, 'i');
    return modelName.replace(regex, '').trim();
  }, [phone?.model_name, phone?.brand]);

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

    const displayType = extractDisplayType(quick.displaytype);
    if (phone.screen_size || displayType) {
      result.push({ 
        icon: Scaling, 
        label: 'DISPLAY', 
        value: phone.screen_size ? `${phone.screen_size}" ${displayType}` : displayType
      });
    }

    const brightness = extractBrightness(quick.displaytype);
    if (brightness !== "N/A") {
      result.push({ icon: Sun, label: 'BRIGHTNESS', value: brightness });
    }

    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'CHIPSET', value: phone.chipset });
    }

    const ram = phone.ram_options?.[0] ? `${phone.ram_options[0]} GB` : null;
    const storage = extractStorage(quick.internalmemory);
    if (ram || storage !== "N/A") {
      const value = ram && storage !== "N/A" ? `${ram} / ${storage}` : (ram || storage);
      result.push({ icon: MemoryStick, label: 'RAM + STORAGE', value });
    }

    const mainCam = extractMainCamera(quick.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'MAIN CAMERA', value: mainCam });
    }

    const ultrawideCam = extractUltrawideCamera(quick.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Video, label: 'ULTRAWIDE CAMERA', value: ultrawideCam });
    }

    const frontCam = extractFrontCamera(quick.cam2modules);
    if (frontCam) {
      result.push({ icon: Smartphone, label: 'FRONT CAMERA', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'BATTERY', value: `${phone.battery_capacity} mAh` });
    }

    if (phone.fast_charging_w) {
      const chargingType = extractChargingType(specs.Battery?.Charging);
      result.push({ 
        icon: Zap, 
        label: 'CHARGING', 
        value: `${phone.fast_charging_w}W (${chargingType})`
      });
    }

    const wifi = extractWiFi(quick.wlan);
    if (wifi !== "N/A") {
      result.push({ icon: Wifi, label: 'WI-FI', value: wifi });
    }

    const dimensions = extractDimensions(specs.Body?.Dimensions);
    if (dimensions !== "N/A") {
      result.push({ icon: RulerIcon, label: 'DIMENSIONS', value: dimensions });
    }

    if (phone.weight_g) {
      result.push({ icon: WeightIcon, label: 'WEIGHT', value: `${phone.weight_g}g` });
    }

    return result.slice(0, 12);
  }, [phone]);

  const textSizeConfig = useMemo(() => {
    if (keySpecs.length === 0) return { labelSize: 13, valueSize: 29, iconSize: 35, gapY: 8 };
    
    const totalChars = keySpecs.reduce((sum, spec) => sum + spec.value.length, 0);
    const avgCharsPerSpec = totalChars / keySpecs.length;
    const maxValueLength = Math.max(...keySpecs.map(spec => spec.value.length));
    
    if (maxValueLength > 40 || avgCharsPerSpec > 25) {
      return { labelSize: 11, valueSize: 20, iconSize: 28, gapY: 6 };
    } else if (maxValueLength > 30 || avgCharsPerSpec > 20) {
      return { labelSize: 12, valueSize: 24, iconSize: 31, gapY: 7 };
    } else {
      return { labelSize: 13, valueSize: 29, iconSize: 35, gapY: 8 };
    }
  }, [keySpecs]);

  const emptySlots = useMemo(() => {
    return Math.max(0, 12 - keySpecs.length);
  }, [keySpecs.length]);

  const formattedPrice = useMemo(() => {
    return phone?.price_usd ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(phone.price_usd) : '$785';
  }, [phone?.price_usd]);

  const downloadCard = async () => {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);
    
    try {
      const { toPng } = await import('html-to-image');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        width: 708,
        height: 1454,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `mobyspec-${phone.model_name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Export failed, trying fallback:', error);
      
      try {
        const domtoimage = await import('dom-to-image');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const dataUrl = await domtoimage.toPng(cardRef.current, {
          quality: 1.0,
          width: 708 * 3,
          height: 1454 * 3,
          style: {
            transform: 'scale(3)',
            transformOrigin: 'top left',
          }
        });
        
        const link = document.createElement('a');
        link.download = `mobyspec-${phone.model_name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsGenerating(false);
      } catch (fallbackError) {
        console.error('All export methods failed:', fallbackError);
        alert('Failed to download card. Please try again.');
        setIsGenerating(false);
      }
    }
  };

  if (!phone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative scale-50 md:scale-75 lg:scale-100 origin-center max-h-screen overflow-auto p-8">
        
        <div 
          ref={cardRef}
          className="relative bg-white border-[3px] border-black"
          style={{ width: '708px', height: '1454px' }}
        >
          <div className="relative border-b-[3px] border-black" style={{ height: '370px', padding: '50px 50px 40px 50px' }}>
            <div className="flex justify-between items-start h-full">
              <div className="flex-1 pr-6">
                <span className="block text-[13px] font-bold tracking-[0.35em] text-black/25 uppercase mb-2">
                  TECH PASSPORT
                </span>
                <h2 className="text-[20px] font-normal text-[#9ca3af] uppercase tracking-wide mb-1">
                  {phone.brand?.toUpperCase() || 'XIAOMI'}
                </h2>
                <h1 className="text-[68px] font-black text-black leading-[0.95] tracking-tight" style={{ fontFamily: 'Rockwell, serif' }}>
                  {cleanModelName}
                </h1>
                {releaseDate && (
                  <p className="text-[13px] font-semibold text-black/35 mt-3 uppercase tracking-[0.15em]">
                    {releaseDate}
                  </p>
                )}
              </div>
              
              <div style={{ width: '290px', height: '290px' }} className="flex-shrink-0 flex items-center justify-center bg-[#e5e7eb] border-4 border-[#d1d5db]">
                {proxiedImageUrl && !imageError ? (
                  <img 
                    src={proxiedImageUrl} 
                    alt={phone.model_name}
                    crossOrigin="anonymous"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-contain p-8"
                  />
                ) : (
                  <Smartphone className="w-40 h-40 text-black/15" />
                )}
              </div>
            </div>
          </div>

          <div style={{ height: '864px', padding: '50px 50px' }}>
            <div className="grid grid-cols-2 gap-x-12 h-full" style={{ rowGap: `${textSizeConfig.gapY * 4}px` }}>
              {keySpecs.map((spec, i) => (
                <div key={i} className="flex flex-col justify-start">
                  <div className="flex items-center gap-3 mb-2">
                    <spec.icon 
                      className="text-black/50 flex-shrink-0" 
                      strokeWidth={1.5}
                      style={{ width: `${textSizeConfig.iconSize}px`, height: `${textSizeConfig.iconSize}px` }}
                    />
                    <p 
                      className="font-bold text-black/40 tracking-[0.2em] uppercase"
                      style={{ fontSize: `${textSizeConfig.labelSize}px` }}
                    >
                      {spec.label}
                    </p>
                  </div>
                  <p 
                    className="font-semibold text-black leading-tight"
                    style={{ fontSize: `${textSizeConfig.valueSize}px` }}
                  >
                    {spec.value}
                  </p>
                </div>
              ))}
              {Array(emptySlots).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col justify-start opacity-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div style={{ width: `${textSizeConfig.iconSize}px`, height: `${textSizeConfig.iconSize}px` }} />
                    <p style={{ fontSize: `${textSizeConfig.labelSize}px` }}>EMPTY</p>
                  </div>
                  <p style={{ fontSize: `${textSizeConfig.valueSize}px` }}>-</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white border-t-[3px] border-black" style={{ height: '220px', padding: '20px 50px 25px 50px' }}>
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 mb-3 flex justify-center" style={{ width: '100%' }}>
                <div style={{ width: '84px', height: '84px' }}>
                  <img 
                    src="/logowhite.svg" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-end w-full mb-3">
                <div>
                  <p className="text-[14px] font-black tracking-[0.25em] uppercase opacity-80">
                    MOBYMON ARCHIVE
                  </p>
                  <p className="text-[12px] font-light opacity-50 mt-1">
                    {phone.release_year || '2025'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[72px] font-extralight leading-none tracking-tighter">
                    {formattedPrice}
                  </p>
                  <p className="text-[13px] font-bold tracking-[0.2em] mt-1 uppercase opacity-70">
                    GLOBAL LAUNCH PRICE
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center mt-auto pb-2">
                <p className="text-[14px] font-bold tracking-[0.25em] uppercase opacity-70">
                  MOBYLITE.VERCEL.APP
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-xs font-bold tracking-wider text-white/60 hover:text-red-400 uppercase transition-colors"
          >
            ESC TO CLOSE
          </button>
          
          <button
            onClick={downloadCard}
            disabled={isGenerating}
            className="bg-white text-black px-8 py-3 text-xs font-bold tracking-wider hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'GENERATING...' : 'DOWNLOAD CARD'}
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function extractDisplayType(displaytype) {
  if (!displaytype) return "LTPO AMOLED";
  const match = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
  const refreshMatch = displaytype.match(/(\d+)Hz/);
  const type = match ? match[0] : "LTPO AMOLED";
  const refresh = refreshMatch ? ` (${refreshMatch[1]}Hz)` : "";
  return `${type}${refresh}`;
}

function extractBrightness(displaytype) {
  if (!displaytype) return "N/A";
  const match = displaytype.match(/(\d+)\s*nits/i);
  return match ? match[0] : "N/A";
}

function extractMainCamera(cam1modules) {
  if (!cam1modules) return null;
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((wide|main)[^)]*\)/i;
  const match = regex.exec(cam1modules);
  return match ? `${match[1]}MP (f/${match[2]})` : null;
}

function extractUltrawideCamera(cam1modules) {
  if (!cam1modules) return null;
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)[^(]*\((ultrawide|ultra wide)[^)]*\)/i;
  const match = regex.exec(cam1modules);
  return match ? `${match[1]}MP (f/${match[2]})` : null;
}

function extractFrontCamera(cam2modules) {
  if (!cam2modules) return null;
  const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
  const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
  if (mpMatch && apertureMatch) return `${mpMatch[1]}MP (f/${apertureMatch[1]})`;
  return mpMatch ? `${mpMatch[1]}MP` : null;
}

function extractStorage(internalmemory) {
  if (!internalmemory) return "N/A";
  const matches = internalmemory.match(/(\d+(?:GB|TB))/g);
  return matches ? [...new Set(matches)].join(" / ") : "N/A";
}

function extractChargingType(charging) {
  if (!charging) return "Fast Charging";
  const types = ["MagSafe", "SuperVOOC", "HyperCharge", "Qi2"];
  for (const type of types) {
    if (new RegExp(type, "i").test(charging)) return type;
  }
  return "Fast Charging";
}

function extractWiFi(wlan) {
  if (!wlan) return "N/A";
  if (/7|be/i.test(wlan)) return "Wi-Fi 7";
  if (/6e/i.test(wlan)) return "Wi-Fi 6E";
  if (/6|ax/i.test(wlan)) return "Wi-Fi 6";
  return "Wi-Fi";
}

function extractDimensions(dimensions) {
  if (!dimensions) return "N/A";
  const match = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
  return match ? `${match[1]} mm` : dimensions;
}

export default MobyMonCard;
