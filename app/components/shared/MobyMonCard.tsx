import React, { useRef, useState, useMemo, useEffect } from 'react';
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
      result.push({ icon: Camera, label: 'ULTRAWIDE CAMERA', value: ultrawideCam });
    }

    const frontCam = extractFrontCamera(quick.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'FRONT CAMERA', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'BATTERY', value: `${phone.battery_capacity} mAh` });
    }

    if (phone.fast_charging_w) {
      const chargingType = extractChargingType(specs.Battery?.Charging);
      result.push({ 
        icon: Bolt, 
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
    if (!cardRef.current) return;
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const html2canvas = (await import('html2canvas-pro')).default;
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
        width: 708,
        height: 1454,
      });

      const link = document.createElement('a');
      link.download = `mobyspec${phone.model_name.replace(/\s+/g, '').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-start py-4 px-4">
        
        <div className="w-full max-w-[708px] flex flex-col items-center gap-4">
          
          <div 
            ref={cardRef}
            className="relative bg-white border-[3px] border-black w-full"
            style={{ aspectRatio: '708/1454' }}
          >
            {/* Header */}
            <div className="relative border-b-[3px] border-black" style={{ height: '25.45%', padding: '7% 7% 5.5% 7%' }}>
              <div className="flex justify-between items-start h-full">
                <div className="flex-1 pr-4">
                  <span className="block text-[1.55%] font-bold tracking-[0.35em] text-black/25 uppercase mb-[2%]">
                    TECH PASSPORT
                  </span>
                  <h2 className="text-[2.26%] font-normal text-[#9ca3af] uppercase tracking-wide mb-[1%]">
                    {phone.brand?.toUpperCase() || 'XIAOMI'}
                  </h2>
                  <h1 className="text-[7.9%] font-black text-black leading-[0.95] tracking-tight" style={{ fontFamily: 'Rockwell, serif' }}>
                    {phone.model_name}
                  </h1>
                  {releaseDate && (
                    <p className="text-[1.55%] font-semibold text-black/35 mt-[2%] uppercase tracking-[0.15em]">
                      {releaseDate}
                    </p>
                  )}
                </div>
                
                <div style={{ width: '40.96%', height: '100%' }} className="flex-shrink-0 flex items-center justify-center bg-[#e5e7eb] border-4 border-[#d1d5db]">
                  {proxiedImageUrl && !imageError ? (
                    <img 
                      src={proxiedImageUrl} 
                      alt={phone.model_name}
                      crossOrigin="anonymous"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-contain p-[10%]"
                    />
                  ) : (
                    <Smartphone className="w-[45%] h-[45%] text-black/15" />
                  )}
                </div>
              </div>
            </div>

            {/* Specs Grid */}
            <div style={{ height: '59.42%', padding: '7% 7%' }}>
              <div className="grid grid-cols-2 gap-x-[3.4%] gap-y-[2.3%] h-full">
                {keySpecs.map((spec, i) => (
                  <div key={i} className="flex flex-col justify-start">
                    <div className="flex items-center gap-[2%] mb-[1.5%]">
                      <spec.icon className="w-[3.67%] h-auto text-black/50 flex-shrink-0" strokeWidth={1.5} />
                      <p className="text-[1.41%] font-bold text-black/40 tracking-[0.2em] uppercase">
                        {spec.label}
                      </p>
                    </div>
                    <p className="text-[3.1%] font-semibold text-black leading-tight">
                      {spec.value}
                    </p>
                  </div>
                ))}
                {Array(emptySlots).fill(0).map((_, i) => (
                  <div key={`empty-${i}`} className="flex flex-col justify-start opacity-0">
                    <div className="flex items-center gap-[2%] mb-[1.5%]">
                      <div className="w-[3.67%] h-auto" />
                      <p className="text-[1.41%]">EMPTY</p>
                    </div>
                    <p className="text-[3.1%]">-</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black text-white border-t-[3px] border-black" style={{ height: '15.13%', padding: '2.8% 7% 4.1% 7%' }}>
              <div className="flex flex-col items-center h-full">
                <div className="flex-shrink-0 mb-[3%]" style={{ width: '8.47%', aspectRatio: '1/1' }}>
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M50 10 L90 50 L50 90 L10 50 Z M50 30 L70 50 L50 70 L30 50 Z" fill="white"/>
                  </svg>
                </div>
                
                <div className="flex justify-between items-end w-full mb-[4%]">
                  <div>
                    <p className="text-[1.41%] font-black tracking-[0.25em] uppercase opacity-80">
                      MOBYMON ARCHIVE
                    </p>
                    <p className="text-[1.13%] font-light opacity-50 mt-[0.5%]">
                      {phone.release_year || '2025'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7.34%] font-extralight leading-none tracking-tighter">
                      {formattedPrice}
                    </p>
                    <p className="text-[1.27%] font-bold tracking-[0.2em] mt-[0.5%] uppercase opacity-70">
                      GLOBAL LAUNCH PRICE
                    </p>
                  </div>
                </div>
                
                <p className="text-[1.41%] font-bold tracking-[0.25em] uppercase opacity-70">
                  MOBYLITE.VERCEL.APP
                </p>
              </div>
            </div>
          </div>

          {/* Controls - Now always visible */}
          <div className="w-full flex items-center justify-between gap-4">
            <button 
              onClick={onClose}
              className="text-xs font-bold tracking-wider text-white/60 hover:text-red-400 uppercase transition-colors"
            >
              CLOSE
            </button>
            
            <button
              onClick={downloadCard}
              disabled={isGenerating}
              className="bg-white text-black px-6 py-3 text-xs font-bold tracking-wider hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? 'GENERATING...' : 'DOWNLOAD'}
              <Download className="w-4 h-4" />
            </button>
          </div>
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
  return match ? `${match[0]}` : "N/A";
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
  for (const t of types) { if (new RegExp(t, "i").test(charging)) return t; }
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
