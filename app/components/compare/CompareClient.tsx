// app/components/compare/CompareClient.tsx
'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  X,
  ArrowLeft,
  Search,
  Zap,
  Battery,
  Camera,
  Cpu,
  Monitor,
  Weight,
  ChevronDown,
  ChevronUp,
  Share2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  Trophy,
  Wifi,
  Bluetooth,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const API = 'https://mobylite-api.up.railway.app';
const MAX_PHONES = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Phone {
  id: number;
  model_name: string;
  brand: string;
  price_usd: number | null;
  main_image_url: string | null;
  release_year: number | null;
  release_month: number | null;
  battery_capacity: number | null;
  main_camera_mp: number | null;
  front_camera_mp: number | null;
  screen_size: number | null;
  display_type: string | null;
  display_resolution: string | null;
  refresh_rate: number | null;
  weight_g: number | null;
  chipset: string | null;
  chipset_tier: string | null;
  ram_options: number[] | null;
  storage_options: number[] | null;
  fast_charging_w: number | null;
  antutu_score: number | null;
  os: string | null;
  has_5g: boolean | null;
  has_nfc: boolean | null;
  has_wireless_charging: boolean | null;
  has_headphone_jack: boolean | null;
  water_resistance: string | null;
}

interface SearchResult {
  id: number;
  model_name: string;
  brand: string;
  price_usd: number | null;
  main_image_url: string | null;
  release_year: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function phoneUrl(phone: Phone): string {
  return `/${slugify(phone.brand)}/${slugify(phone.model_name)}`;
}

function buildCompareUrl(phones: Phone[]): string {
  if (phones.length === 0) return '/compare';
  const slugs = phones
    .map((p) => `${slugify(p.model_name)}`)
    .join('-vs-');
  return `/compare/${slugs}`;
}

function fmtPrice(v: number | null): string {
  if (v == null) return '—';
  return `$${v.toLocaleString()}`;
}

function fmtNum(v: number | null, suffix = ''): string {
  if (v == null) return '—';
  return `${v.toLocaleString()}${suffix}`;
}

function fmtStr(v: string | null): string {
  return v ?? '—';
}

function fmtRam(options: number[] | null): string {
  if (!options || options.length === 0) return '—';
  const max = Math.max(...options);
  return `${max} GB`;
}

function fmtStorage(options: number[] | null): string {
  if (!options || options.length === 0) return '—';
  const max = Math.max(...options);
  return max >= 1000 ? `${max / 1000} TB` : `${max} GB`;
}

// ─── Score / Winner logic ─────────────────────────────────────────────────────

function compositeScore(p: Phone): number {
  let s = 0;
  if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3;
  if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2;
  if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2;
  if (p.fast_charging_w) s += Math.min(p.fast_charging_w / 100, 1);
  if (p.refresh_rate) s += Math.min(p.refresh_rate / 165, 1) * 0.5;
  return s;
}

// Returns index of the "winner" for a given metric (higher = better unless inverted)
function winnerIdx(
  phones: Phone[],
  getter: (p: Phone) => number | null,
  invert = false
): number {
  let best = -1;
  let bestVal = invert ? Infinity : -Infinity;
  phones.forEach((p, i) => {
    const v = getter(p);
    if (v == null) return;
    if (invert ? v < bestVal : v > bestVal) {
      bestVal = v;
      best = i;
    }
  });
  return best;
}

// ─── Spec Row ─────────────────────────────────────────────────────────────────

interface SpecRowProps {
  label: string;
  phones: Phone[];
  getValue: (p: Phone) => string;
  getRaw?: (p: Phone) => number | null;
  invert?: boolean;  // lower is better (e.g. weight)
  isBoolean?: boolean;
  getBool?: (p: Phone) => boolean | null;
  zebra?: boolean;
}

function SpecRow({
  label,
  phones,
  getValue,
  getRaw,
  invert = false,
  isBoolean = false,
  getBool,
  zebra = false,
}: SpecRowProps) {
  const winner = getRaw
    ? winnerIdx(phones, getRaw, invert)
    : -1;

  const cols = phones.length;

  return (
    <div
      className={`flex min-h-[44px] ${
        zebra ? 'bg-gray-800/25' : 'bg-transparent'
      }`}
    >
      {/* Label */}
      <div className="flex items-center px-3 py-2.5 text-xs text-gray-500 font-medium flex-shrink-0 w-[110px] sm:w-[150px] border-r border-gray-800/60">
        {label}
      </div>

      {/* Values */}
      {phones.map((p, i) => {
        const isWinner = winner === i;

        let content: React.ReactNode;

        if (isBoolean && getBool) {
          const val = getBool(p);
          if (val == null) {
            content = <span className="text-gray-600 text-sm">—</span>;
          } else if (val) {
            content = (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={13} />
                Yes
              </span>
            );
          } else {
            content = (
              <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
                <X size={12} />
                No
              </span>
            );
          }
        } else {
          const val = getValue(p);
          content = (
            <span
              className={`text-sm font-medium ${
                isWinner
                  ? 'text-emerald-400'
                  : val === '—'
                  ? 'text-gray-600'
                  : 'text-gray-200'
              }`}
            >
              {val}
              {isWinner && winner >= 0 && (
                <Trophy
                  size={10}
                  className="inline ml-1 text-emerald-400 opacity-70"
                />
              )}
            </span>
          );
        }

        return (
          <div
            key={p.id}
            className={`flex items-center justify-center px-2 py-2.5 text-center border-r border-gray-800/60 last:border-r-0 ${
              cols === 2
                ? 'flex-1'
                : cols === 3
                ? 'flex-1'
                : 'flex-1'
            } ${isWinner ? 'bg-emerald-950/10' : ''}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

// ─── Spec Section ─────────────────────────────────────────────────────────────

interface SectionDef {
  title: string;
  icon: React.ReactNode;
  rows: SpecRowProps[];
}

function buildSections(phones: Phone[]): SectionDef[] {
  return [
    {
      title: 'Overview',
      icon: <SlidersHorizontal size={14} />,
      rows: [
        {
          label: 'Price',
          phones,
          getValue: (p) => fmtPrice(p.price_usd),
          getRaw: (p) => p.price_usd ? -p.price_usd : null, // lower price = better value
        },
        {
          label: 'Released',
          phones,
          getValue: (p) =>
            p.release_year
              ? p.release_month
                ? `${p.release_year}/${String(p.release_month).padStart(2, '0')}`
                : String(p.release_year)
              : '—',
          getRaw: (p) => p.release_year,
        },
        {
          label: 'OS',
          phones,
          getValue: (p) => fmtStr(p.os),
        },
      ],
    },
    {
      title: 'Display',
      icon: <Monitor size={14} />,
      rows: [
        {
          label: 'Screen Size',
          phones,
          getValue: (p) => fmtNum(p.screen_size, '"'),
          getRaw: (p) => p.screen_size,
        },
        {
          label: 'Type',
          phones,
          getValue: (p) => fmtStr(p.display_type),
        },
        {
          label: 'Resolution',
          phones,
          getValue: (p) => fmtStr(p.display_resolution),
        },
        {
          label: 'Refresh Rate',
          phones,
          getValue: (p) => fmtNum(p.refresh_rate, ' Hz'),
          getRaw: (p) => p.refresh_rate,
        },
      ],
    },
    {
      title: 'Performance',
      icon: <Cpu size={14} />,
      rows: [
        {
          label: 'Chipset',
          phones,
          getValue: (p) => fmtStr(p.chipset),
        },
        {
          label: 'AnTuTu',
          phones,
          getValue: (p) =>
            p.antutu_score
              ? p.antutu_score.toLocaleString()
              : '—',
          getRaw: (p) => p.antutu_score,
        },
        {
          label: 'RAM (max)',
          phones,
          getValue: (p) => fmtRam(p.ram_options),
          getRaw: (p) =>
            p.ram_options?.length ? Math.max(...p.ram_options) : null,
        },
        {
          label: 'Storage (max)',
          phones,
          getValue: (p) => fmtStorage(p.storage_options),
          getRaw: (p) =>
            p.storage_options?.length
              ? Math.max(...p.storage_options)
              : null,
        },
      ],
    },
    {
      title: 'Camera',
      icon: <Camera size={14} />,
      rows: [
        {
          label: 'Main Camera',
          phones,
          getValue: (p) => fmtNum(p.main_camera_mp, ' MP'),
          getRaw: (p) => p.main_camera_mp,
        },
        {
          label: 'Front Camera',
          phones,
          getValue: (p) => fmtNum(p.front_camera_mp, ' MP'),
          getRaw: (p) => p.front_camera_mp,
        },
      ],
    },
    {
      title: 'Battery',
      icon: <Battery size={14} />,
      rows: [
        {
          label: 'Capacity',
          phones,
          getValue: (p) => fmtNum(p.battery_capacity, ' mAh'),
          getRaw: (p) => p.battery_capacity,
        },
        {
          label: 'Fast Charging',
          phones,
          getValue: (p) => fmtNum(p.fast_charging_w, ' W'),
          getRaw: (p) => p.fast_charging_w,
        },
        {
          label: 'Wireless',
          phones,
          isBoolean: true,
          getBool: (p) => p.has_wireless_charging,
          getValue: (p) => (p.has_wireless_charging ? 'Yes' : 'No'),
        },
      ],
    },
    {
      title: 'Connectivity',
      icon: <Wifi size={14} />,
      rows: [
        {
          label: '5G',
          phones,
          isBoolean: true,
          getBool: (p) => p.has_5g,
          getValue: (p) => (p.has_5g ? 'Yes' : 'No'),
        },
        {
          label: 'NFC',
          phones,
          isBoolean: true,
          getBool: (p) => p.has_nfc,
          getValue: (p) => (p.has_nfc ? 'Yes' : 'No'),
        },
        {
          label: 'Headphone Jack',
          phones,
          isBoolean: true,
          getBool: (p) => p.has_headphone_jack,
          getValue: (p) => (p.has_headphone_jack ? 'Yes' : 'No'),
        },
      ],
    },
    {
      title: 'Build',
      icon: <Weight size={14} />,
      rows: [
        {
          label: 'Weight',
          phones,
          getValue: (p) => fmtNum(p.weight_g, ' g'),
          getRaw: (p) => p.weight_g ? -p.weight_g : null, // lighter = better
        },
        {
          label: 'Water Resist.',
          phones,
          getValue: (p) => fmtStr(p.water_resistance),
        },
      ],
    },
  ];
}

function SpecSection({
  section,
  defaultOpen = true,
}: {
  section: SectionDef;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-800/60 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <span className="text-gray-400">{section.icon}</span>
          {section.title}
        </div>
        {open ? (
          <ChevronUp size={15} className="text-gray-500" />
        ) : (
          <ChevronDown size={15} className="text-gray-500" />
        )}
      </button>

      {/* Rows */}
      {open && (
        <div className="divide-y divide-gray-800/40">
          {section.rows.map((row, idx) => (
            <SpecRow key={row.label} {...row} zebra={idx % 2 === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Winner Banner ────────────────────────────────────────────────────────────

function WinnerBanner({ phones }: { phones: Phone[] }) {
  const scores = phones.map(compositeScore);
  const maxScore = Math.max(...scores, 0.001);
  const winIdx = scores.indexOf(Math.max(...scores));

  return (
    <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 to-gray-900/40 p-4 sm:p-5">
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Trophy size={16} className="text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">
          Overall Winner
        </span>
        <span className="px-2.5 py-0.5 bg-emerald-500 rounded-full text-xs font-bold text-black">
          {phones[winIdx]?.model_name}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          by composite score
        </span>
      </div>

      {/* Score bars */}
      <div className="space-y-2.5">
        {phones.map((p, i) => {
          const pct = maxScore > 0 ? (scores[i] / maxScore) * 100 : 0;
          const isWin = i === winIdx;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 truncate flex-shrink-0 w-24 sm:w-36 text-right">
                {p.model_name}
              </span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isWin ? 'bg-emerald-500' : 'bg-blue-500/50'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phone Card (in the header row) ──────────────────────────────────────────

function PhoneCard({
  phone,
  onRemove,
  isBestValue,
}: {
  phone: Phone;
  onRemove: () => void;
  isBestValue: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-colors ${
        isBestValue
          ? 'border-emerald-600/50 bg-emerald-950/20'
          : 'border-gray-800/60 bg-gray-900/30'
      }`}
    >
      {isBestValue && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 rounded-full text-[10px] font-bold text-black whitespace-nowrap z-10">
          <Trophy size={8} />
          Best
        </div>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-800 hover:bg-red-900/60 flex items-center justify-center transition-colors z-10"
        aria-label={`Remove ${phone.model_name}`}
      >
        <X size={11} className="text-gray-400" />
      </button>

      {/* Image */}
      <Link
        href={phoneUrl(phone)}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-800/60 overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
      >
        {phone.main_image_url ? (
          <Image
            src={phone.main_image_url}
            alt={phone.model_name}
            width={80}
            height={80}
            className="object-contain w-full h-full p-1"
            unoptimized
          />
        ) : (
          <span className="text-2xl sm:text-3xl">📱</span>
        )}
      </Link>

      {/* Info */}
      <div className="text-center w-full min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide truncate">
          {phone.brand}
        </p>
        <Link
          href={phoneUrl(phone)}
          className="block text-xs sm:text-sm font-semibold text-gray-100 hover:text-blue-400 transition-colors leading-tight mt-0.5 line-clamp-2"
        >
          {phone.model_name}
        </Link>
        {phone.price_usd && (
          <p className="mt-1 text-xs sm:text-sm font-bold text-blue-400">
            ${phone.price_usd.toLocaleString()}
          </p>
        )}
        {phone.release_year && (
          <p className="text-[10px] text-gray-600 mt-0.5">{phone.release_year}</p>
        )}
      </div>
    </div>
  );
}

// ─── Add Phone Slot ───────────────────────────────────────────────────────────

function AddSlot({
  onSelect,
  excludeIds,
}: {
  onSelect: (p: SearchResult) => void;
  excludeIds: number[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=8`
        );
        const d = await r.json();
        setResults(
          (d.results || []).filter(
            (p: SearchResult) => !excludeIds.includes(p.id)
          )
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, excludeIds]);

  function handleSelect(p: SearchResult) {
    onSelect(p);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center gap-2 w-full min-h-[160px] sm:min-h-[200px] rounded-2xl border-2 border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-950/10 transition-all group"
      >
        <div className="w-9 h-9 rounded-xl bg-gray-800 group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
          <Plus size={18} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
        </div>
        <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
          Add phone
        </span>
      </button>
    );
  }

  return (
    <div className="w-full min-h-[160px] sm:min-h-[200px] rounded-2xl border border-blue-500/30 bg-blue-950/10 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-blue-400">Search</span>
        <button
          onClick={() => {
            setOpen(false);
            setQuery('');
            setResults([]);
          }}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Input */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type phone name…"
          className="w-full pl-8 pr-8 py-2 bg-gray-800/70 border border-gray-700/60 rounded-xl text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-all"
        />
        {loading && (
          <Loader2
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
          />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-700/40 bg-gray-900/80 divide-y divide-gray-800/40 max-h-[180px]">
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                {p.main_image_url ? (
                  <Image
                    src={p.main_image_url}
                    alt={p.model_name}
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-sm">
                    📱
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">
                  {p.model_name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {p.brand}
                  {p.release_year ? ` · ${p.release_year}` : ''}
                  {p.price_usd ? ` · $${p.price_usd}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-2">
          No phones found
        </p>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  onAdd,
}: {
  onAdd: (p: SearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=8`
        );
        const d = await r.json();
        setResults(d.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  return (
    <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mb-5">
        <SlidersHorizontal size={28} className="text-blue-400" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
        Compare Phones
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
        Search for phones below and add up to 4 to compare specs side by
        side.
      </p>

      {/* Search */}
      <div className="relative w-full max-w-sm mb-8">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a phone…"
          autoFocus
          className="w-full pl-11 pr-4 py-3 bg-gray-800/60 border border-gray-700/60 rounded-2xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-gray-800 transition-all"
        />
        {loading && (
          <Loader2
            size={15}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
          />
        )}

        {/* Dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onAdd(p);
                  setQuery('');
                  setResults([]);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                  {p.main_image_url ? (
                    <Image
                      src={p.main_image_url}
                      alt={p.model_name}
                      width={36}
                      height={36}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-lg">
                      📱
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {p.model_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.brand}
                    {p.release_year ? ` · ${p.release_year}` : ''}
                    {p.price_usd ? ` · $${p.price_usd}` : ''}
                  </p>
                </div>
                <Plus size={14} className="text-blue-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-gray-900 border border-gray-700/60 rounded-2xl shadow-xl px-4 py-3">
            <p className="text-sm text-gray-500 text-center">
              No phones found for &quot;{query}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Suggested */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">
          Try comparing
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Samsung Galaxy S25 Ultra',
            'Apple iPhone 16 Pro',
            'Google Pixel 9 Pro',
            'Xiaomi 15 Ultra',
          ].map((name) => (
            <button
              key={name}
              onClick={() => setQuery(name)}
              className="flex items-center justify-between px-4 py-2.5 bg-gray-800/40 hover:bg-gray-800/70 rounded-xl transition-colors group text-left"
            >
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {name}
              </span>
              <Search
                size={13}
                className="text-gray-600 group-hover:text-blue-400 transition-colors"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function CompareHeader({
  phoneCount,
  onReset,
  onShare,
  copied,
}: {
  phoneCount: number;
  onReset: () => void;
  onShare: () => void;
  copied: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center gap-3">
        {/* Back */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="text-sm hidden sm:inline">Home</span>
        </Link>

        <div className="w-px h-5 bg-gray-800 flex-shrink-0" />

        {/* Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SlidersHorizontal size={15} className="text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-200 truncate">
            Compare Phones
          </span>
          {phoneCount >= 2 && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              · {phoneCount} selected
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {phoneCount >= 2 && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Share2 size={12} />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          )}
          {phoneCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-red-950/40 rounded-xl text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Column Headers (sticky phone names above spec table) ────────────────────

function StickyPhoneHeaders({
  phones,
  onRemove,
  bestValueIdx,
}: {
  phones: Phone[];
  onRemove: (id: number) => void;
  bestValueIdx: number;
}) {
  if (phones.length < 2) return null;

  return (
    <div className="sticky top-14 z-30 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/40 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
      <div className="flex">
        {/* Label column spacer */}
        <div className="flex-shrink-0 w-[110px] sm:w-[150px]" />
        {/* Phone name columns */}
        {phones.map((p, i) => (
          <div
            key={p.id}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 px-1 border-l border-gray-800/40 ${
              i === bestValueIdx ? 'bg-emerald-950/10' : ''
            }`}
          >
            <span className="text-[10px] text-gray-500 truncate w-full text-center">
              {p.brand}
            </span>
            <span className="text-xs font-semibold text-gray-200 truncate w-full text-center leading-tight">
              {p.model_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Parse URL to get phone IDs ──────────────────────────────────────────
  // The URL slug format is /compare/slug1-vs-slug2-vs-slug3
  // We store phones by ID from API; slugs in URL are for SEO / shareability.
  // On load, we need to resolve slugs → IDs via search API.

  const urlSegment = useMemo(() => {
    const parts = pathname.split('/compare/');
    return parts[1] || '';
  }, [pathname]);

  useEffect(() => {
    if (!urlSegment) {
      setPhones([]);
      return;
    }

    // Check if it's numeric IDs (legacy / internal)
    const numericIds = urlSegment
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);

    if (numericIds.length >= 2) {
      // Direct ID format
      loadPhonesByIds(numericIds);
      return;
    }

    // Slug format: "model-a-vs-model-b"
    const slugs = urlSegment.split('-vs-').filter(Boolean);
    if (slugs.length >= 2) {
      loadPhonesBySlugs(slugs);
      return;
    }

    // Single slug — try to resolve
    if (slugs.length === 1) {
      loadPhonesBySlugs(slugs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSegment]);

  async function loadPhonesByIds(ids: number[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/phones/compare?ids=${ids.join(',')}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPhones(data.phones || []);
    } catch {
      setError('Failed to load phone data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPhonesBySlugs(slugs: string[]) {
    setLoading(true);
    setError(null);
    try {
      // Resolve each slug to a phone ID via search
      const resolved = await Promise.all(
        slugs.map(async (slug) => {
          const query = slug.replace(/-/g, ' ');
          const res = await fetch(
            `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=3`
          );
          if (!res.ok) return null;
          const data = await res.json();
          // Pick best match: exact model_name match preferred
          const results: SearchResult[] = data.results || [];
          if (results.length === 0) return null;
          // Try exact match first
          const exact = results.find(
            (r) =>
              slugify(r.model_name) === slug ||
              slugify(`${r.brand} ${r.model_name}`) === slug
          );
          return exact || results[0];
        })
      );

      const validResults = resolved.filter(
        (r): r is SearchResult => r !== null
      );

      if (validResults.length < 1) {
        setPhones([]);
        setError('Could not find the phones in the URL. Please search manually.');
        return;
      }

      // Now fetch full phone data
      const ids = validResults.map((r) => r.id);

      if (ids.length === 1) {
        // Only one phone resolved — fetch it fully
        const res = await fetch(`${API}/phones/${ids[0]}`);
        if (!res.ok) throw new Error('Failed');
        const phone: Phone = await res.json();
        setPhones([phone]);
        return;
      }

      const compareRes = await fetch(
        `${API}/phones/compare?ids=${ids.join(',')}`
      );
      if (!compareRes.ok) throw new Error('Failed to compare');
      const compareData = await compareRes.json();
      setPhones(compareData.phones || []);
    } catch {
      setError('Failed to load phone data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── URL sync ───────────────────────────────────────────────────────────
  const syncUrl = useCallback(
    (updatedPhones: Phone[]) => {
      if (updatedPhones.length === 0) {
        router.push('/compare', { scroll: false });
      } else {
        const slugs = updatedPhones
          .map((p) => slugify(p.model_name))
          .join('-vs-');
        router.push(`/compare/${slugs}`, { scroll: false });
      }
    },
    [router]
  );

  // ── Add phone ──────────────────────────────────────────────────────────
  const handleAdd = useCallback(
    async (result: SearchResult) => {
      if (phones.length >= MAX_PHONES) return;
      if (phones.some((p) => p.id === result.id)) return;

      try {
        const res = await fetch(`${API}/phones/${result.id}`);
        if (!res.ok) throw new Error('Failed');
        const full: Phone = await res.json();
        const updated = [...phones, full];
        setPhones(updated);
        syncUrl(updated);
      } catch {
        // fallback with partial data
        const partial = result as unknown as Phone;
        const updated = [...phones, partial];
        setPhones(updated);
        syncUrl(updated);
      }
    },
    [phones, syncUrl]
  );

  // ── Remove phone ───────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (id: number) => {
      const updated = phones.filter((p) => p.id !== id);
      setPhones(updated);
      syncUrl(updated);
    },
    [phones, syncUrl]
  );

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhones([]);
    router.push('/compare', { scroll: false });
  }, [router]);

  // ── Share ──────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // silent
    }
  }, []);

  // ── Best value index ───────────────────────────────────────────────────
  const bestValueIdx = useMemo(() => {
    if (phones.length < 2) return -1;
    const scores = phones.map((p) => {
      if (!p.price_usd) return 0;
      return compositeScore(p) / (p.price_usd / 500);
    });
    return scores.indexOf(Math.max(...scores));
  }, [phones]);

  // ── Spec sections ──────────────────────────────────────────────────────
  const sections = useMemo(
    () => (phones.length >= 2 ? buildSections(phones) : []),
    [phones]
  );

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <CompareHeader
          phoneCount={0}
          onReset={handleReset}
          onShare={handleShare}
          copied={false}
        />
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Loading phones…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <CompareHeader
        phoneCount={phones.length}
        onReset={handleReset}
        onShare={handleShare}
        copied={copied}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-20">
        {/* ── Phone picker slots ── */}
        <div className="pt-4 pb-2">
          <div
            className={`grid gap-3 ${
              phones.length === 0
                ? 'grid-cols-2 max-w-sm mx-auto'
                : phones.length === 1
                ? 'grid-cols-2 sm:grid-cols-2 max-w-lg mx-auto'
                : phones.length === 2
                ? 'grid-cols-2 sm:grid-cols-3'
                : phones.length === 3
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {phones.map((p, i) => (
              <PhoneCard
                key={p.id}
                phone={p}
                onRemove={() => handleRemove(p.id)}
                isBestValue={i === bestValueIdx && phones.length >= 2}
              />
            ))}

            {phones.length < MAX_PHONES && (
              <AddSlot
                onSelect={handleAdd}
                excludeIds={phones.map((p) => p.id)}
              />
            )}
          </div>
        </div>

        {/* ── Error notice ── */}
        {error && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-950/30 border border-red-800/30 rounded-2xl">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {phones.length === 0 && !loading && !error && (
          <EmptyState onAdd={handleAdd} />
        )}

        {/* ── One phone: prompt to add more ── */}
        {phones.length === 1 && (
          <div className="mt-6 flex items-center justify-center gap-3 px-4 py-3.5 bg-blue-950/30 border border-blue-800/30 rounded-2xl max-w-md mx-auto">
            <Plus size={15} className="text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-300">
              Add one more phone to start comparing
            </p>
          </div>
        )}

        {/* ── Comparison table ── */}
        {phones.length >= 2 && (
          <>
            {/* Sticky column headers */}
            <StickyPhoneHeaders
              phones={phones}
              onRemove={handleRemove}
              bestValueIdx={bestValueIdx}
            />

            <div className="mt-4 space-y-3">
              {/* Winner banner */}
              <WinnerBanner phones={phones} />

              {/* Spec sections */}
              {sections.map((sec, i) => (
                <SpecSection
                  key={sec.title}
                  section={sec}
                  defaultOpen={i < 4}
                />
              ))}

              {/* View full detail links */}
              <div className="pt-2 border-t border-gray-800/40">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-3">
                  Full Details
                </p>
                <div className="flex flex-wrap gap-2">
                  {phones.map((p) => (
                    <Link
                      key={p.id}
                      href={phoneUrl(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {p.model_name}
                      <ArrowLeft size={10} className="rotate-180 opacity-60" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
