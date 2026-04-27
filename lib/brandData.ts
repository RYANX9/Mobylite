export interface BrandInfo {
  name: string           // exact display name
  logo: string           // URL to logo image (or '' to use letter fallback)
  founded: string        // "1969" or "1969, Seoul"
  hq: string             // "Seoul, South Korea"
  os: string             // "Android · One UI 7"
  tags: string[]         // pills shown under description
  description: string    // 2–3 sentence brand bio
  highlights: string[]   // 3 bullet points shown in hero meta
}

const BRANDS: Record<string, BrandInfo> = {
  samsung: {
    name: 'Samsung',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png',
    founded: '1969',
    hq: 'Seoul, South Korea',
    os: 'Android · One UI 7',
    tags: ['Android', 'One UI 7', 'Flagship · Mid-Range · Budget', 'South Korea', 'AMOLED displays'],
    description:
      "Samsung is the world's top smartphone seller by volume. The Galaxy lineup spans every tier — from the budget Galaxy A16 at $199 to the Galaxy S25 Ultra at $1,299 with a built-in S Pen. Samsung offers 7 years of OS and security updates on its flagship devices.",
    highlights: ['7-year OS update promise', 'AMOLED displays across all tiers', 'Global #1 by shipments'],
  },
  apple: {
    name: 'Apple',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    founded: '1976',
    hq: 'Cupertino, USA',
    os: 'iOS 18',
    tags: ['iOS', 'A-series chips', 'Premium', 'USA', 'ProMotion OLED'],
    description:
      'Apple designs the iPhone, the benchmark for smartphone performance and software quality. Every iPhone runs iOS with guaranteed software updates for 6+ years. The A-series chips consistently top benchmark charts by a wide margin.',
    highlights: ['6+ years of iOS updates', 'Fastest mobile chips (A18 Pro)', 'Seamless ecosystem'],
  },
  google: {
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png',
    founded: '1998',
    hq: 'Mountain View, USA',
    os: 'Android · Pixel UI',
    tags: ['Android', 'Tensor chips', 'AI features', 'USA', 'Pure Android'],
    description:
      'Google Pixel phones run the cleanest version of Android and receive updates first. The Tensor G-series chips enable on-device AI features like Magic Eraser, Live Translate, and Call Screen. Pixels are renowned for computational photography.',
    highlights: ['7 years of Android updates', 'First to get Android updates', 'Best-in-class computational camera'],
  },
  xiaomi: {
    name: 'Xiaomi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/2560px-Xiaomi_logo_%282021-%29.svg.png',
    founded: '2010',
    hq: 'Beijing, China',
    os: 'Android · HyperOS',
    tags: ['Android', 'HyperOS', 'Flagship · Mid-Range · Budget', 'China', 'Fast Charging'],
    description:
      'Xiaomi delivers flagship specs at aggressive prices. The 15 Ultra pushes mobile photography with Leica optics while the Redmi series dominates the budget segment. Xiaomi consistently leads in fast-charging innovation — some models charge at 120W or higher.',
    highlights: ['Industry-leading fast charging', 'Leica camera partnership', 'Unbeatable specs-per-dollar'],
  },
  oneplus: {
    name: 'OnePlus',
    logo: '',
    founded: '2013',
    hq: 'Shenzhen, China',
    os: 'Android · OxygenOS',
    tags: ['Android', 'OxygenOS', 'Flagship · Mid-Range', 'China', '120Hz AMOLED'],
    description:
      'OnePlus built its reputation on "Never Settle" — flagship specs at mid-range prices. OxygenOS is praised for its clean, fast UI. The OnePlus 13 series features Hasselblad-tuned cameras and Snapdragon 8 Elite performance.',
    highlights: ['Hasselblad camera tuning', 'OxygenOS — clean & fast', 'Alert Slider hardware switch'],
  },
  oppo: {
    name: 'OPPO',
    logo: '',
    founded: '2004',
    hq: 'Dongguan, China',
    os: 'Android · ColorOS',
    tags: ['Android', 'ColorOS', 'Flagship · Mid-Range', 'China', 'SuperVOOC charging'],
    description:
      'OPPO is known for pioneering fast-charging technology with its SuperVOOC standard, now reaching 240W. The Find X series pushes design boundaries while the Reno lineup targets the camera-focused mid-range buyer.',
    highlights: ['240W SuperVOOC charging', 'Find X flagship innovation', 'Hasselblad imaging on Find N'],
  },
  vivo: {
    name: 'vivo',
    logo: '',
    founded: '2009',
    hq: 'Dongguan, China',
    os: 'Android · OriginOS / FuntouchOS',
    tags: ['Android', 'FuntouchOS', 'Flagship · Mid-Range', 'China', 'Zeiss cameras'],
    description:
      'Vivo specialises in camera and audio technology. The X series features Zeiss optics and multi-frame computational imaging, while the V series targets selfie enthusiasts. Vivo also makes the iQOO sub-brand for gaming phones.',
    highlights: ['Zeiss camera collaboration', 'iQOO gaming sub-brand', 'Best-in-class selfie cameras'],
  },
  motorola: {
    name: 'Motorola',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Motorola_logo_2013.svg/2560px-Motorola_logo_2013.svg.png',
    founded: '1928',
    hq: 'Chicago, USA',
    os: 'Android · My UX',
    tags: ['Android', 'My UX', 'Mid-Range · Budget', 'USA', 'Near-stock Android'],
    description:
      'Motorola (owned by Lenovo) offers reliable near-stock Android at mid and budget price points. The Edge series brings curved OLED displays and Snapdragon silicon to the masses, while the Moto G series is a perennial best-seller under $300.',
    highlights: ['Near-stock Android experience', '3 years OS updates (Edge)', 'Moto G — best budget value'],
  },
  sony: {
    name: 'Sony',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/2560px-Sony_logo.svg.png',
    founded: '1946',
    hq: 'Tokyo, Japan',
    os: 'Android · Sony UI',
    tags: ['Android', 'Sony UI', 'Flagship', 'Japan', '4K OLED displays', 'Pro camera'],
    description:
      "Sony's Xperia 1 series targets creative professionals with a 4K 120Hz OLED display, 3.5mm jack, and manual camera controls borrowed from Sony's Alpha camera lineup. The Xperia line is the only mainstream Android with a true pro-cinema video mode.",
    highlights: ['4K 120Hz OLED display', '3.5mm headphone jack', 'Alpha-class manual camera controls'],
  },
  nothing: {
    name: 'Nothing',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Nothing_Technology_logo.svg/2560px-Nothing_Technology_logo.svg.png',
    founded: '2020',
    hq: 'London, UK',
    os: 'Android · Nothing OS',
    tags: ['Android', 'Nothing OS', 'Mid-Range', 'UK', 'Glyph Interface', 'Transparent design'],
    description:
      'Nothing disrupted the mid-range market with its iconic transparent back and Glyph LED notification system. Nothing OS is lean and fast, with a commitment to 3 years of Android updates. The Phone (3) targets Snapdragon 8-series performance at under $700.',
    highlights: ['Glyph LED notification system', 'Transparent back design', 'Lean Nothing OS'],
  },
  asus: {
    name: 'ASUS',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/2560px-ASUS_Logo.svg.png',
    founded: '1989',
    hq: 'Taipei, Taiwan',
    os: 'Android · ROG UI / Zen UI',
    tags: ['Android', 'ROG UI', 'Gaming Flagship', 'Taiwan', '165Hz display', 'AirTriggers'],
    description:
      'ASUS makes two distinct phone lines: the ROG Phone series — the definitive Android gaming smartphone — and the Zenfone series, a compact flagship for power users who prefer a smaller form factor. ROG Phones feature AirTrigger shoulder buttons and active cooling.',
    highlights: ['Best gaming phones (ROG series)', 'AirTrigger shoulder buttons', 'Compact flagship Zenfone'],
  },
  realme: {
    name: 'realme',
    logo: '',
    founded: '2018',
    hq: 'Shenzhen, China',
    os: 'Android · realme UI',
    tags: ['Android', 'realme UI', 'Mid-Range · Budget', 'China', '240W charging'],
    description:
      'realme targets young buyers with bold design and fast specs at low prices. The GT series competes with flagships at mid-range prices, while the C and Note series dominate sub-$200 segments. realme was the fastest brand to reach 100 million users.',
    highlights: ['Fastest-growing smartphone brand', '240W UltraDart charging', 'GT series flagship value'],
  },
  honor: {
    name: 'Honor',
    logo: '',
    founded: '2013',
    hq: 'Shenzhen, China',
    os: 'Android · MagicOS',
    tags: ['Android', 'MagicOS', 'Flagship · Mid-Range', 'China', 'AI features'],
    description:
      'Honor (formerly Huawei sub-brand, now independent) has rapidly expanded its global portfolio with AI-powered features in MagicOS. The Magic series brings competitive flagship specs with a focus on AI photography and battery endurance.',
    highlights: ['AI-powered MagicOS', 'Independent from Huawei since 2020', 'Magic series flagship'],
  },
  huawei: {
    name: 'Huawei',
    logo: '',
    founded: '1987',
    hq: 'Shenzhen, China',
    os: 'HarmonyOS',
    tags: ['HarmonyOS', 'Flagship · Mid-Range', 'China', 'Leica cameras', 'Kirin chips'],
    description:
      'Huawei pioneered computational photography with Leica and developed its own Kirin chipsets. Despite US trade restrictions, Huawei continues with HarmonyOS and its own app ecosystem. The Mate and P series remain technically impressive.',
    highlights: ['Leica camera partnership', 'HarmonyOS independent ecosystem', 'Kirin in-house chips'],
  },
}

export default BRANDS

/** Look up brand info by any casing or slug format */
export function getBrandInfo(slugOrName: string): BrandInfo | null {
  const key = slugOrName.toLowerCase().replace(/\s+/g, '-').replace(/-/g, '')
  // try direct key
  if (BRANDS[key]) return BRANDS[key]
  // try slug with spaces
  const spaced = slugOrName.toLowerCase().replace(/-/g, ' ').trim()
  const entry = Object.entries(BRANDS).find(
    ([k, v]) => k === spaced.replace(/\s/g, '') || v.name.toLowerCase() === spaced
  )
  return entry ? entry[1] : null
}

/** Get first letter of brand name for logo fallback */
export function getBrandInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?'
}
