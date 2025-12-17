// lib/cleanSpecExtractor.ts

export interface CleanSpec {
  icon: string;
  label: string;
  value: string;
}

export function extractCleanSpecs(phone: any): CleanSpec[] {
  const specs = phone.full_specifications?.specifications || {};
  const quick = phone.full_specifications?.quick_specs || {};
  return [
    {
      icon: "📱",
      label: "Display",
      value: `${phone.screen_size}" ${extractDisplayType(quick.displaytype)}`
    },
    {
      icon: "☀️",
      label: "Brightness",
      value: extractBrightness(quick.displaytype)
    },
    {
      icon: "🔧",
      label: "Chipset",
      value: phone.chipset || "N/A"
    },
    ...extractCameras(specs["Main Camera"], quick.cam1modules),
    {
      icon: "🔍",
      label: "Optical Zoom",
      value: extractOpticalZoom(quick.cam1modules)
    },
    {
      icon: "🤳",
      label: "Front Camera",
      value: extractFrontCamera(specs["Selfie Camera"], quick.cam2modules)
    },
    {
      icon: "🔋",
      label: "Battery",
      value: `${phone.battery_capacity || "N/A"} mAh`
    },
    {
      icon: "💾",
      label: "RAM",
      value: `${phone.ram_options?.[0] || "N/A"} GB`
    },
    {
      icon: "📂",
      label: "Storage",
      value: extractStorage(quick.internalmemory)
    },
    {
      icon: "🏗️",
      label: "Frame Material",
      value: extractFrameMaterial(specs.Body?.Build)
    },
    {
      icon: "📡",
      label: "Wi-Fi",
      value: extractWiFi(quick.wlan)
    },
    {
      icon: "⚡",
      label: "Charging",
      value: `${phone.fast_charging_w || "N/A"}W (${extractChargingType(specs.Battery?.Charging)})`
    },
    {
      icon: "📏",
      label: "Dimensions",
      value: extractDimensions(specs.Body?.Dimensions, phone.weight_g)
    },
    ...extractSpecialFeatures(specs, quick),
    {
      icon: "💰",
      label: "Price",
      value: `$${phone.price_usd?.toLocaleString() || "N/A"}`
    }
  ].filter(spec => spec.value !== "N/A" && spec.value !== "null");
}

function extractDisplayType(displaytype?: string): string {
  if (!displaytype) return "OLED";
  const match = displaytype.match(/(LTPO\s+)?(AMOLED|OLED|LCD|IPS|Super Retina|Dynamic AMOLED)/i);
  const refreshMatch = displaytype.match(/(\d+)Hz/);
  const type = match ? match[0] : "OLED";
  const refresh = refreshMatch ? ` (${refreshMatch[1]}Hz)` : "";
  return `${type}${refresh}`;
}

function extractBrightness(displaytype?: string): string {
  if (!displaytype) return "N/A";
  const hbmMatch = displaytype.match(/(\d+)\s*nits\s*\(HBM\)/i);
  if (hbmMatch) return `${hbmMatch[1]} nits (HBM)`;
  const peakMatch = displaytype.match(/(\d+)\s*nits\s*\(peak\)/i);
  if (peakMatch) return `${peakMatch[1]} nits (peak)`;
  const typMatch = displaytype.match(/(\d+)\s*nits\s*\(typ\)/i);
  if (typMatch) return `${typMatch[1]} nits (typ)`;
  const generalMatch = displaytype.match(/(\d+)\s*nits/i);
  if (generalMatch) return `${generalMatch[1]} nits`;
  return "N/A";
}

interface CameraInfo {
  mp: string;
  aperture: string;
  type: string;
  cleanType: string;
  icon: string;
  order: number;
}

function mapCameraType(type: string): { cleanType: string; icon: string; order: number } {
  const lower = type.toLowerCase().trim();
  
  if (lower === 'wide') {
    return { cleanType: 'Wide', icon: '📷', order: 0 };
  }
  if (lower === 'ultrawide' || lower === 'ultra wide') {
    return { cleanType: 'Ultrawide', icon: '📸', order: 3 };
  }
  if (lower.includes('periscope')) {
    return { cleanType: 'Periscope', icon: '🔭', order: 2 };
  }
  if (lower === 'telephoto') {
    return { cleanType: 'Telephoto', icon: '🔭', order: 1 };
  }
  if (lower === 'macro') {
    return { cleanType: 'Macro', icon: '🔬', order: 4 };
  }
  
  return { cleanType: type, icon: '📷', order: 5 };
}

function extractCameras(mainCamera: any, cam1modules?: string): CleanSpec[] {
  if (!cam1modules) return [];
  
  const cameras: CameraInfo[] = [];
  const regex = /(\d+)\s*MP,\s*f\/([0-9.]+)(?:,\s*(\d+)mm)?(?:,\s*(\d+)˚)?[^(]*\(([^)]+)\)/gi;
  
  let match;
  while ((match = regex.exec(cam1modules)) !== null) {
    const typeInfo = mapCameraType(match[5]);
    cameras.push({
      mp: match[1],
      aperture: match[2],
      type: match[5],
      ...typeInfo
    });
  }
  
  return cameras
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)
    .map(cam => ({
      icon: cam.icon,
      label: `${cam.mp}MP ${cam.cleanType}`,
      value: `${cam.mp}MP (${cam.cleanType}, f/${cam.aperture})`
    }));
}

