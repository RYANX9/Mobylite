// components/compare/ComparePageClient.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';

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
  screen_size: number | null;
  weight_g: number | null;
  chipset: string | null;
  chipset_tier: string | null;
  ram_options: number[] | null;
  storage_options: number[] | null;
  fast_charging_w: number | null;
  antutu_score: number | null;
  os: string | null;
  display_type: string | null;
  display_resolution: string | null;
  refresh_rate: number | null;
  front_camera_mp: number | null;
  has_5g: boolean | null;
  has_nfc: boolean | null;
  has_wireless_charging: boolean | null;
  has_headphone_jack: boolean | null;
  water_resistance: string | null;
  full_specifications?: Record<string, unknown> | null;
}

interface SearchResult {
  id: number;
  model_name: string;
  brand: string;
  price_usd: number | null;
  main_image_url: string | null;
  release_year: number | null;
}

type WinnerKey = 'price' | 'battery' | 'camera' | 'performance' | 'charging' | 'screen';

// ─── Constants ────────────────────────────────────────────────────────────────

const API = 'https://mobylite-api.up.railway.app';
const MAX_PHONES = 4;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  Overview: <SlidersHorizontal size={15} />,
  Display: <Monitor size={15} />,
  Performance: <Cpu size={15} />,
  Camera: <Camera size={15} />,
  Battery: <Battery size={15} />,
  Connectivity: <Zap size={15} />,
  Build: <Weight size={15} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined, suffix = ''): string {
  if (val == null) return '—';
  return `${val.toLocaleString()}${suffix}`;
}

