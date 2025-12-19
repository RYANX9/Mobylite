
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
 * MobyMonCard Component - Fixed Size Social Card
 * FIXED: 1080x1920px (9:16) - No scrolling, perfect for social media
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

  const proxiedImageUrl = useMemo(() => {
    if (!phone?.main_image_url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(phone.main_image_url)}`;
  }, [phone?.main_image_url]);

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

    return result.slice(0, 12);
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
        width: 1080,
        height: 1920,
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
      <div className="relative my-8">
        
        {/* FIXED SIZE CARD: 1080x1920px (9:16) */}
        <div 
          ref={cardRef}
          className="relative bg-white border-4 border-black shadow-2xl flex flex-col"
          style={{ 
            width: '1080px',
            height: '1920px',
          }}
        >
          {/* Header - Fixed Height */}
          <div className="relative border-b-2 border-black" style={{ height: '360px', padding: '48px' }}>
            <div className="flex justify-between items-start h-full">
              <div className="flex-1 flex flex-col justify-between" style={{ paddingRight: '32px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.4em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>
                    TECH PASSPORT
                  </span>
                  <h2 style={{ fontSize: '96px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em', marginTop: '12px' }}>
                    {phone.brand?.toUpperCase()}
                  </h2>
                  <h1 style={{ fontSize: '48px', fontWeight: 300, color: 'rgba(0,0,0,0.7)', marginTop: '12px', lineHeight: 1.2 }}>
                    {phone.model_name}
                  </h1>
                </div>
                {releaseDate && (
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {releaseDate}
                  </p>
                )}
              </div>
              
              <div style={{ width: '280px', height: '280px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '8px solid rgba(0,0,0,0.1)', backgroundColor: '#f9fafb' }}>
                {proxiedImageUrl && !imageError ? (
                  <img 
                    src={proxiedImageUrl} 
                    alt={phone.model_name}
                    crossOrigin="anonymous"
                    onError={() => setImageError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '40px' }}
                  />
                ) : (
                  <Smartphone style={{ width: '160px', height: '160px', color: 'rgba(0,0,0,0.2)' }} />
                )}
              </div>
            </div>
          </div>

          {/* Specs Grid - Fixed Height, No Scroll */}
          <div style={{ flex: 1, padding: '48px', display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '32px',
              width: '100%'
            }}>
              {keySpecs.map((spec, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <spec.icon style={{ width: '32px', height: '32px', color: 'rgba(0,0,0,0.6)' }} />
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      {spec.label}
                    </p>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 600, color: '#000', lineHeight: 1.3, paddingLeft: '44px' }}>
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer - Fixed Height */}
          <div style={{ padding: '32px', borderTop: '4px solid #000', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '320px' }}>
            <img 
              src={logoUrl}
              alt="MobyLite Logo" 
              crossOrigin="anonymous"
              style={{ width: '100px', height: '100px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBottom: '24px', paddingLeft: '32px', paddingRight: '32px' }}>
              <div>
                <p style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7 }}>
                  MOBYMON ARCHIVE
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, opacity: 0.5, marginTop: '4px' }}>
                  {phone.release_year || new Date().getFullYear()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '80px', fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {formattedPrice}
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.15em', marginTop: '8px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Global Launch Price
                </p>
              </div>
            </div>
            <a 
              href="https://mobylite.vercel.app" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7, textDecoration: 'none', color: '#fff', marginBottom: '16px' }}
            >
              mobylite.vercel.app
            </a>
          </div>
        </div>

        {/* Controls - Outside the card */}
        <div style={{ marginTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '16px', paddingRight: '16px' }}>
          <button 
            onClick={onClose}
            style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: '16px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,0,0,0.4)'}
          >
            CLOSE
          </button>
          
          <button
            onClick={downloadCard}
            disabled={isGenerating}
            style={{ 
              backgroundColor: '#000', 
              color: '#fff', 
              padding: '32px 80px', 
              fontSize: '20px', 
              fontWeight: 700, 
              letterSpacing: '0.3em', 
              border: 'none', 
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              gap: '32px',
              opacity: isGenerating ? 0.5 : 1,
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => !isGenerating && (e.currentTarget.style.backgroundColor = '#1e293b')}
            onMouseLeave={(e) => !isGenerating && (e.currentTarget.style.backgroundColor = '#000')}
          >
            {isGenerating ? 'EXPORTING...' : 'DOWNLOAD FOR STORY'}
            <Download style={{ width: '32px', height: '32px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions with FIXED refresh rate detection
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