function extractOpticalZoom(cam1modules?: string): string {
  if (!cam1modules) return "N/A";
  
  const matches = [...cam1modules.matchAll(/(\d+)x\s*optical\s*zoom/gi)];
  if (matches.length === 0) return "N/A";
  
  const zooms = matches.map(m => parseInt(m[1]));
  const maxZoom = Math.max(...zooms);
  
  return zooms.length > 1 ? `Up to ${maxZoom}x Optical Zoom` : `${zooms[0]}x Optical Zoom`;
}

function extractFrontCamera(selfieCamera: any, cam2modules?: string): string {
  if (!cam2modules) return "N/A";
  const mpMatch = cam2modules.match(/(\d+)\s*MP/i);
  const apertureMatch = cam2modules.match(/f\/([0-9.]+)/i);
  if (mpMatch && apertureMatch) {
    return `${mpMatch[1]}MP (f/${apertureMatch[1]})`;
  }
  return "N/A";
}

function extractFrameMaterial(build?: string): string {
  if (!build) return "N/A";
  if (/titanium/i.test(build)) {
    const gradeMatch = build.match(/Grade\s+(\d+)/i);
    return gradeMatch ? `Titanium Frame (Grade ${gradeMatch[1]})` : "Titanium Frame";
  }
  if (/aluminum|aluminium/i.test(build)) return "Aluminum Frame";
  if (/steel/i.test(build)) return "Steel Frame";
  if (/plastic/i.test(build)) return "Plastic Frame";
  return "N/A";
}

function extractWiFi(wlan?: string): string {
  if (!wlan) return "N/A";
  
  // Extract the part after 802.11 (e.g., "a/b/g/n/ac/6e/7")
  const match = wlan.match(/802\.11\s*([a-z\d\/e]+)/i);
  if (match) {
    const versions = match[1];
    
    // Check for the highest version in order
    if (versions.includes('7')) return "Wi-Fi 7";
    if (versions.includes('6e')) return "Wi-Fi 6E";
    if (versions.includes('6')) return "Wi-Fi 6";
    if (versions.includes('ac')) return "Wi-Fi 5";
    if (versions.includes('n')) return "Wi-Fi 4";
  }
  
  // Fallback to existing patterns for other formats
  if (/Wi-Fi\s*7/i.test(wlan) || /802\.11be/i.test(wlan)) return "Wi-Fi 7";
  if (/Wi-Fi\s*6[eE]/i.test(wlan) || /802\.11ax/i.test(wlan)) return "Wi-Fi 6E";
  if (/Wi-Fi\s*6/i.test(wlan) || /802\.11ax/i.test(wlan)) return "Wi-Fi 6";
  if (/802\.11ac/i.test(wlan)) return "Wi-Fi 5";
  
  return "Wi-Fi";
}


function extractChargingType(charging?: string): string {
  if (!charging) return "Fast Charging";
  if (/MagSafe/i.test(charging)) return "MagSafe";
  if (/Pixelsnap/i.test(charging)) return "Pixelsnap";
  if (/SuperVOOC/i.test(charging)) return "SuperVOOC";
  if (/HyperCharge/i.test(charging)) return "HyperCharge";
  if (/Qi2/i.test(charging)) return "Qi2";
  return "Fast Charging";
}

function extractDimensions(dimensions?: string, weight_g?: number): string {
  if (!dimensions) {
    return weight_g ? `${weight_g}g` : "N/A";
  }
  
  const orMatch = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm\s+or\s+([\d.]+)\s*mm/i);
  if (orMatch) {
    return `${orMatch[1]} or ${orMatch[2]} mm`;
  }
  
  const standardMatch = dimensions.match(/([\d.]+\s*x\s*[\d.]+\s*x\s*[\d.]+)\s*mm/i);
  if (standardMatch) {
    return `${standardMatch[1]} mm`;
  }
  
  return weight_g ? `${weight_g}g` : dimensions;
}

function extractSpecialFeatures(specs: any, quick: any): CleanSpec[] {
  const features: CleanSpec[] = [];
  if (quick.models && /iPhone/.test(quick.models)) {
    features.push({ icon: "🔘", label: "Action Button", value: "Action Button" });
  }
  if (specs.Features?.Sensors?.includes("Camera Control")) {
    features.push({ icon: "📷", label: "Camera Control", value: "Camera Control" });
  }
  if (specs.Features?.Sensors?.includes("S Pen")) {
    features.push({ icon: "✏️", label: "S Pen Support", value: "S Pen Support" });
  }
  if (quick.featuresother && /satellite/i.test(quick.featuresother)) {
    features.push({ icon: "🛰️", label: "Satellite SOS", value: "Satellite SOS" });
  }
  return features;
}

function extractStorage(internalmemory?: string): string {
  if (!internalmemory) return "N/A";
  const matches = internalmemory.match(/(\d+(?:GB|TB))/g);
  if (!matches) return "N/A";
  const unique = [...new Set(matches)];
  return unique.join(" / ");
}

export function getComparisonData(phone: any): Record<string, string> {
  const cleanSpecs = extractCleanSpecs(phone);
  const data: Record<string, string> = {};
  cleanSpecs.forEach(spec => {
    data[spec.label.split('(')[0].trim()] = spec.value;
  });
  return data;
}