function fmtPrice(val: number | null | undefined): string {
  if (val == null) return '—';
  return `$${val.toLocaleString()}`;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function phoneDetailUrl(phone: Phone): string {
  return `/${slugify(phone.brand)}/${slugify(phone.model_name)}`;
}

function chipsetColor(tier: string | null): string {
  if (tier === 'flagship') return 'text-amber-400';
  if (tier === 'mid') return 'text-blue-400';
  return 'text-gray-400';
}

function getWinnerIdx(
  phones: Phone[],
  key: WinnerKey
): number {
  const vals = phones.map((p) => {
    switch (key) {
      case 'price':
        return p.price_usd != null ? -p.price_usd : null; // lower is better
      case 'battery':
        return p.battery_capacity;
      case 'camera':
        return p.main_camera_mp;
      case 'performance':
        return p.antutu_score;
      case 'charging':
        return p.fast_charging_w;
      case 'screen':
        return p.screen_size;
    }
  });
  let bestIdx = -1;
  let bestVal = -Infinity;
  vals.forEach((v, i) => {
    if (v != null && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

// ─── Spec Row Component ───────────────────────────────────────────────────────

interface SpecRowProps {
  label: string;
  values: (string | number | boolean | null | undefined)[];
  winnerIdx?: number;
  highlight?: boolean;
  isBoolean?: boolean;
  suffix?: string;
}

function SpecRow({ label, values, winnerIdx = -1, highlight = false, isBoolean = false, suffix = '' }: SpecRowProps) {
  const renderVal = (v: string | number | boolean | null | undefined, idx: number) => {
    if (isBoolean) {
      if (v == null) return <span className="text-gray-600">—</span>;
      return v ? (
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <CheckCircle2 size={14} /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <AlertCircle size={14} /> No
        </span>
      );
    }
    if (v == null) return <span className="text-gray-600">—</span>;
    const display = typeof v === 'number' ? `${v.toLocaleString()}${suffix}` : String(v);
    return (
      <span
        className={
          idx === winnerIdx
            ? 'font-semibold text-emerald-400'
            : 'text-gray-200'
        }
      >
        {display}
        {idx === winnerIdx && winnerIdx >= 0 && (
          <Trophy size={11} className="inline ml-1 text-emerald-400 opacity-80" />
        )}
      </span>
    );
  };

  return (
    <div
      className={`grid gap-px ${
        values.length === 2
          ? 'grid-cols-[minmax(90px,140px)_1fr_1fr]'
          : values.length === 3
          ? 'grid-cols-[minmax(90px,140px)_1fr_1fr_1fr]'
          : 'grid-cols-[minmax(90px,140px)_1fr_1fr_1fr_1fr]'
      } ${highlight ? 'bg-gray-800/40' : ''} rounded-lg overflow-hidden`}
    >
      <div className="px-3 py-3 text-xs text-gray-500 font-medium flex items-center">
        {label}
      </div>
      {values.map((v, idx) => (
        <div
          key={idx}
          className={`px-3 py-3 text-sm flex items-center justify-center text-center ${
            highlight ? 'bg-gray-800/60' : 'bg-gray-900/40'
          } border-l border-gray-800/60`}
        >
          {renderVal(v, idx)}
        </div>
      ))}
    </div>
  );
}

// ─── Spec Section ─────────────────────────────────────────────────────────────

interface SpecSectionProps {
  title: string;
  phones: Phone[];
  defaultOpen?: boolean;
}

function SpecSection({ title, phones, defaultOpen = true }: SpecSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const rows = useCallback(() => {
    switch (title) {
      case 'Overview':
        return [
          { label: 'Price', values: phones.map((p) => p.price_usd), winnerIdx: getWinnerIdx(phones, 'price'), isPrice: true },
          { label: 'Released', values: phones.map((p) => p.release_year) },
          { label: 'OS', values: phones.map((p) => p.os) },
        ];
      case 'Display':
        return [
          { label: 'Screen Size', values: phones.map((p) => p.screen_size), suffix: '"', winnerIdx: getWinnerIdx(phones, 'screen') },
          { label: 'Display Type', values: phones.map((p) => p.display_type) },
          { label: 'Resolution', values: phones.map((p) => p.display_resolution) },
          { label: 'Refresh Rate', values: phones.map((p) => p.refresh_rate), suffix: 'Hz' },
        ];
      case 'Performance':
        return [
          { label: 'Chipset', values: phones.map((p) => p.chipset) },
          { label: 'AnTuTu', values: phones.map((p) => p.antutu_score), winnerIdx: getWinnerIdx(phones, 'performance') },
          { label: 'RAM', values: phones.map((p) => p.ram_options ? `${Math.max(...p.ram_options)}GB` : null) },
          { label: 'Storage', values: phones.map((p) => p.storage_options ? `${Math.max(...p.storage_options)}GB` : null) },
        ];
      case 'Camera':
        return [
          { label: 'Main Camera', values: phones.map((p) => p.main_camera_mp), suffix: 'MP', winnerIdx: getWinnerIdx(phones, 'camera') },
          { label: 'Front Camera', values: phones.map((p) => p.front_camera_mp), suffix: 'MP' },
        ];
      case 'Battery':
        return [
          { label: 'Capacity', values: phones.map((p) => p.battery_capacity), suffix: 'mAh', winnerIdx: getWinnerIdx(phones, 'battery') },
          { label: 'Fast Charging', values: phones.map((p) => p.fast_charging_w), suffix: 'W', winnerIdx: getWinnerIdx(phones, 'charging') },
          { label: 'Wireless Charging', values: phones.map((p) => p.has_wireless_charging), isBoolean: true },
        ];
      case 'Connectivity':
        return [
          { label: '5G', values: phones.map((p) => p.has_5g), isBoolean: true },
          { label: 'NFC', values: phones.map((p) => p.has_nfc), isBoolean: true },
          { label: 'Headphone Jack', values: phones.map((p) => p.has_headphone_jack), isBoolean: true },
        ];
      case 'Build':
        return [
          { label: 'Weight', values: phones.map((p) => p.weight_g), suffix: 'g' },
          { label: 'Water Resistance', values: phones.map((p) => p.water_resistance) },
        ];
      default:
        return [];
    }
  }, [title, phones]);

  const specRows = rows();

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-800/60 bg-gray-900/30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <span className="text-gray-400">{SECTION_ICONS[title]}</span>
          {title}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-gray-800/40">
          {specRows.map((row, idx) => (
            <SpecRow
              key={row.label}
              label={row.label}
              values={
                row.isPrice
                  ? phones.map((p) => (p.price_usd != null ? fmtPrice(p.price_usd) : null))
                  : row.values
              }
              winnerIdx={row.winnerIdx ?? -1}
              highlight={idx % 2 === 0}
              isBoolean={row.isBoolean}
              suffix={row.suffix}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Phone Search Picker ──────────────────────────────────────────────────────

interface PhonePickerProps {
  onSelect: (phone: SearchResult) => void;
  excludeIds: number[];
  slotIdx: number;
}

function PhonePicker({ onSelect, excludeIds, slotIdx }: PhonePickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!focused) return;
    inputRef.current?.focus();
  }, [focused]);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=8`
        );
        const data = await res.json();
        setResults(
          (data.results || []).filter((p: SearchResult) => !excludeIds.includes(p.id))
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [query, excludeIds]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={`Search phone ${slotIdx + 1}…`}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-gray-800 transition-all"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
          />
        )}
      </div>

      {focused && query.length >= 2 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl overflow-hidden">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No phones found
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onMouseDown={() => {
                  onSelect(p);
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
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      📱
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate font-medium">
                    {p.model_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.brand}
                    {p.release_year ? ` · ${p.release_year}` : ''}
                    {p.price_usd ? ` · $${p.price_usd}` : ''}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Phone Card (header) ──────────────────────────────────────────────────────

interface PhoneCardProps {
  phone: Phone;
  onRemove: () => void;
  isWinner: boolean;
}

function PhoneCard({ phone, onRemove, isWinner }: PhoneCardProps) {
  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
        isWinner
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : 'border-gray-800/60 bg-gray-900/30'
      }`}
    >
      {isWinner && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 rounded-full text-[10px] font-bold text-black whitespace-nowrap">
          <Trophy size={9} /> Best Value
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-800 hover:bg-red-900/60 flex items-center justify-center transition-colors"
        aria-label={`Remove ${phone.model_name}`}
      >
        <X size={12} className="text-gray-400" />
      </button>

      <Link
        href={phoneDetailUrl(phone)}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-800/60 overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {phone.main_image_url ? (
          <Image
            src={phone.main_image_url}
            alt={phone.model_name}
            width={96}
            height={96}
            className="object-contain w-full h-full p-1"
          />
        ) : (
          <span className="text-3xl">📱</span>
        )}
      </Link>

      <div className="text-center min-w-0 w-full">
        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">
          {phone.brand}
        </div>
        <Link
          href={phoneDetailUrl(phone)}
          className="block text-sm font-semibold text-gray-100 hover:text-blue-400 transition-colors leading-tight mt-0.5 line-clamp-2"
        >
          {phone.model_name}
        </Link>
        {phone.price_usd && (
          <div className="mt-1 text-sm font-bold text-blue-400">
            ${phone.price_usd.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty Slot ───────────────────────────────────────────────────────────────

interface EmptySlotProps {
  slotIdx: number;
  onSelect: (phone: SearchResult) => void;
  excludeIds: number[];
  canAdd: boolean;
}

function EmptySlot({ slotIdx, onSelect, excludeIds, canAdd }: EmptySlotProps) {
  const [adding, setAdding] = useState(false);

  if (!canAdd) return null;

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-950/10 transition-all group min-h-[180px] sm:min-h-[200px] w-full"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-800 group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
          <Plus size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
        </div>
        <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
          Add phone
        </span>
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-950/10 min-h-[180px] sm:min-h-[200px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-400 font-medium">Add Phone</span>
        <button
          onClick={() => setAdding(false)}
          className="text-gray-500 hover:text-gray-300"
        >
          <X size={14} />
        </button>
      </div>
      <PhonePicker
        onSelect={(p) => {
          onSelect(p);
          setAdding(false);
        }}
        excludeIds={excludeIds}
        slotIdx={slotIdx}
      />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onSelect: (phone: SearchResult) => void;
}

function EmptyState({ onSelect }: EmptyStateProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=8`
        );
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  const popularComparisons = [
    { label: 'iPhone vs Samsung', phones: ['apple iphone 16 pro', 'samsung galaxy s25 ultra'] },
    { label: 'Budget Kings', phones: ['xiaomi redmi note 13', 'samsung galaxy a55'] },
    { label: 'Camera Battle', phones: ['google pixel 9 pro', 'apple iphone 16 pro max'] },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center mb-6">
        <SlidersHorizontal size={32} className="text-blue-400" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">
        Compare Phones
      </h1>
      <p className="text-gray-500 text-sm sm:text-base max-w-md mb-8">
        Compare up to 4 smartphones side by side. Search for a phone to get started.
      </p>

      {/* Search */}
      <div className="relative w-full max-w-md mb-8">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a phone to compare…"
          className="w-full pl-11 pr-4 py-3.5 bg-gray-800/60 border border-gray-700/60 rounded-2xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-all"
          autoFocus
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
          />
        )}

        {results.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p);
                  setQuery('');
                  setResults([]);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                  {p.main_image_url ? (
                    <Image
                      src={p.main_image_url}
                      alt={p.model_name}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">📱</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {p.model_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.brand}
                    {p.release_year ? ` · ${p.release_year}` : ''}
                    {p.price_usd ? ` · $${p.price_usd}` : ''}
                  </div>
                </div>
                <Plus size={14} className="text-blue-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular comparisons */}
      <div className="w-full max-w-md">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">
          Popular Comparisons
        </p>
        <div className="flex flex-col gap-2">
          {popularComparisons.map((comp) => (
            <Link
              key={comp.label}
              href={`/compare?q=${comp.phones.join(',')}`}
              className="flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/80 rounded-xl transition-colors group"
            >
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {comp.label}
              </span>
              <ArrowLeft
                size={14}
                className="text-gray-600 rotate-180 group-hover:text-blue-400 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Winner Banner ────────────────────────────────────────────────────────────

function WinnerBanner({ phones }: { phones: Phone[] }) {
  const scores = phones.map((p) => {
    let s = 0;
    if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3;
    if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2;
    if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2;
    if (p.fast_charging_w) s += Math.min(p.fast_charging_w / 100, 1);
    return s;
  });
  const maxScore = Math.max(...scores);
  const winnerIdx = scores.indexOf(maxScore);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900/60 to-gray-900/60 border border-emerald-800/30 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-200">Overall Winner</span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm font-bold text-emerald-300">
            {phones[winnerIdx]?.model_name}
          </div>
          <span className="text-xs text-gray-500">by composite score</span>
        </div>
      </div>

      {/* Score bars */}
      <div className="mt-4 grid gap-2">
        {phones.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 sm:w-32 truncate flex-shrink-0">
              {p.model_name}
            </span>
            <div className="flex-1">
              <ScoreBar
                value={scores[i]}
                max={maxScore}
                color={i === winnerIdx ? 'bg-emerald-500' : 'bg-blue-500/60'}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
              {((scores[i] / 10) * 10).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComparePageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Parse IDs from URL ─────────────────────────────────────────────────────
  const phoneIds: number[] = (() => {
    // /compare/123,456,789
    const segment = pathname.split('/compare/')?.[1];
    if (segment) {
      return segment
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
    }
    return [];
  })();

  // ── Fetch phones ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phoneIds.length < 1) {
      setPhones([]);
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`${API}/phones/compare?ids=${phoneIds.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        setPhones(data.phones || []);
      })
      .catch(() => setError('Failed to load phone data. Please try again.'))
      .finally(() => setLoading(false));
  }, [pathname]);

  // ── URL sync ───────────────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) {
        router.push('/compare');
      } else {
        router.push(`/compare/${ids.join(',')}`);
      }
    },
    [router]
  );

  const handleAddPhone = useCallback(
    async (result: SearchResult) => {
      if (phones.length >= MAX_PHONES) return;
      if (phones.some((p) => p.id === result.id)) return;

      try {
        const res = await fetch(`${API}/phones/${result.id}`);
        const full: Phone = await res.json();
        const newIds = [...phones.map((p) => p.id), full.id];
        setPhones((prev) => [...prev, full]);
        updateUrl(newIds);
      } catch {
        // fallback: add partial data
        const partial = result as unknown as Phone;
        setPhones((prev) => [...prev, partial]);
        updateUrl([...phones.map((p) => p.id), result.id]);
      }
    },
    [phones, updateUrl]
  );

  const handleRemove = useCallback(
    (id: number) => {
      const updated = phones.filter((p) => p.id !== id);
      setPhones(updated);
      updateUrl(updated.map((p) => p.id));
    },
    [phones, updateUrl]
  );

  const handleReset = useCallback(() => {
    setPhones([]);
    router.push('/compare');
  }, [router]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const bestValueIdx = phones.length >= 2
    ? (() => {
        const scores = phones.map((p) => {
          if (!p.price_usd) return 0;
          let s = 0;
          if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3;
          if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2;
          if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2;
          return s / (p.price_usd / 1000);
        });
        return scores.indexOf(Math.max(...scores));
      })()
    : -1;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <CompareHeader phones={[]} onReset={handleReset} onShare={handleShare} copied={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Loading comparison…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <CompareHeader phones={[]} onReset={handleReset} onShare={handleShare} copied={false} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-300 font-medium mb-2">Something went wrong</p>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <CompareHeader
        phones={phones}
        onReset={handleReset}
        onShare={handleShare}
        copied={copied}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-16">
        {/* ── Phone Slots ── */}
        <PhoneSlotsBar
          phones={phones}
          onAdd={handleAddPhone}
          onRemove={handleRemove}
          bestValueIdx={bestValueIdx}
        />

        {/* ── Empty state ── */}
        {phones.length === 0 && (
          <EmptyState onSelect={handleAddPhone} />
        )}

        {/* ── Single phone hint ── */}
        {phones.length === 1 && (
          <div className="mt-8 flex items-center justify-center gap-3 px-4 py-3 bg-blue-950/30 border border-blue-800/30 rounded-2xl max-w-md mx-auto">
            <Plus size={16} className="text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-300">
              Add one more phone to start comparing specs
            </p>
          </div>
        )}

        {/* ── Comparison content ── */}
        {phones.length >= 2 && (
          <div className="mt-6 space-y-4">
            {/* Winner banner */}
            <WinnerBanner phones={phones} />

            {/* Spec sections */}
            {(['Overview', 'Display', 'Performance', 'Camera', 'Battery', 'Connectivity', 'Build'] as const).map(
              (section, i) => (
                <SpecSection
                  key={section}
                  title={section}
                  phones={phones}
                  defaultOpen={i < 3}
                />
              )
            )}

            {/* Quick links */}
            <div className="pt-4 border-t border-gray-800/60">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">
                View Full Details
              </p>
              <div className="flex flex-wrap gap-2">
                {phones.map((p) => (
                  <Link
                    key={p.id}
                    href={phoneDetailUrl(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {p.model_name}
                    <ArrowLeft size={11} className="rotate-180" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Compare Header ───────────────────────────────────────────────────────────

interface CompareHeaderProps {
  phones: Phone[];
  onReset: () => void;
  onShare: () => void;
  copied: boolean;
}

function CompareHeader({ phones, onReset, onShare, copied }: CompareHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="text-sm hidden sm:inline">Back</span>
        </Link>

        <div className="w-px h-5 bg-gray-800 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SlidersHorizontal size={16} className="text-blue-400 flex-shrink-0" />
          <h1 className="text-sm font-semibold text-gray-200 truncate">
            Compare Phones
            {phones.length >= 2 && (
              <span className="ml-1.5 text-gray-500 font-normal">
                ({phones.length} selected)
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {phones.length >= 2 && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          )}

          {phones.length > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-red-900/30 rounded-xl text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Phone Slots Bar ──────────────────────────────────────────────────────────

interface PhoneSlotsBarProps {
  phones: Phone[];
  onAdd: (phone: SearchResult) => void;
  onRemove: (id: number) => void;
  bestValueIdx: number;
}

function PhoneSlotsBar({ phones, onAdd, onRemove, bestValueIdx }: PhoneSlotsBarProps) {
  const totalSlots = Math.max(phones.length + 1, 2);
  const canAdd = phones.length < MAX_PHONES;

  // Mobile: horizontal scroll for phones, then add slot
  return (
    <div className="pt-4 pb-2">
      {/* Grid: responsive cols based on phone count */}
      <div
        className={`grid gap-3 ${
          phones.length === 0
            ? 'grid-cols-2'
            : phones.length === 1
            ? 'grid-cols-2'
            : phones.length === 2
            ? 'grid-cols-2 sm:grid-cols-3'
            : phones.length === 3
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {phones.map((phone, idx) => (
          <PhoneCard
            key={phone.id}
            phone={phone}
            onRemove={() => onRemove(phone.id)}
            isWinner={idx === bestValueIdx && phones.length >= 2}
          />
        ))}

        {canAdd && (
          <EmptySlot
            slotIdx={phones.length}
            onSelect={onAdd}
            excludeIds={phones.map((p) => p.id)}
            canAdd={canAdd}
          />
        )}
      </div>
    </div>
  );
}
