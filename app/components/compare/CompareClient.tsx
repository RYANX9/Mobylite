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
  Loader2,
  SlidersHorizontal,
  Trophy,
  Wifi,
  AlertCircle,
  Menu,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = 'https://renderphones.onrender.com';
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
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function phoneUrl(phone: Phone): string {
  return `/${slugify(phone.brand)}/${slugify(phone.model_name)}`;
}

function buildCompareUrl(phones: Phone[]): string {
  if (phones.length === 0) return '/compare';
  const slug = phones.map((p) => slugify(p.model_name)).join('-vs-');
  return `/compare/${slug}`;
}

function fmtPrice(v: number | null): string {
  if (v == null) return '—';
  return `$${v.toLocaleString()}`;
}

function fmtNum(v: number | null | undefined, suffix = ''): string {
  if (v == null) return '—';
  return `${v.toLocaleString()}${suffix}`;
}

function fmtStr(v: string | null | undefined): string {
  if (!v) return '—';
  return v;
}

function fmtRam(opts: number[] | null): string {
  if (!opts || opts.length === 0) return '—';
  return `${Math.max(...opts)} GB`;
}

function fmtStorage(opts: number[] | null): string {
  if (!opts || opts.length === 0) return '—';
  const max = Math.max(...opts);
  return max >= 1000 ? `${max / 1000} TB` : `${max} GB`;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function compositeScore(p: Phone): number {
  let s = 0;
  if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3;
  if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2;
  if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2;
  if (p.fast_charging_w) s += Math.min(p.fast_charging_w / 100, 1);
  if (p.refresh_rate) s += Math.min(p.refresh_rate / 165, 1) * 0.5;
  return s;
}

function getBestIdx(
  phones: Phone[],
  getter: (p: Phone) => number | null,
  lowerIsBetter = false
): number {
  let bestIdx = -1;
  let bestVal = lowerIsBetter ? Infinity : -Infinity;
  phones.forEach((p, i) => {
    const v = getter(p);
    if (v == null) return;
    if (lowerIsBetter ? v < bestVal : v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

// ─── Slug → Phone resolver ────────────────────────────────────────────────────

async function resolveSlugToPhone(slug: string): Promise<SearchResult | null> {
  const query = slug.replace(/-/g, ' ').trim();

  try {
    const res = await fetch(
      `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: SearchResult[] = data.results || [];
    if (results.length === 0) return null;

    const scored = results.map((r) => {
      const rSlug = slugify(r.model_name);
      const rFullSlug = slugify(`${r.brand} ${r.model_name}`);
      let score = 0;
      if (rSlug === slug) score += 100;
      if (rFullSlug === slug) score += 90;
      if (slug.includes(rSlug)) score += 50;
      if (rSlug.includes(slug)) score += 40;
      const slugWords = slug.split('-').filter(Boolean);
      const nameWords = rSlug.split('-').filter(Boolean);
      const matches = slugWords.filter((w) => nameWords.includes(w)).length;
      score += matches * 10;
      return { r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].r;
  } catch {
    return null;
  }
}

// ─── Spec Row ─────────────────────────────────────────────────────────────────

interface RowDef {
  label: string;
  getValue: (p: Phone) => string;
  getRaw?: (p: Phone) => number | null;
  lowerIsBetter?: boolean;
  isBool?: boolean;
  getBool?: (p: Phone) => boolean | null;
}

function SpecRow({
  row,
  phones,
  zebra,
}: {
  row: RowDef;
  phones: Phone[];
  zebra: boolean;
}) {
  const winIdx = row.getRaw
    ? getBestIdx(phones, row.getRaw, row.lowerIsBetter)
    : -1;

  return (
    <div
      className={`flex flex-col sm:flex-row min-h-auto sm:min-h-[46px] border-b border-slate-800/40 last:border-b-0 ${
        zebra ? 'bg-slate-900/30' : ''
      }`}
    >
      {/* Label — sticky on mobile */}
      <div className="px-3 sm:px-4 py-3 sm:py-2 w-full sm:w-[100px] md:w-[140px] flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-800/40 bg-slate-900/50 sm:bg-transparent">
        <span className="text-xs sm:text-xs font-semibold text-slate-400 leading-tight">
          {row.label}
        </span>
      </div>

      {/* Values — stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row flex-1">
        {phones.map((p, i) => {
          const isWin = winIdx === i && winIdx >= 0;

          let node: React.ReactNode;

          if (row.isBool && row.getBool) {
            const val = row.getBool(p);
            if (val == null) {
              node = <span className="text-slate-700 text-xs">—</span>;
            } else if (val) {
              node = (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 size={12} />
                  <span className="sm:hidden">Yes</span>
                  <span className="hidden sm:inline">Yes</span>
                </span>
              );
            } else {
              node = (
                <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                  <X size={11} />
                  <span className="sm:hidden">No</span>
                  <span className="hidden sm:inline">No</span>
                </span>
              );
            }
          } else {
            const val = row.getValue(p);
            node = (
              <span
                className={`text-xs sm:text-sm leading-tight font-medium ${
                  isWin
                    ? 'text-emerald-400'
                    : val === '—'
                    ? 'text-slate-700'
                    : 'text-slate-200'
                }`}
              >
                {val}
                {isWin && (
                  <Trophy
                    size={9}
                    className="inline ml-0.5 text-emerald-400 opacity-80"
                  />
                )}
              </span>
            );
          }

          return (
            <div
              key={p.id}
              className={`flex-1 flex items-center justify-center px-2 sm:px-3 py-2.5 sm:py-2 text-center border-r border-slate-800/30 last:border-r-0 ${
                isWin ? 'bg-emerald-950/20' : ''
              }`}
            >
              {node}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionDef {
  title: string;
  icon: React.ReactNode;
  rows: RowDef[];
}

function getSections(phones: Phone[]): SectionDef[] {
  return [
    {
      title: 'Overview',
      icon: <SlidersHorizontal size={13} />,
      rows: [
        {
          label: 'Price',
          getValue: (p) => fmtPrice(p.price_usd),
          getRaw: (p) => (p.price_usd ? -p.price_usd : null),
        },
        {
          label: 'Released',
          getValue: (p) =>
            p.release_year
              ? p.release_month
                ? `${p.release_year} / ${String(p.release_month).padStart(2, '0')}`
                : String(p.release_year)
              : '—',
          getRaw: (p) => p.release_year,
        },
        { label: 'OS', getValue: (p) => fmtStr(p.os) },
      ],
    },
    {
      title: 'Display',
      icon: <Monitor size={13} />,
      rows: [
        {
          label: 'Screen Size',
          getValue: (p) => fmtNum(p.screen_size, '"'),
          getRaw: (p) => p.screen_size,
        },
        { label: 'Panel Type', getValue: (p) => fmtStr(p.display_type) },
        { label: 'Resolution', getValue: (p) => fmtStr(p.display_resolution) },
        {
          label: 'Refresh Rate',
          getValue: (p) => fmtNum(p.refresh_rate, ' Hz'),
          getRaw: (p) => p.refresh_rate,
        },
      ],
    },
    {
      title: 'Performance',
      icon: <Cpu size={13} />,
      rows: [
        { label: 'Chipset', getValue: (p) => fmtStr(p.chipset) },
        {
          label: 'AnTuTu',
          getValue: (p) =>
            p.antutu_score ? p.antutu_score.toLocaleString() : '—',
          getRaw: (p) => p.antutu_score,
        },
        {
          label: 'RAM (max)',
          getValue: (p) => fmtRam(p.ram_options),
          getRaw: (p) =>
            p.ram_options?.length ? Math.max(...p.ram_options) : null,
        },
        {
          label: 'Storage (max)',
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
      icon: <Camera size={13} />,
      rows: [
        {
          label: 'Main Camera',
          getValue: (p) => fmtNum(p.main_camera_mp, ' MP'),
          getRaw: (p) => p.main_camera_mp,
        },
        {
          label: 'Front Camera',
          getValue: (p) => fmtNum(p.front_camera_mp, ' MP'),
          getRaw: (p) => p.front_camera_mp,
        },
      ],
    },
    {
      title: 'Battery',
      icon: <Battery size={13} />,
      rows: [
        {
          label: 'Capacity',
          getValue: (p) => fmtNum(p.battery_capacity, ' mAh'),
          getRaw: (p) => p.battery_capacity,
        },
        {
          label: 'Fast Charging',
          getValue: (p) => fmtNum(p.fast_charging_w, ' W'),
          getRaw: (p) => p.fast_charging_w,
        },
        {
          label: 'Wireless',
          getValue: (p) => (p.has_wireless_charging ? 'Yes' : 'No'),
          isBool: true,
          getBool: (p) => p.has_wireless_charging,
        },
      ],
    },
    {
      title: 'Connectivity',
      icon: <Wifi size={13} />,
      rows: [
        {
          label: '5G',
          getValue: (p) => (p.has_5g ? 'Yes' : 'No'),
          isBool: true,
          getBool: (p) => p.has_5g,
        },
        {
          label: 'NFC',
          getValue: (p) => (p.has_nfc ? 'Yes' : 'No'),
          isBool: true,
          getBool: (p) => p.has_nfc,
        },
        {
          label: 'Headphone Jack',
          getValue: (p) => (p.has_headphone_jack ? 'Yes' : 'No'),
          isBool: true,
          getBool: (p) => p.has_headphone_jack,
        },
      ],
    },
    {
      title: 'Build',
      icon: <Weight size={13} />,
      rows: [
        {
          label: 'Weight',
          getValue: (p) => fmtNum(p.weight_g, ' g'),
          getRaw: (p) => (p.weight_g ? -p.weight_g : null),
        },
        {
          label: 'Water Resist.',
          getValue: (p) => fmtStr(p.water_resistance),
        },
      ],
    },
  ];
}

function SpecSection({
  section,
  phones,
  defaultOpen,
}: {
  section: SectionDef;
  phones: Phone[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl md:rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-900/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{section.icon}</span>
          <span className="text-sm font-semibold text-slate-200">
            {section.title}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-slate-600" />
        ) : (
          <ChevronDown size={14} className="text-slate-600" />
        )}
      </button>

      {open && (
        <div>
          {section.rows.map((row, idx) => (
            <SpecRow
              key={row.label}
              row={row}
              phones={phones}
              zebra={idx % 2 === 0}
            />
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
    <div className="rounded-xl md:rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/30 p-3 sm:p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
        <Trophy size={15} className="text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-200">
          Overall Best Value
        </span>
        {phones[winIdx] && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-xs font-bold text-black ml-auto sm:ml-0">
            {phones[winIdx].model_name.split(' ').slice(-2).join(' ')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {phones.map((p, i) => {
          const pct = (scores[i] / maxScore) * 100;
          const isWin = i === winIdx;
          return (
            <div key={p.id} className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-slate-500 truncate w-16 sm:w-28 md:w-32 text-right flex-shrink-0">
                {p.model_name.split(' ').slice(-2).join(' ')}
              </span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isWin ? 'bg-emerald-500' : 'bg-blue-500/50'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 w-7 text-right flex-shrink-0">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phone Card ───────────────────────────────────────────────────────────────

function PhoneCard({
  phone,
  onRemove,
  isBest,
}: {
  phone: Phone;
  onRemove: () => void;
  isBest: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-2 sm:p-3 rounded-lg md:rounded-2xl border transition-colors ${
        isBest
          ? 'border-emerald-600/50 bg-emerald-950/20'
          : 'border-slate-800/60 bg-slate-900/30'
      }`}
    >
      {isBest && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500 rounded-full text-[9px] sm:text-[10px] font-bold text-black whitespace-nowrap z-10">
          <Trophy size={8} />
          Best
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 rounded-full bg-slate-800 hover:bg-red-900/60 flex items-center justify-center transition-colors z-10"
        aria-label={`Remove ${phone.model_name}`}
      >
        <X size={10} className="text-slate-400" />
      </button>

      <Link
        href={phoneUrl(phone)}
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl bg-slate-800/60 overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0 mt-1"
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
          <Smartphone size={24} className="text-slate-600" />
        )}
      </Link>

      <div className="text-center w-full min-w-0 px-1">
        <p className="text-[9px] sm:text-[10px] text-slate-600 uppercase tracking-wide truncate">
          {phone.brand}
        </p>
        <Link
          href={phoneUrl(phone)}
          className="block text-[10px] sm:text-xs font-semibold text-slate-100 hover:text-blue-400 transition-colors leading-tight mt-0.5 line-clamp-2"
        >
          {phone.model_name}
        </Link>
        {phone.price_usd && (
          <p className="mt-1 text-[10px] sm:text-xs font-bold text-blue-400">
            ${phone.price_usd.toLocaleString()}
          </p>
        )}
        {phone.release_year && (
          <p className="text-[8px] sm:text-[9px] text-slate-700 mt-0.5">
            {phone.release_year}
          </p>
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
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
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
    return () => clearTimeout(timerRef.current);
  }, [query, excludeIds]);

  function pick(p: SearchResult) {
    onSelect(p);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center gap-2 w-full min-h-[110px] sm:min-h-[140px] md:min-h-[180px] rounded-lg md:rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/10 transition-all group"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800 group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
          <Plus
            size={16}
            className="text-slate-600 group-hover:text-blue-400 transition-colors"
          />
        </div>
        <span className="text-[10px] sm:text-xs text-slate-700 group-hover:text-slate-400 transition-colors text-center px-2">
          Add phone
        </span>
      </button>
    );
  }

  return (
    <div className="w-full min-h-[110px] sm:min-h-[140px] md:min-h-[180px] rounded-lg md:rounded-2xl border border-blue-500/30 bg-blue-950/10 p-2 sm:p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-400">Add a phone</span>
        <button
          onClick={() => {
            setOpen(false);
            setQuery('');
            setResults([]);
          }}
          className="text-slate-600 hover:text-slate-300 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="relative">
        <Search
          size={11}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type phone…"
          className="w-full pl-7 pr-6 py-1.5 sm:py-2 bg-slate-800/70 border border-slate-700/50 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-all"
        />
        {loading && (
          <Loader2
            size={10}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 animate-spin"
          />
        )}
      </div>

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto rounded-lg bg-slate-900/80 border border-slate-800/40 divide-y divide-slate-800/30 max-h-[140px]">
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => pick(p)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
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
                <p className="text-xs font-medium text-slate-200 truncate">
                  {p.model_name}
                </p>
                <p className="text-[10px] text-slate-600">
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
        <p className="text-xs text-slate-700 text-center py-2">
          No phones found
        </p>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: (p: SearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
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
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const suggestions = [
    'Samsung Galaxy S25 Ultra',
    'Apple iPhone 16 Pro',
    'Google Pixel 9 Pro',
    'Xiaomi 15 Ultra',
  ];

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-20 px-3 sm:px-4 text-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mb-4 sm:mb-5">
        <SlidersHorizontal size={20} className="text-blue-400" />
      </div>

      <h2 className="text-lg sm:text-2xl font-bold text-slate-100 mb-2">
        Compare Phones
      </h2>
      <p className="text-slate-500 text-xs sm:text-sm max-w-xs sm:max-w-sm mb-6 sm:mb-8 leading-relaxed">
        Search for phones and add up to 4 to compare specs side by side.
      </p>

      {/* Search box */}
      <div className="relative w-full max-w-sm mb-6 sm:mb-8">
        <Search
          size={14}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phones…"
          autoFocus
          className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl sm:rounded-2xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-slate-800 transition-all"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 animate-spin"
          />
        )}

        {/* Dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-900 border border-slate-700/50 rounded-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onAdd(p);
                  setQuery('');
                  setResults([]);
                }}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 hover:bg-slate-800 transition-colors text-left border-b border-slate-800/20 last:border-b-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
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
                    <span className="w-full h-full flex items-center justify-center text-sm">
                      📱
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                    {p.model_name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    {p.brand}
                    {p.release_year ? ` · ${p.release_year}` : ''}
                    {p.price_usd ? ` · $${p.price_usd}` : ''}
                  </p>
                </div>
                <Plus size={12} className="text-blue-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-900 border border-slate-700/50 rounded-lg sm:rounded-2xl px-3 sm:px-4 py-3">
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              No phones found
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] sm:text-xs text-slate-700 font-medium uppercase tracking-wider mb-2 sm:mb-3">
          Popular Phones
        </p>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {suggestions.map((name) => (
            <button
              key={name}
              onClick={() => setQuery(name)}
              className="flex items-center justify-between px-3 py-2 bg-slate-800/40 hover:bg-slate-800/70 rounded-lg transition-colors group text-left text-xs sm:text-sm"
            >
              <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                {name}
              </span>
              <Search
                size={12}
                className="text-slate-700 group-hover:text-blue-400 transition-colors"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sticky Column Headers ────────────────────────────────────────────────────

function StickyColHeaders({
  phones,
  bestIdx,
}: {
  phones: Phone[];
  bestIdx: number;
}) {
  return (
    <div className="sticky top-14 z-30 -mx-2 sm:-mx-3 md:-mx-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/40">
      <div className="flex max-w-7xl mx-auto px-2 sm:px-3 md:px-4">
        {/* spacer for label col */}
        <div className="hidden sm:block w-[100px] md:w-[140px] flex-shrink-0" />
        
        {phones.map((p, i) => (
          <div
            key={p.id}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 border-l border-slate-800/30 text-center ${
              i === bestIdx ? 'bg-emerald-950/10' : ''
            }`}
          >
            <span className="text-[8px] sm:text-[10px] text-slate-600 truncate w-full uppercase tracking-wide">
              {p.brand}
            </span>
            <span className="text-[9px] sm:text-xs font-semibold text-slate-300 truncate w-full leading-tight line-clamp-2">
              {p.model_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function PageHeader({
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
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 h-14 flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0 p-1 hover:bg-slate-800/40 rounded-lg"
        >
          <ArrowLeft size={14} />
          <span className="text-xs hidden sm:inline">Home</span>
        </Link>

        <div className="w-px h-5 bg-slate-800 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SlidersHorizontal size={13} className="text-blue-400 flex-shrink-0 hidden sm:block" />
          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
            Compare
          </span>
          {phoneCount >= 2 && (
            <span className="text-xs text-slate-600 hidden sm:inline">
              · {phoneCount} phones
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {phoneCount >= 2 && (
            <button
              onClick={onShare}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy link"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Share2 size={11} />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          )}
          {phoneCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 bg-slate-800/60 hover:bg-red-950/40 rounded-lg text-[10px] sm:text-xs text-slate-400 hover:text-red-400 transition-colors"
              title="Reset comparison"
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const urlSegment = useMemo(() => {
    const match = pathname.match(/^\/compare\/(.+)$/);
    return match ? match[1] : '';
  }, [pathname]);

  const loadedSegmentRef = useRef('');

  useEffect(() => {
    if (urlSegment === loadedSegmentRef.current) return;
    loadedSegmentRef.current = urlSegment;

    if (!urlSegment) {
      setPhones([]);
      return;
    }

    if (/^\d+(,\d+)*$/.test(urlSegment)) {
      const ids = urlSegment.split(',').map(Number);
      fetchByIds(ids);
      return;
    }

    const slugs = urlSegment.split('-vs-').filter(Boolean);
    if (slugs.length >= 1) {
      fetchBySlugs(slugs);
    }
  }, [urlSegment]);

  async function fetchByIds(ids: number[]) {
    if (ids.length < 2) {
      setLoading(true);
      try {
        const res = await fetch(`${API}/phones/${ids[0]}`);
        if (!res.ok) throw new Error('Not found');
        const p: Phone = await res.json();
        setPhones([p]);
      } catch {
        setError('Could not load phone.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/phones/compare?ids=${ids.join(',')}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setPhones(data.phones || []);
    } catch {
      setError('Failed to load phones. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBySlugs(slugs: string[]) {
    setResolving(true);
    setError(null);
    try {
      const resolved = await Promise.all(
        slugs.map((slug) => resolveSlugToPhone(slug))
      );
      const validPhones = resolved.filter(
        (p): p is SearchResult => p !== null
      );

      if (validPhones.length === 0) {
        setPhones([]);
        setError(
          'Could not find these phones. Please search and add them manually.'
        );
        return;
      }

      const ids = validPhones.map((p) => p.id);

      if (ids.length === 1) {
        const res = await fetch(`${API}/phones/${ids[0]}`);
        if (!res.ok) throw new Error('Not found');
        const p: Phone = await res.json();
        setPhones([p]);
        return;
      }

      const res = await fetch(`${API}/phones/compare?ids=${ids.join(',')}`);
      if (!res.ok) throw new Error('Compare failed');
      const data = await res.json();
      setPhones(data.phones || []);
    } catch {
      setError('Failed to load phones. Please search and add them manually.');
    } finally {
      setResolving(false);
    }
  }

  function pushUrl(updatedPhones: Phone[]) {
    const url = buildCompareUrl(updatedPhones);
    const seg = url.replace('/compare/', '').replace('/compare', '');
    loadedSegmentRef.current = seg;
    router.push(url, { scroll: false });
  }

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
        pushUrl(updated);
      } catch {
        const partial = { ...result } as unknown as Phone;
        const updated = [...phones, partial];
        setPhones(updated);
        pushUrl(updated);
      }
    },
    [phones]
  );

  const handleRemove = useCallback(
    (id: number) => {
      const updated = phones.filter((p) => p.id !== id);
      setPhones(updated);
      pushUrl(updated);
    },
    [phones]
  );

  const handleReset = useCallback(() => {
    setPhones([]);
    setError(null);
    loadedSegmentRef.current = '';
    router.push('/compare', { scroll: false });
  }, [router]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* silent */
    }
  }, []);

  const bestIdx = useMemo(() => {
    if (phones.length < 2) return -1;
    const scores = phones.map((p) =>
      p.price_usd
        ? compositeScore(p) / (p.price_usd / 500)
        : 0
    );
    return scores.indexOf(Math.max(...scores));
  }, [phones]);

  const sections = useMemo(
    () => (phones.length >= 2 ? getSections(phones) : []),
    [phones]
  );

  const isLoading = loading || resolving;

  function gridClass() {
    const count = phones.length;
    const withSlot = count < MAX_PHONES ? count + 1 : count;
    if (withSlot <= 2) return 'grid-cols-2';
    if (withSlot === 3) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-4';
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        phoneCount={phones.length}
        onReset={handleReset}
        onShare={handleShare}
        copied={copied}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 pb-16 sm:pb-20">
        {/* ── Loading overlay ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 sm:gap-4">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-xs sm:text-sm text-slate-500">
              {resolving ? 'Resolving phones…' : 'Loading phones…'}
            </p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* ── Phone slots ── */}
            <div className="pt-3 sm:pt-4 pb-2 sm:pb-3">
              <div className={`grid gap-2 sm:gap-3 ${gridClass()}`}>
                {phones.map((p, i) => (
                  <PhoneCard
                    key={p.id}
                    phone={p}
                    onRemove={() => handleRemove(p.id)}
                    isBest={i === bestIdx && phones.length >= 2}
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

            {/* ── Error banner ── */}
            {error && (
              <div className="mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3 px-3 py-2 sm:py-3 bg-red-950/30 border border-red-800/30 rounded-lg md:rounded-2xl">
                <AlertCircle
                  size={14}
                  className="text-red-400 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs sm:text-sm text-red-300 flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-300 transition-colors flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* ── Empty state ── */}
            {phones.length === 0 && !error && (
              <EmptyState onAdd={handleAdd} />
            )}

            {/* ── Single phone nudge ── */}
            {phones.length === 1 && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 sm:py-3 bg-blue-950/30 border border-blue-800/30 rounded-lg max-w-sm mx-auto">
                <Plus size={13} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-blue-300">
                  Add another phone to compare
                </p>
              </div>
            )}

            {/* ── Full comparison ── */}
            {phones.length >= 2 && (
              <>
                <StickyColHeaders phones={phones} bestIdx={bestIdx} />

                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                  <WinnerBanner phones={phones} />

                  {sections.map((sec, i) => (
                    <SpecSection
                      key={sec.title}
                      section={sec}
                      phones={phones}
                      defaultOpen={i < 4}
                    />
                  ))}

                  {/* Full detail links */}
                  <div className="pt-3 border-t border-slate-800/30">
                    <p className="text-[10px] sm:text-xs text-slate-700 uppercase tracking-wider font-medium mb-2">
                      View Full Details
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {phones.map((p) => (
                        <Link
                          key={p.id}
                          href={phoneUrl(p)}
                          className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {p.model_name.split(' ').slice(-2).join(' ')}
                          <ArrowRight size={9} className="opacity-60" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
