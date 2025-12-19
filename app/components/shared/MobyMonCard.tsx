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

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

interface MobyMonCardProps {
  phone: any;
  onClose: () => void;
}

const MobyMonCard: React.FC<MobyMonCardProps> = ({ phone, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(1);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const updateScale = () => {
      if (!previewRef.current) return;
      
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        setPreviewScale(0.7);
      } else {
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 200;
        
        const scaleX = maxWidth / CANVAS_WIDTH;
        const scaleY = maxHeight / CANVAS_HEIGHT;
        const scale = Math.min(scaleX, scaleY, 1);
        
        setPreviewScale(scale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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
    if (!canvasRef.current) return;
    setIsGenerating(true);
    
    try {
      await document.fonts.ready;
      
      const images = canvasRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img: HTMLImageElement) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 3000);
          });
        })
      );
      
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      
      const html2canvas = (await import('html2canvas-pro')).default;
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        windowWidth: CANVAS_WIDTH,
        windowHeight: CANVAS_HEIGHT,
        onclone: (clonedDoc: Document) => {
          const clonedCanvas = clonedDoc.querySelector('[data-canvas="true"]') as HTMLElement;
          if (clonedCanvas) {
            clonedCanvas.style.transform = 'none';
          }
        }
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `moby-spec-${phone.model_name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!phone) return null;

  const leftColSpecs = keySpecs.filter((_, i) => i % 2 === 0);
  const rightColSpecs = keySpecs.filter((_, i) => i % 2 === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md overflow-auto">
      <div className="relative flex flex-col items-center gap-6 my-auto">
        
        <div 
          ref={previewRef}
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: 'center center',
          }}
          className="transition-transform duration-300"
        >
          <div 
            ref={canvasRef}
            data-canvas="true"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              position: 'relative',
              fontFamily: "'Rockwell', 'Rockwell Nova', 'Courier New', serif",
            }}
            className="bg-white border-8 border-black shadow-2xl"
          >
            
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '370px',
              borderBottom: '4px solid black',
              padding: '50px 60px',
            }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, maxWidth: '580px' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '0.35em',
                    color: 'rgba(0,0,0,0.3)',
                    marginBottom: '8px',
                  }}>
                    TECH PASSPORT
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    color: '#999999',
                    marginBottom: '2px',
                  }}>
                    {phone.brand?.toUpperCase() || 'XIAOMI'}
                  </div>
                  <h1 style={{
                    fontSize: '54px',
                    fontWeight: 700,
                    lineHeight: '0.9',
                    color: '#000000',
                    marginBottom: '10px',
                    fontFamily: "'Rockwell', 'Rockwell Nova', 'Courier New', serif",
                  }}>
                    {phone.model_name}
                  </h1>
                  {releaseDate && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      color: 'rgba(0,0,0,0.4)',
                    }}>
                      ANNOUNCED {releaseDate.toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: '280px',
                  height: '280px',
                  border: '8px solid rgba(0,0,0,0.08)',
                  backgroundColor: '#f8f8f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {proxiedImageUrl && !imageError ? (
                    <img 
                      src={proxiedImageUrl} 
                      alt={phone.model_name}
                      crossOrigin="anonymous"
                      onError={() => setImageError(true)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '40px',
                      }}
                    />
                  ) : (
                    <Smartphone style={{ width: '120px', height: '120px', color: 'rgba(0,0,0,0.15)' }} />
                  )}
                </div>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              top: '374px',
              left: 0,
              right: 0,
              bottom: '340px',
              padding: '40px 60px',
            }}>
              
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {leftColSpecs.map((spec, i) => (
                  <div 
                    key={`left-${i}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: `${i * 100}px`,
                      width: '450px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <spec.icon style={{ width: '20px', height: '20px', color: 'rgba(0,0,0,0.45)' }} />
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.25em',
                        color: 'rgba(0,0,0,0.35)',
                        marginLeft: '10px',
                      }}>
                        {spec.label.toUpperCase()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#000000',
                      lineHeight: '1.25',
                      paddingLeft: '30px',
                    }}>
                      {spec.value}
                    </div>
                  </div>
                ))}

                {rightColSpecs.map((spec, i) => (
                  <div 
                    key={`right-${i}`}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: `${i * 100}px`,
                      width: '450px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <spec.icon style={{ width: '20px', height: '20px', color: 'rgba(0,0,0,0.45)' }} />
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.25em',
                        color: 'rgba(0,0,0,0.35)',
                        marginLeft: '10px',
                      }}>
                        {spec.label.toUpperCase()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#000000',
                      lineHeight: '1.25',
                      paddingLeft: '30px',
                    }}>
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '340px',
              borderTop: '4px solid black',
              backgroundColor: '#000000',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '30px 60px',
            }}>
              <img 
                src={logoUrl}
                alt="MobyLite Logo" 
                crossOrigin="anonymous"
                style={{
                  width: '80px',
                  height: '80px',
                  marginBottom: '20px',
                }}
              />
              
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '30px',
              }}>
                <div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    letterSpacing: '0.3em',
                    opacity: 0.7,
                  }}>
                    MOBYMON ARCHIVE
                  </div>
                  <div style={{
                    fontSize: '8px',
                    fontWeight: 300,
                    opacity: 0.5,
                    marginTop: '4px',
                  }}>
                    {phone.release_year || new Date().getFullYear()}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '72px',
                    fontWeight: 200,
                    lineHeight: '1',
                    letterSpacing: '-0.02em',
                  }}>
                    {formattedPrice}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.25em',
                    opacity: 0.7,
                    marginTop: '8px',
                  }}>
                    GLOBAL LAUNCH PRICE
                  </div>
                </div>
              </div>
              
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.3em',
                opacity: 0.7,
              }}>
                MOBYLITE.VERCEL.APP
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-xs font-bold tracking-widest text-white/60 hover:text-red-400 uppercase transition-colors"
          >
            CLOSE
          </button>
          
          <button
            onClick={downloadCard}
            disabled={isGenerating}
            className="bg-white text-black px-8 py-4 text-xs font-bold tracking-widest hover:bg-gray-200 flex items-center gap-3 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'EXPORTING...' : 'DOWNLOAD CARD'}
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const match = dimensions.match(/([\d.]+\s*x\s*[\
