
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
        icon: Monitor, 
        label: 'Display', 
        value: phone.screen_size ? `${phone.screen_size}" ${displayType}` : displayType
      });
    }

    const brightness = extractBrightness(quick.displaytype);
    if (brightness !== "N/A") {
      result.push({ icon: Sun, label: 'Brightness', value: brightness });
    }

    if (phone.chipset) {
      result.push({ icon: Cpu, label: 'Chipset', value: phone.chipset });
    }

    const ram = phone.ram_options?.[0] ? `${phone.ram_options[0]} GB` : null;
    const storage = extractStorage(quick.internalmemory);
    if (ram || storage !== "N/A") {
      const value = ram && storage !== "N/A" ? `${ram} / ${storage}` : (ram || storage);
      result.push({ icon: MemoryStick, label: 'RAM + Storage', value });
    }

    const mainCam = extractMainCamera(quick.cam1modules);
    if (mainCam) {
      result.push({ icon: Camera, label: 'Main Camera', value: mainCam });
    }

    const ultrawideCam = extractUltrawideCamera(quick.cam1modules);
    if (ultrawideCam) {
      result.push({ icon: Camera, label: 'Ultrawide Camera', value: ultrawideCam });
    }

    const frontCam = extractFrontCamera(quick.cam2modules);
    if (frontCam) {
      result.push({ icon: Camera, label: 'Front Camera', value: frontCam });
    }

    if (phone.battery_capacity) {
      result.push({ icon: Battery, label: 'Battery', value: `${phone.battery_capacity} mAh` });
    }

    if (phone.fast_charging_w) {
      const chargingType = extractChargingType(specs.Battery?.Charging);
      result.push({ 
        icon: Bolt, 
        label: 'Charging', 
        value: `${phone.fast_charging_w}W (${chargingType})`
      });
    }

    const wifi = extractWiFi(quick.wlan);
    if (wifi !== "N/A") {
      result.push({ icon: Wifi, label: 'Wi-Fi', value: wifi });
    }

    const dimensions = extractDimensions(specs.Body?.Dimensions);
    if (dimensions !== "N/A") {
      result.push({ icon: RulerIcon, label: 'Dimensions', value: dimensions });
    }

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
      
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas-pro')).default;
      } catch (importError) {
        console.error('Failed to import html2canvas-pro:', importError);
        alert('Image export library not available. Please contact support.');
        setIsGenerating(false);
        return;
      }
      
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
      
      if (error.message?.includes('CORS')) {
        alert('Image loading failed due to CORS. Some images may not be exportable.');
      } else if (error.message?.includes('html2canvas')) {
        alert('Export library error. Please refresh and try again.');
      } else {
        alert(`Failed to generate image: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 backdrop-blur-md overflow-auto">
      {/* Wrapper - Scales card on small screens */}
      <div className="relative flex flex-col items-center justify-center p-4 w-full">
        
        {/* FIXED SIZE CARD - Always 1080x1920px */}
        <div 
          ref={cardRef}
          className="relative bg-white shadow-2xl flex flex-col overflow-hidden"
          style={{ 
            width: '1080px',
            height: '1920px',
            border: '12px solid #000',
            transform: 'scale(1)',
            transformOrigin: 'center',
          }}
        >
          {/* Header - 25% of 1920px = 480px */}
          <div 
            className="relative border-b-2 border-black flex-shrink-0"
            style={{ height: '480px' }}
          >
            <div className="h-full flex justify-between items-start p-16 pb-8">
              {/* Left: Text Content - 60% width */}
              <div className="flex-1 flex flex-col justify-between h-full pr-8" style={{ width: '60%' }}>
                <div>
                  <span className="text-[28px] font-black tracking-[0.4em] text-black/30 uppercase block leading-tight">
                    TECH PASSPORT
                  </span>
                  <h2 className="text-[120px] font-black leading-[0.85] tracking-tight mt-2">
                    {phone.brand?.toUpperCase()}
                  </h2>
                  <h1 className="text-[56px] font-light text-black/70 mt-4 leading-tight">
                    {phone.model_name}
                  </h1>
                </div>
                {releaseDate && (
                  <p className="text-[26px] font-bold text-black/40 uppercase tracking-wider mt-4">
                    {releaseDate}
                  </p>
                )}
              </div>
              
              {/* Right: Phone Image - 40% width */}
              <div 
                className="flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-50"
                style={{ 
                  width: '380px',
                  height: '380px',
                  border: '12px solid rgba(0,0,0,0.1)'
                }}
              >
                {proxiedImageUrl && !imageError ? (
                  <img 
                    src={proxiedImageUrl} 
                    alt={phone.model_name}
                    crossOrigin="anonymous"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-contain p-16"
                  />
                ) : (
                  <Smartphone className="w-56 h-56 text-black/20" />
                )}
              </div>
            </div>
          </div>

          {/* Specs Grid - 55% of 1920px = 1056px */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ height: '1056px' }}
          >
            <div className="h-full grid grid-cols-2 gap-x-16 gap-y-12 p-16 content-start">
              {keySpecs.map((spec, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center gap-4 mb-3">
                    <spec.icon className="w-14 h-14 text-black/60 flex-shrink-0" />
                    <p className="text-[22px] font-bold text-black/40 tracking-widest uppercase leading-tight">
                      {spec.label}
                    </p>
                  </div>
                  <p className="text-[36px] font-semibold text-black leading-tight pl-[72px]">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer - 20% of 1920px = 384px */}
          <div 
            className="border-t-2 border-black bg-black text-white flex flex-col items-center justify-between flex-shrink-0 p-8"
            style={{ height: '384px' }}
          >
            <img 
              src={logoUrl}
              alt="MobyLite Logo" 
              crossOrigin="anonymous"
              className="w-36 h-36"
            />
            <div className="flex justify-between items-end w-full px-8">
              <div>
                <p className="text-[22px] font-black tracking-[0.3em] uppercase opacity-70">
                  MOBYMON ARCHIVE
                </p>
                <p className="text-[18px] font-light opacity-50 mt-2">
                  {phone.release_year || new Date().getFullYear()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[100px] font-extralight leading-none tracking-tighter">
                  {formattedPrice}
                </p>
                <p className="text-[20px] font-bold tracking-widest mt-2 uppercase opacity-70">
                  Global Launch Price
                </p>
              </div>
            </div>
            <a 
              href="https://mobylite.vercel.app" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-[22px] font-bold tracking-[0.3em] uppercase opacity-70 hover:underline"
            >
              mobylite.vercel.app
            </a>
          </div>
        </div>

        {/* Controls - Outside card, scales with viewport */}
        <div className="mt-8 w-full max-w-[1080px] flex items-center justify-between px-4">
          <button 
            onClick={onClose}
            className="text-[18px] font-bold tracking-[0.3em] text-black/40 hover:text-red-600 uppercase transition-colors"
          >
            CLOSE
          </button>
          
          <button
            onClick={downloadCard}
            disabled={isGenerating}
            className="bg-black text-white px-12 py-5 text-[18px] font-bold tracking-[0.3em] hover:bg-slate-800 flex items-center gap-4 disabled:opacity-50 transition-all"
          >
            {isGenerating ? 'EXPORTING...' : 'DOWNLOAD FOR STORY'}
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* CSS to scale card on smaller screens */}
      <style jsx>{`
        @media (max-width: 1200px) {
          div[ref] {
            transform: scale(0.5);
          }
        }
        @media (max-width: 768px) {
          div[ref] {
            transform: scale(0.35);
          }
        }
        @media (max-width: 480px) {
          div[ref] {
            transform: scale(0.28);
          }
        }
      `}</style>
    </div>
  );
};

// Helper functions with fixed refresh rate detection
function extractDisplayType(displaytype) {
  if (!displaytype) return "OLED";
  
  const match = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
  const type = match ? match[0] : "OLED";
  
  const allHzMatches = displaytype.match(/(\d+)Hz/g);
  let refreshRate = "";
  
  if (allHzMatches) {
    for (const match of allHzMatches) {
      const value = parseInt(match);
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

