import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Camera, 
  Cpu, 
  Battery,
  Bolt,
  Monitor,
  Sun,
  MemoryStick,
  Wifi,
  Ruler as RulerIcon,
  Weight as WeightIcon
} from 'lucide-react';

/**
 * MobyMonCard Component - Ultra-Compact Vertical Social Edition
 * Optimized for Instagram/TikTok Stories & Reels (1080x1920)
 */
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

  const logoUrl = useMemo(() => {
    const logoPath = `${window.location.origin}/logowhite.svg`;
    return `/api/proxy-image?url=${encodeURIComponent(logoPath)}`;
  }, []);  

  // Generate the Proxy URL to bypass CORS
  const proxiedImageUrl = useMemo(() => {
    if (!phone?.main_image_url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(phone.main_image_url)}`;
  }, [phone?.main_image_url]);

  // Extract Release Date
  const releaseDate = useMemo(() => {
    const specs = phone?.full_specifications?.specifications || {};
    const launch = specs.Launch;
    if (launch?.Released) {
      return launch.Released;
    }
    if (launch?.Announced) {
      return `Announced ${launch.Announced}`;
    }
    if (phone?.release_year) {
      return phone.release_year;
    }
    return null;
  }, [phone]);

  // Extract key specs for the card
  const keySpecs = useMemo(() => {
    if (!phone) return [];

    const specs = phone.full_specifications?.specifications || {};
    const quick = phone.full_specifications?.quick_specs || {};
    const result = [];

    // Display
    const displayType = extractDisplayType(quick.displaytype);
    if (phone.screen_size || displayType) {
      result.push({ 
        icon: Monitor, 
        label: 'Display', 
        value: phone.screen_size ? `${phone.screen_size}" ${displayType}` : displayType
      });
    }

    // Brightness
    const brightness = extractBrightness(quick.displaytype);
    if (brightness !== "N/A") {
      result.push({ icon: Sun, label: 'Brightness', value: brightness });
    }

    // Chipset
    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'Chipset', value: phone.chipset });
    }

    // RAM + Storage
    const ram = phone.ram_options?.[0] ? `${phone.ram_options[0]} GB` : null;
    const storage = extractStorage(quick.internalmemory);
    if (ram || storage !== "N/A") {
      const value = ram && storage !== "N/A" ? `${ram} / ${storage}` : (ram || storage);
      result.push({ icon: MemoryStick, label: 'RAM + Storage', value });
    }

    // Main Camera
    const mainCam = extractMainCamera(quick.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'Main Camera', value: mainCam });
    }

    // Ultrawide Camera
    const ultrawideCam = extractUltrawideCamera(quick.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'Ultrawide Camera', value: ultrawideCam });
    }

    // Front Camera
    const frontCam = extractFrontCamera(quick.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'Front Camera', value: frontCam });
    }

    // Battery
    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'Battery', value: `${phone.battery_capacity} mAh` });
    }

    // Charging
    if (phone.fast_charging_w) {
      const chargingType = extractChargingType(specs.Battery?.Charging);
      result.push({ 
        icon: Bolt, 
        label: 'Charging', 
        value: `${phone.fast_charging_w}W (${chargingType})`
      });
    }

    // Wi-Fi
    const wifi = extractWiFi(quick.wlan);
    if (wifi !== "N/A") {
      result.push({ icon: Wifi, label: 'Wi-Fi', value: wifi });
    }

    // Dimensions
    const dimensions = extractDimensions(specs.Body?.Dimensions);
    if (dimensions !== "N/A") {
      result.push({ icon: RulerIcon, label: 'Dimensions', value: dimensions });
    }

    // Weight
    if (phone.weight_g) {
      result.push({ icon: WeightIcon, label: 'Weight', value: `${phone.weight_g}g` });
    }

    return result;
  }, [phone]);

  const formattedPrice = useMemo(() => {
    return phone?.price_usd ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(phone.price_usd) : 'N/A';
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
      });

      const link = document.createElement('a');
      link.download = `moby-spec-${phone.model_name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/90 backdrop-blur-md">
      <div className="relative w-full max-w-md">
        
        {/* Compact Vertical Card - 1080x1920 optimized */}
        <div 
          ref={cardRef}
          className="relative w-full bg-white border-4 border-black shadow-2xl flex flex-col overflow-hidden"
          style={{ aspectRatio: '9/16' }}
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b-2 border-black">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-[10px] font-black tracking-[0.4em] text-black/30 uppercase">TECH PASSPORT</span>
                <h2 className="text-sm font-medium text-[#808080] mt-1">
                  {phone.brand?.toUpperCase()}
                </h2>
                <h1 className="text-4xl font-black text-black leading-[0.9] tracking-tight mt-1">
                  {phone.model_name}
                </h1>
                {releaseDate && (
                  <p className="text-[10px] font-bold text-black/40 mt-1 uppercase tracking-wider">
                    {releaseDate}
                  </p>
                )}
              </div>
              
              <div className="w-40 h-40 flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-black/10 bg-gray-50">
                {proxiedImageUrl && !imageError ? (
                  <img 
                    src={proxiedImageUrl} 
                    alt={phone.model_name}
                    crossOrigin="anonymous"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-contain p-8"
                  />
                ) : (
                  <Smartphone className="w-28 h-28 text-black/20" />
                )}
              </div>
            </div>
          </div>

          {/* Dense Spec Grid */}
          <div className="flex-1 px-6 py-5 overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {keySpecs.map((spec, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <spec.icon className="w-5 h-5 text-black/60" />
                    <p className="text-[9px] font-bold text-black/40 tracking-widest uppercase">
                      {spec.label}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-black leading-tight pl-7">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 border-t-2 border-black bg-black text-white flex flex-col items-center">
            <img 
              src={logoUrl}
              alt="MobyLite Logo" 
              crossOrigin="anonymous"
              className="w-14 h-14 mb-1"
            />
            <div className="flex justify-between items-end w-full mb-3 px-4">
              <div>
                <p className="text-[9px] font-black tracking-[0.3em] uppercase opacity-70">
                  MOBYMON ARCHIVE
                </p>
                <p className="text-[7px] font-light opacity-50 mt-0.5">
                  {phone.release_year || new Date().getFullYear()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extralight leading-none tracking-tighter">
                  {formattedPrice}
                </p>
                <p className="text-[8px] font-bold tracking-widest mt-0.5 uppercase opacity-70">
                  Global Launch Price
                </p>
              </div>
            </div>
            <a 
              href="https://mobylite.vercel.app " 
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-70 hover:underline mb-2"
            >
              mobylite.vercel.app
            </a>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between px-2">
          <button 
            onClick={onClose}
            className="text-[10px] font-bold tracking-[0.3em] text-black/40 hover:text-red-600 uppercase"
          >
            CLOSE
          </button>
          
          <button
            onClick={downloadCard}
            disabled={isGenerating}
            className="bg-black text-white px-10 py-4 text-[10px] font-bold tracking-[0.3em] hover:bg-slate-800 flex items-center gap-4 disabled:opacity-50"
          >
            {isGenerating ? 'EXPORTING...' : 'DOWNLOAD FOR STORY'}
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions (identical to previous version)
function extractDisplayType(displaytype) {
  if (!displaytype) return "OLED";
  
  const match = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
  const type = match ? match[0] : "OLED";
  
  // Extract refresh rate - only valid display refresh rates
  // Ignore PWM frequencies (typically 1000Hz+)
  const allHzMatches = displaytype.match(/(\d+)Hz/g);
  let refreshRate = "";
  
  if (allHzMatches) {
    for (const match of allHzMatches) {
      const value = parseInt(match);
      // Standard display refresh rates are between 30-240Hz
      // PWM frequencies are usually 1000Hz+
      if (value >= 30 && value <= 240) {
        refreshRate = ` (${value}Hz)`;
        break;
      }
    }
  }
  
  return `${type}${refreshRate}`;
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
