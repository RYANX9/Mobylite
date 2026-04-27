'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, X, ArrowLeft, Search, Battery, Camera, Cpu, Monitor,
  Weight, ChevronDown, ChevronUp, Share2, RotateCcw, Trophy,
  Wifi, AlertCircle, Loader2, CheckCircle2,
} from 'lucide-react';

const API = 'https://renderphones.onrender.com';
const MAX_PHONES = 4;

// ─── Types ────────────────────────────────────────────────────────────────

interface Phone {
  id: number;
  model_name: string;
  brand: string;
  price_usd: number | null;
  main_image_url: string | null;
  release_year: number | null;
  battery_capacity: number | null;
  main_camera_mp: number | null;
  screen_size: number | null;
  refresh_rate: number | null;
  weight_g: number | null;
  chipset: string | null;
  ram_options: number[] | null;
  storage_options: number[] | null;
  fast_charging_w: number | null;
  antutu_score: number | null;
  has_5g: boolean | null;
  has_nfc: boolean | null;
  has_wireless_charging: boolean | null;
  has_headphone_jack: boolean | null;
}

interface SearchResult {
  id: number;
  model_name: string;
  brand: string;
  price_usd: number | null;
  main_image_url: string | null;
  release_year: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(v: number | null, suffix = '') {
  if (v == null) return '—';
  return `${v.toLocaleString()}${suffix}`;
}

function fmtPrice(v: number | null) {
  if (v == null) return '—';
  return `$${v.toLocaleString()}`;
}

function compositeScore(p: Phone): number {
  let s = 0;
  if (p.antutu_score) s += Math.min(p.antutu_score / 2_000_000, 1) * 3;
  if (p.main_camera_mp) s += Math.min(p.main_camera_mp / 200, 1) * 2;
  if (p.battery_capacity) s += Math.min(p.battery_capacity / 7000, 1) * 2;
  if (p.fast_charging_w) s += Math.min(p.fast_charging_w / 100, 1);
  if (p.refresh_rate) s += Math.min(p.refresh_rate / 165, 1) * 0.5;
  return s;
}

function getBestIdx(phones: Phone[], getter: (p: Phone) => number | null, lowerIsBetter = false): number {
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

// ─── Row Definition ──────────────────────────────────────────────────────

interface RowDef {
  label: string;
  getValue: (p: Phone) => string;
  getRaw?: (p: Phone) => number | null;
  lowerIsBetter?: boolean;
}

function SpecRow({ row, phones, zebra }: { row: RowDef; phones: Phone[]; zebra: boolean }) {
  const winIdx = row.getRaw ? getBestIdx(phones, row.getRaw, row.lowerIsBetter) : -1;

  return (
    <div className={`flex border-b border-gray-700/50 last:border-0 ${zebra ? 'bg-gray-900/30' : ''}`}>
      {/* Label */}
      <div className="w-32 sm:w-40 flex-shrink-0 px-3 py-2.5 border-r border-gray-700/50">
        <span className="text-xs sm:text-sm text-gray-400 font-medium">{row.label}</span>
      </div>

      {/* Values */}
      {phones.map((p, i) => {
        const val = row.getValue(p);
        const isWin = winIdx === i && winIdx >= 0;

        return (
          <div
            key={p.id}
            className={`flex-1 flex items-center justify-center px-2 sm:px-3 py-2.5 border-r border-gray-700/50 last:border-0 text-center ${
              isWin ? 'bg-emerald-950/20' : ''
            }`}
          >
            <span className={`text-xs sm:text-sm font-medium ${isWin ? 'text-emerald-400' : 'text-gray-300'}`}>
              {val}
              {isWin && <Trophy size={10} className="inline ml-1 text-emerald-400" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────

function SpecSection({
  title,
  rows,
  phones,
  defaultOpen,
}: {
  title: string;
  rows: RowDef[];
  phones: Phone[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gray-700/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-200">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {open && (
        <div>
          {rows.map((row, idx) => (
            <SpecRow key={row.label} row={row} phones={phones} zebra={idx % 2 === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Winner Banner ────────────────────────────────────────────────────────

function WinnerBanner({ phones }: { phones: Phone[] }) {
  const scores = phones.map(compositeScore);
  const maxScore = Math.max(...scores, 1);
  const winIdx = scores.indexOf(Math.max(...scores));

  return (
    <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-emerald-400" />
        <span className="text-sm font-semibold text-gray-200">Overall Winner</span>
        <span className="ml-auto text-xs text-gray-500">{phones[winIdx]?.model_name}</span>
      </div>

      <div className="space-y-2">
        {phones.map((p, i) => {
          const pct = (scores[i] / maxScore) * 100;
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 text-right truncate">{p.model_name}</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${i === winIdx ? 'bg-emerald-500' : 'bg-blue-500/50'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phone Card ───────────────────────────────────────────────────────────

function PhoneCard({ phone, onRemove, isBest }: { phone: Phone; onRemove: () => void; isBest: boolean }) {
  return (
    <div
      className={`relative rounded-lg border p-3 text-center transition-all ${
        isBest ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-gray-700/50 bg-gray-900/30'
      }`}
    >
      {isBest && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 rounded-full text-[10px] font-bold text-black">
          <Trophy size={10} /> Best
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-700 hover:bg-red-900 flex items-center justify-center text-gray-400 hover:text-red-300 transition"
      >
        <X size={12} />
      </button>

      <Link href={`/${phone.brand.toLowerCase()}/${phone.model_name.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-800 flex items-center justify-center mx-auto mb-2 hover:opacity-80 transition">
          {phone.main_image_url ? (
            <img src={phone.main_image_url} alt={phone.model_name} className="w-14 h-14 object-contain" />
          ) : (
            <span className="text-2xl">📱</span>
          )}
        </div>
      </Link>

      <p className="text-[10px] text-gray-600 uppercase tracking-wide truncate mb-1">{phone.brand}</p>
      <Link href={`/${phone.brand.toLowerCase()}/${phone.model_name.toLowerCase().replace(/\s+/g, '-')}`}>
        <p className="text-xs font-semibold text-gray-100 hover:text-blue-400 transition line-clamp-2 mb-1">
          {phone.model_name}
        </p>
      </Link>
      {phone.price_usd && <p className="text-xs font-bold text-blue-400">${phone.price_usd.toLocaleString()}</p>}
      {phone.release_year && <p className="text-[10px] text-gray-600 mt-1">{phone.release_year}</p>}
    </div>
  );
}

// ─── Add Phone Slot ───────────────────────────────────────────────────────

function AddSlot({ onSelect, excludeIds }: { onSelect: (p: SearchResult) => void; excludeIds: number[] }) {
  const [open, setOpen] = useState(false);
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
        const res = await fetch(`${API}/phones/search?q=${encodeURIComponent(query)}&page_size=8`);
        const data = await res.json();
        setResults((data.results || []).filter((p: SearchResult) => !excludeIds.includes(p.id)));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, excludeIds]);

  function pick(p: SearchResult) {
    onSelect(p);
    setOpen(false);
    setQuery('');
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full h-24 sm:h-28 rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500/50 hover:bg-blue-950/10 flex flex-col items-center justify-center gap-2 transition group"
      >
        <Plus size={20} className="text-gray-600 group-hover:text-blue-400 transition" />
        <span className="text-xs text-gray-600 group-hover:text-gray-400 transition">Add phone</span>
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-blue-500/30 bg-blue-950/10 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-400">Add a phone</span>
        <button
          onClick={() => {
            setOpen(false);
            setQuery('');
          }}
          className="text-gray-500 hover:text-gray-300"
        >
          <X size={14} />
        </button>
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type phone name…"
          autoFocus
          className="w-full pl-8 pr-3 py-2 bg-gray-800/70 border border-gray-700/50 rounded text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500/60 transition"
        />
      </div>

      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto bg-gray-900/80 border border-gray-700/40 rounded divide-y divide-gray-700/30">
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => pick(p)}
              className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800 transition text-left text-xs"
            >
              <div className="w-8 h-8 rounded bg-gray-800 flex-shrink-0 overflow-hidden">
                {p.main_image_url && (
                  <img src={p.main_image_url} alt={p.model_name} className="w-full h-full object-contain" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-200 truncate">{p.model_name}</p>
                <p className="text-[10px] text-gray-500">
                  {p.brand}
                  {p.price_usd && ` · $${p.price_usd}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-2">No phones found</p>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: (p: SearchResult) => void }) {
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
        const res = await fetch(`${API}/phones/search?q=${encodeURIComponent(query)}&page_size=8`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const suggestions = ['Samsung Galaxy S25 Ultra', 'Apple iPhone 16 Pro', 'Google Pixel 9 Pro', 'Xiaomi 15 Ultra'];

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">Compare Phones</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-6">Search for phones and add up to 4 to compare specs side by side.</p>

      {/* Search */}
      <div className="relative w-full max-w-sm mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phones…"
          autoFocus
          className="w-full pl-12 pr-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500/60 transition"
        />
        {loading && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 animate-spin" />}

        {/* Results */}
        {results.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl overflow-hidden z-50">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onAdd(p);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 transition text-left text-sm border-b border-gray-700/30 last:border-0"
              >
                <div className="w-10 h-10 rounded bg-gray-800 flex-shrink-0 overflow-hidden">
                  {p.main_image_url && (
                    <img src={p.main_image_url} alt={p.model_name} className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">{p.model_name}</p>
                  <p className="text-xs text-gray-500">
                    {p.brand}
                    {p.price_usd && ` · $${p.price_usd}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-gray-600 font-medium uppercase mb-3">Popular phones</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((name) => (
            <button
              key={name}
              onClick={() => setQuery(name)}
              className="text-xs px-2.5 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded transition text-gray-400 hover:text-gray-200"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────

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
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 transition text-sm">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <div className="w-px h-5 bg-gray-700/50" />

        <div className="flex-1">
          <span className="text-sm font-semibold text-gray-200">Compare Phones</span>
          {phoneCount >= 2 && <span className="text-xs text-gray-500 ml-2">· {phoneCount} selected</span>}
        </div>

        <div className="flex items-center gap-2">
          {phoneCount >= 2 && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/60 hover:bg-gray-800 rounded text-xs text-gray-400 hover:text-gray-200 transition hidden sm:flex"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 size={12} />
                  Share
                </>
              )}
            </button>
          )}

          {phoneCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/60 hover:bg-red-950/40 rounded text-xs text-gray-400 hover:text-red-400 transition hidden sm:flex"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse URL for IDs: /compare/24,23
  useEffect(() => {
    const match = pathname.match(/^\/compare\/(\d+(?:,\d+)*)$/);
    if (!match) {
      setPhones([]);
      return;
    }

    const ids = match[1].split(',').map(Number);
    if (ids.length === 0 || ids.length > MAX_PHONES) return;

    setLoading(true);
    setError(null);

    fetch(`${API}/phones/compare?ids=${ids.join(',')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.phones && Array.isArray(data.phones)) {
          setPhones(data.phones);
        } else {
          setError('Could not load phones');
        }
      })
      .catch(() => setError('Failed to load phones'))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleAdd = useCallback(
    (result: SearchResult) => {
      if (phones.length >= MAX_PHONES) return;
      if (phones.some((p) => p.id === result.id)) return;

      setLoading(true);
      fetch(`${API}/phones/${result.id}`)
        .then((res) => res.json())
        .then((phone: Phone) => {
          const updated = [...phones, phone];
          setPhones(updated);
          router.push(`/compare/${updated.map((p) => p.id).join(',')}`, { scroll: false });
        })
        .catch(() => setError('Failed to add phone'))
        .finally(() => setLoading(false));
    },
    [phones, router]
  );

  const handleRemove = useCallback(
    (id: number) => {
      const updated = phones.filter((p) => p.id !== id);
      if (updated.length === 0) {
        setPhones([]);
        router.push('/compare', { scroll: false });
      } else {
        setPhones(updated);
        router.push(`/compare/${updated.map((p) => p.id).join(',')}`, { scroll: false });
      }
    },
    [phones, router]
  );

  const handleReset = useCallback(() => {
    setPhones([]);
    setError(null);
    router.push('/compare', { scroll: false });
  }, [router]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  }, []);

  const bestIdx =
    phones.length >= 2
      ? phones.reduce((best, p, i, arr) => {
          const bestScore = (compositeScore(arr[best]) / (arr[best].price_usd || 1)) * 100;
          const score = (compositeScore(p) / (p.price_usd || 1)) * 100;
          return score > bestScore ? i : best;
        }, 0)
      : -1;

  const specs: { title: string; rows: RowDef[] }[] = [
    {
      title: 'Overview',
      rows: [
        { label: 'Price', getValue: (p) => fmtPrice(p.price_usd), getRaw: (p) => p.price_usd ? -p.price_usd : null },
        { label: 'Released', getValue: (p) => p.release_year ? String(p.release_year) : '—', getRaw: (p) => p.release_year },
      ],
    },
    {
      title: 'Display',
      rows: [
        { label: 'Screen Size', getValue: (p) => fmt(p.screen_size, '"'), getRaw: (p) => p.screen_size },
        { label: 'Refresh Rate', getValue: (p) => fmt(p.refresh_rate, ' Hz'), getRaw: (p) => p.refresh_rate },
      ],
    },
    {
      title: 'Performance',
      rows: [
        { label: 'Chipset', getValue: (p) => p.chipset || '—' },
        { label: 'AnTuTu', getValue: (p) => fmt(p.antutu_score), getRaw: (p) => p.antutu_score },
        {
          label: 'RAM',
          getValue: (p) => (p.ram_options?.length ? `${Math.max(...p.ram_options)} GB` : '—'),
          getRaw: (p) => (p.ram_options?.length ? Math.max(...p.ram_options) : null),
        },
        {
          label: 'Storage',
          getValue: (p) => {
            if (!p.storage_options?.length) return '—';
            const max = Math.max(...p.storage_options);
            return max >= 1000 ? `${max / 1000} TB` : `${max} GB`;
          },
          getRaw: (p) => (p.storage_options?.length ? Math.max(...p.storage_options) : null),
        },
      ],
    },
    {
      title: 'Camera',
      rows: [
        { label: 'Main', getValue: (p) => fmt(p.main_camera_mp, ' MP'), getRaw: (p) => p.main_camera_mp },
      ],
    },
    {
      title: 'Battery',
      rows: [
        { label: 'Capacity', getValue: (p) => fmt(p.battery_capacity, ' mAh'), getRaw: (p) => p.battery_capacity },
        { label: 'Charging', getValue: (p) => fmt(p.fast_charging_w, ' W'), getRaw: (p) => p.fast_charging_w },
        { label: 'Wireless', getValue: (p) => (p.has_wireless_charging ? 'Yes' : 'No') },
      ],
    },
    {
      title: 'Connectivity',
      rows: [
        { label: '5G', getValue: (p) => (p.has_5g ? 'Yes' : 'No') },
        { label: 'NFC', getValue: (p) => (p.has_nfc ? 'Yes' : 'No') },
        { label: '3.5mm Jack', getValue: (p) => (p.has_headphone_jack ? 'Yes' : 'No') },
      ],
    },
    {
      title: 'Build',
      rows: [{ label: 'Weight', getValue: (p) => fmt(p.weight_g, ' g'), getRaw: (p) => p.weight_g ? -p.weight_g : null, lowerIsBetter: true }],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <PageHeader phoneCount={phones.length} onReset={handleReset} onShare={handleShare} copied={copied} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 pb-20">
        {/* Empty state */}
        {phones.length === 0 && !loading && <EmptyState onAdd={handleAdd} />}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-red-950/30 border border-red-800/30 rounded-lg">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Phones grid */}
        {phones.length > 0 && (
          <>
            {/* Phone cards */}
            <div className={`grid gap-3 mb-6 ${phones.length === 2 ? 'grid-cols-2' : phones.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {phones.map((p, i) => (
                <PhoneCard key={p.id} phone={p} onRemove={() => handleRemove(p.id)} isBest={i === bestIdx && phones.length >= 2} />
              ))}

              {phones.length < MAX_PHONES && <AddSlot onSelect={handleAdd} excludeIds={phones.map((p) => p.id)} />}
            </div>

            {/* Specs */}
            {phones.length >= 2 && (
              <div className="space-y-3">
                <WinnerBanner phones={phones} />

                {specs.map((section) => (
                  <SpecSection key={section.title} title={section.title} rows={section.rows} phones={phones} defaultOpen={section === specs[0]} />
                ))}
              </div>
            )}

            {/* Single phone hint */}
            {phones.length === 1 && (
              <div className="mt-4 p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg flex items-center gap-2 max-w-sm">
                <Plus size={14} className="text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-300">Add another phone to compare specs</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
