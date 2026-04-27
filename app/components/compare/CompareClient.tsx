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
// Robustly searches for a phone from a URL slug like "xiaomi-poco-f8-ultra"

async function resolveSlugToPhone(slug: string): Promise<SearchResult | null> {
  // Try progressively: full slug → remove last word → etc.
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

    // Score each result by how well its slugified name matches the URL slug
    const scored = results.map((r) => {
      const rSlug = slugify(r.model_name);
      const rFullSlug = slugify(`${r.brand} ${r.model_name}`);
      let score = 0;
      if (rSlug === slug) score += 100;
      if (rFullSlug === slug) score += 90;
      if (slug.includes(rSlug)) score += 50;
      if (rSlug.includes(slug)) score += 40;
      // Count matching words
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
      className={`flex min-h-[46px] border-b border-gray-800/30 last:border-b-0 ${
        zebra ? 'bg-gray-800/20' : ''
      }`}
    >
      {/* Label */}
      <div className="flex items-center px-3 py-2 w-[100px] sm:w-[140px] flex-shrink-0 border-r border-gray-800/40">
        <span className="text-xs text-gray-500 font-medium leading-tight">
          {row.label}
        </span>
      </div>

      {/* Values */}
      {phones.map((p, i) => {
        const isWin = winIdx === i && winIdx >= 0;

        let node: React.ReactNode;

        if (row.isBool && row.getBool) {
          const val = row.getBool(p);
          if (val == null) {
            node = <span className="text-gray-700 text-xs">—</span>;
          } else if (val) {
            node = (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <CheckCircle2 size={12} />
                Yes
              </span>
            );
          } else {
            node = (
              <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
                <X size={11} />
                No
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
                  ? 'text-gray-700'
                  : 'text-gray-200'
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
            className={`flex-1 flex items-center justify-center px-1 sm:px-2 py-2 text-center border-r border-gray-800/30 last:border-r-0 ${
              isWin ? 'bg-emerald-950/15' : ''
            }`}
          >
            {node}
          </div>
        );
      })}
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
    <div className="rounded-2xl border border-gray-800/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{section.icon}</span>
          <span className="text-sm font-semibold text-gray-200">
            {section.title}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-gray-600" />
        ) : (
          <ChevronDown size={14} className="text-gray-600" />
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
    <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 to-gray-900/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Trophy size={15} className="text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-200">
          Overall Winner
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-[11px] font-bold text-black">
          {phones[winIdx]?.model_name}
        </span>
        <span className="text-xs text-gray-600 ml-auto hidden sm:inline">
          composite score
        </span>
      </div>

      <div className="space-y-2">
        {phones.map((p, i) => {
          const pct = (scores[i] / maxScore) * 100;
          const isWin = i === winIdx;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 truncate w-20 sm:w-32 text-right flex-shrink-0">
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
              <span className="text-xs text-gray-600 w-8 text-right flex-shrink-0">
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
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors ${
        isBest
          ? 'border-emerald-600/50 bg-emerald-950/20'
          : 'border-gray-800/60 bg-gray-900/30'
      }`}
    >
      {isBest && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500 rounded-full text-[10px] font-bold text-black whitespace-nowrap z-10">
          <Trophy size={8} />
          Best
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-800 hover:bg-red-900/60 flex items-center justify-center transition-colors z-10"
        aria-label={`Remove ${phone.model_name}`}
      >
        <X size={10} className="text-gray-400" />
      </button>

      <Link
        href={phoneUrl(phone)}
        className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl bg-gray-800/60 overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0 mt-1"
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
          <span className="text-2xl">📱</span>
        )}
      </Link>

      <div className="text-center w-full min-w-0 px-1">
        <p className="text-[10px] text-gray-600 uppercase tracking-wide truncate">
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
          <p className="text-[10px] text-gray-700 mt-0.5">
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
        className="flex flex-col items-center justify-center gap-2 w-full min-h-[156px] sm:min-h-[196px] rounded-2xl border-2 border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-950/10 transition-all group"
      >
        <div className="w-9 h-9 rounded-xl bg-gray-800 group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
          <Plus
            size={18}
            className="text-gray-600 group-hover:text-blue-400 transition-colors"
          />
        </div>
        <span className="text-xs text-gray-700 group-hover:text-gray-400 transition-colors">
          Add phone
        </span>
      </button>
    );
  }

  return (
    <div className="w-full min-h-[156px] sm:min-h-[196px] rounded-2xl border border-blue-500/30 bg-blue-950/10 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-400">Add a phone</span>
        <button
          onClick={() => {
            setOpen(false);
            setQuery('');
            setResults([]);
          }}
          className="text-gray-600 hover:text-gray-300 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type phone name…"
          className="w-full pl-7 pr-7 py-2 bg-gray-800/70 border border-gray-700/50 rounded-xl text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-all"
        />
        {loading && (
          <Loader2
            size={11}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 animate-spin"
          />
        )}
      </div>

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto rounded-xl bg-gray-900/80 border border-gray-800/40 divide-y divide-gray-800/30 max-h-[180px]">
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => pick(p)}
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
                <p className="text-[10px] text-gray-600">
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
        <p className="text-xs text-gray-700 text-center py-3">
          No phones found for &ldquo;{query}&rdquo;
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
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mb-5">
        <SlidersHorizontal size={26} className="text-blue-400" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
        Compare Phones
      </h2>
      <p className="text-gray-500 text-sm max-w-xs sm:max-w-sm mb-8 leading-relaxed">
        Search for phones and add up to 4 to compare specs side by side.
      </p>

      {/* Search box */}
      <div className="relative w-full max-w-sm mb-8">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a phone…"
          autoFocus
          className="w-full pl-11 pr-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-2xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-gray-800 transition-all"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 animate-spin"
          />
        )}

        {/* Dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onAdd(p);
                  setQuery('');
                  setResults([]);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left"
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
                <Plus size={13} className="text-blue-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-gray-900 border border-gray-700/50 rounded-2xl px-4 py-3">
            <p className="text-sm text-gray-600 text-center">
              No phones found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-gray-700 font-medium uppercase tracking-wider mb-3">
          Try comparing
        </p>
        <div className="flex flex-col gap-2">
          {suggestions.map((name) => (
            <button
              key={name}
              onClick={() => setQuery(name)}
              className="flex items-center justify-between px-4 py-2.5 bg-gray-800/40 hover:bg-gray-800/70 rounded-xl transition-colors group text-left"
            >
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {name}
              </span>
              <Search
                size={12}
                className="text-gray-700 group-hover:text-blue-400 transition-colors"
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
    <div className="sticky top-14 z-30 -mx-3 sm:-mx-4 lg:-mx-6 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/40">
      <div className="flex max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* spacer for label col */}
        <div className="w-[100px] sm:w-[140px] flex-shrink-0" />
        {phones.map((p, i) => (
          <div
            key={p.id}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 border-l border-gray-800/30 ${
              i === bestIdx ? 'bg-emerald-950/10' : ''
            }`}
          >
            <span className="text-[9px] sm:text-[10px] text-gray-600 truncate w-full text-center uppercase tracking-wide">
              {p.brand}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-300 truncate w-full text-center leading-tight">
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
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} />
          <span className="text-sm hidden sm:inline">Home</span>
        </Link>

        <div className="w-px h-5 bg-gray-800 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SlidersHorizontal size={14} className="text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-200 truncate">
            Compare Phones
          </span>
          {phoneCount >= 2 && (
            <span className="text-xs text-gray-600 hidden sm:inline">
              · {phoneCount} phones
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {phoneCount >= 2 && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800/60 hover:bg-red-950/40 rounded-xl text-xs text-gray-400 hover:text-red-400 transition-colors"
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

// ─── Root Component ───────────────────────────────────────────────────────────

export default function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Parse the URL segment ───────────────────────────────────────────────
  const urlSegment = useMemo(() => {
    // pathname could be "/compare" or "/compare/slug-a-vs-slug-b"
    const match = pathname.match(/^\/compare\/(.+)$/);
    return match ? match[1] : '';
  }, [pathname]);

  // ── Load phones from URL on mount / URL change ──────────────────────────
  const loadedSegmentRef = useRef('');

  useEffect(() => {
    // Don't re-run if segment hasn't changed (avoids loop after adding phones)
    if (urlSegment === loadedSegmentRef.current) return;
    loadedSegmentRef.current = urlSegment;

    if (!urlSegment) {
      setPhones([]);
      return;
    }

    // Format A: comma-separated numeric IDs (e.g. "12,34,56")
    if (/^\d+(,\d+)*$/.test(urlSegment)) {
      const ids = urlSegment.split(',').map(Number);
      fetchByIds(ids);
      return;
    }

    // Format B: slug-vs-slug (e.g. "iphone-16-pro-vs-pixel-9")
    const slugs = urlSegment.split('-vs-').filter(Boolean);
    if (slugs.length >= 1) {
      fetchBySlugs(slugs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSegment]);

  async function fetchByIds(ids: number[]) {
    if (ids.length < 2) {
      // Single phone — just fetch it
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
      // Resolve all slugs in parallel
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

  // ── Push new URL without reloading ─────────────────────────────────────
  function pushUrl(updatedPhones: Phone[]) {
    const url = buildCompareUrl(updatedPhones);
    // Update the ref so the useEffect doesn't re-trigger a fetch
    const seg = url.replace('/compare/', '').replace('/compare', '');
    loadedSegmentRef.current = seg;
    router.push(url, { scroll: false });
  }

  // ── Add phone ───────────────────────────────────────────────────────────
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
        // Add with partial data as fallback
        const partial = { ...result } as unknown as Phone;
        const updated = [...phones, partial];
        setPhones(updated);
        pushUrl(updated);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phones]
  );

  // ── Remove phone ────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (id: number) => {
      const updated = phones.filter((p) => p.id !== id);
      setPhones(updated);
      pushUrl(updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phones]
  );

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhones([]);
    setError(null);
    loadedSegmentRef.current = '';
    router.push('/compare', { scroll: false });
  }, [router]);

  // ── Share ───────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* silent */
    }
  }, []);

  // ── Best value index ────────────────────────────────────────────────────
  const bestIdx = useMemo(() => {
    if (phones.length < 2) return -1;
    const scores = phones.map((p) =>
      p.price_usd
        ? compositeScore(p) / (p.price_usd / 500)
        : 0
    );
    return scores.indexOf(Math.max(...scores));
  }, [phones]);

  // ── Spec sections ───────────────────────────────────────────────────────
  const sections = useMemo(
    () => (phones.length >= 2 ? getSections(phones) : []),
    [phones]
  );

  const isLoading = loading || resolving;

  // ── Grid column class ───────────────────────────────────────────────────
  function gridClass() {
    const count = phones.length;
    const withSlot = count < MAX_PHONES ? count + 1 : count;
    if (withSlot <= 2) return 'grid-cols-2';
    if (withSlot === 3) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-4';
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <PageHeader
        phoneCount={phones.length}
        onReset={handleReset}
        onShare={handleShare}
        copied={copied}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-20">

        {/* ── Loading overlay ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <Loader2 size={30} className="animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">
              {resolving ? 'Resolving phones from URL…' : 'Loading phones…'}
            </p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* ── Phone slots ── */}
            <div className="pt-4 pb-3">
              <div className={`grid gap-3 ${gridClass()}`}>
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
              <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-950/30 border border-red-800/30 rounded-2xl">
                <AlertCircle
                  size={15}
                  className="text-red-400 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-300 flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-300 transition-colors"
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
              <div className="mt-5 flex items-center gap-2.5 px-4 py-3 bg-blue-950/30 border border-blue-800/30 rounded-2xl max-w-sm mx-auto">
                <Plus size={14} className="text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-300">
                  Add another phone to start comparing
                </p>
              </div>
            )}

            {/* ── Full comparison ── */}
            {phones.length >= 2 && (
              <>
                <StickyColHeaders phones={phones} bestIdx={bestIdx} />

                <div className="mt-4 space-y-3">
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
                  <div className="pt-3 border-t border-gray-800/30">
                    <p className="text-xs text-gray-700 uppercase tracking-wider font-medium mb-3">
                      Full Details
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {phones.map((p) => (
                        <Link
                          key={p.id}
                          href={phoneUrl(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          {p.model_name}
                          <ArrowLeft
                            size={10}
                            className="rotate-180 opacity-50"
                          />
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
