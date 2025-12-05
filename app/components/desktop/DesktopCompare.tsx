// DesktopCompare.tsx 
'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Search, Loader2, Smartphone, Heart, GitCompare, Share2, Info } from 'lucide-react';

const API_BASE = 'https://renderphones.onrender.com';

const ButtonPressFeedback = ({ children, className = '', onClick, disabled = false }) => (
  <button
    className={`active:scale-[0.98] transition-all duration-150 ${className} ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Tooltip = ({ term, layman, nerd }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 text-gray-400 hover:text-black transition-colors"
      >
        <Info size={14} />
      </button>
      {show && (
        <div className="absolute z-50 w-72 bg-white border-2 border-black rounded-xl p-4 shadow-2xl left-0 top-6">
          <div className="mb-2">
            <div className="text-xs font-bold text-gray-500 mb-1">SIMPLE</div>
            <div className="text-sm text-black">{layman}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">TECHNICAL</div>
            <div className="text-sm text-black">{nerd}</div>
          </div>
        </div>
      )}
    </div>
  );
};

function AddPhoneModalDesktop({ onSelect, onClose, existingIds }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/phones/search?q=${encodeURIComponent(searchQuery)}&page_size=20`
        );
        const data = await res.json();
        setResults((data.results || []).filter((p) => !existingIds.includes(p.id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, existingIds]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black tracking-tight">Add Phone to Compare</h2>
          <ButtonPressFeedback onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={24} strokeWidth={2} />
          </ButtonPressFeedback>
        </div>

        <div className="p-8 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" strokeWidth={2} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones..."
              autoFocus
              className="block w-full pl-14 pr-5 py-4 bg-gray-50 text-black border border-gray-200 rounded-xl focus:border-black focus:outline-none placeholder:text-gray-400 text-base font-medium transition-all"
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                <Loader2 className="animate-spin text-gray-400" size={20} strokeWidth={2} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {!searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
              <p className="text-gray-400 text-base font-medium">Start typing to search phones...</p>
            </div>
          )}
          {searchQuery.trim() && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Smartphone size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
              <p className="text-gray-500 text-base font-semibold">No phones found</p>
              <p className="text-gray-400 text-sm mt-2">Try a different search term</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {results.map((phone) => (
              <ButtonPressFeedback
                key={phone.id}
                onClick={() => onSelect(phone)}
                className="w-full p-5 flex items-center gap-5 hover:border-black border border-gray-200 rounded-xl transition-all group"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 group-hover:bg-gray-100 transition-colors">
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Smartphone size={28} className="text-gray-300" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">{phone.brand}</p>
                  <p className="font-semibold text-black text-sm leading-tight">{phone.model_name}</p>
                </div>
                {phone.price_usd && <p className="font-bold text-black text-xl">${phone.price_usd}</p>}
              </ButtonPressFeedback>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesktopCompare({ phones, setComparePhones, setView }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addPhone = async (phone) => {
    if (phones.length >= 4) return;
    try {
      const res = await fetch(`${API_BASE}/phones/${phone.id}`);
      const full = await res.json();
      setComparePhones([...phones, full]);
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const removePhone = (id) => {
    const updated = phones.filter((p) => p.id !== id);
    if (updated.length === 0) setView('home');
    else setComparePhones(updated);
  };

  const shareComparison = () => {
    const ids = phones.map(p => p.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}#compare=${ids}`;
    navigator.clipboard.writeText(url);
    alert('Comparison link copied to clipboard!');
  };

  const ALL_ROWS = [
    { 
      label: 'Price', 
      key: 'price_usd', 
      type: 'low_wins', 
      fmt: (v) => (v ? `$${v}` : '—'),
      tooltip: { layman: 'Total cost to buy the phone', nerd: 'MSRP at launch in USD' }
    },
    { 
      label: 'Battery', 
      key: 'battery_capacity', 
      type: 'high_wins', 
      fmt: (v) => (v ? `${v} mAh` : '—'),
      tooltip: { layman: 'How long the battery lasts', nerd: 'Li-Po/Li-Ion capacity in mAh' }
    },
    { 
      label: 'Main Camera', 
      key: 'main_camera_mp', 
      type: 'high_wins', 
      fmt: (v) => (v ? `${v} MP` : '—'),
      tooltip: { layman: 'Photo quality in megapixels', nerd: 'Main sensor resolution' }
    },
    { 
      label: 'Screen Size', 
      key: 'screen_size', 
      type: 'high_wins', 
      fmt: (v) => (v ? `${v}"` : '—'),
      tooltip: { layman: 'Display diagonal size', nerd: 'Screen diagonal in inches' }
    },
    { 
      label: 'Fast Charging', 
      key: 'fast_charging_w', 
      type: 'high_wins', 
      fmt: (v) => (v ? `${v}W` : '—'),
      tooltip: { layman: 'How fast it charges', nerd: 'Max wired charging power in watts' }
    },
    { 
      label: 'RAM (max)', 
      key: 'ram_options', 
      type: 'high_wins', 
      fmt: (v) => (v && v.length ? `${Math.max(...v)} GB` : '—'),
      tooltip: { layman: 'Memory for running apps', nerd: 'Maximum LPDDR RAM capacity' }
    },
    { 
      label: 'Storage (max)', 
      key: 'storage_options', 
      type: 'high_wins', 
      fmt: (v) => (v && v.length ? `${Math.max(...v)} GB` : '—'),
      tooltip: { layman: 'Space for apps and files', nerd: 'Maximum UFS storage capacity' }
    },
    { 
      label: 'Weight', 
      key: 'weight_g', 
      type: 'low_wins', 
      fmt: (v) => (v ? `${v}g` : '—'),
      tooltip: { layman: 'How heavy the phone is', nerd: 'Total device weight in grams' }
    },
    { 
      label: 'Thickness', 
      key: 'thickness_mm', 
      type: 'low_wins', 
      fmt: (v) => (v ? `${v}mm` : '—'),
      tooltip: { layman: 'How thin the phone is', nerd: 'Device thickness in millimeters' }
    },
    { 
      label: 'Release Year', 
      key: 'release_year', 
      type: 'high_wins', 
      fmt: (v) => v || '—',
      tooltip: { layman: 'When it was released', nerd: 'Year of market release' }
    },
    { 
      label: 'Chipset', 
      key: 'chipset', 
      type: 'none', 
      fmt: (v) => v || '—',
      tooltip: { layman: 'Brain of the phone', nerd: 'System on Chip processor' }
    },
    { 
      label: 'AnTuTu Score', 
      key: 'antutu_score', 
      type: 'high_wins', 
      fmt: (v) => v || '—',
      tooltip: { layman: 'Performance benchmark', nerd: 'AnTuTu v10 benchmark score' }
    },
  ];

  const getWinnerIdx = (row) => {
    const raw = phones.map((p) => p[row.key]);
    const vals = raw.map((v) => (Array.isArray(v) && v.length ? Math.max(...v) : v));

    if (row.type === 'none') return -1;
    const valid = vals.filter((v) => v != null);
    if (valid.length < 2) return -1;

    const unique = new Set(valid);
    if (unique.size === 1) return -1;

    let bestVal;
    if (row.type === 'low_wins') bestVal = Math.min(...valid);
    else bestVal = Math.max(...valid);

    const bestIndices = [];
    vals.forEach((v, i) => {
      if (v === bestVal) bestIndices.push(i);
    });

    return bestIndices.length === phones.length ? -1 : bestIndices[0];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <ButtonPressFeedback onClick={() => setView('home')} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <ArrowLeft size={20} className="text-black" strokeWidth={2} />
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
              <h2 className="text-xl font-bold text-black">Mobylite</h2>
            </ButtonPressFeedback>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" strokeWidth={2} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setView('home');
                  }
                }}
                className="block w-full pl-12 pr-4 py-3 bg-gray-50 text-black rounded-xl border border-gray-200 focus:border-black focus:outline-none placeholder:text-gray-400 text-sm font-medium transition-all"
                placeholder="Search phones..."
              />
            </div>

            <div className="flex items-center gap-3">
              <ButtonPressFeedback
                onClick={shareComparison}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <Share2 size={16} strokeWidth={2} />
                <span className="text-xs font-bold text-black">Share</span>
              </ButtonPressFeedback>
              {phones.length < 4 && (
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-900 rounded-lg transition-all"
                >
                  <Plus size={16} strokeWidth={2} />
                  <span className="text-xs font-bold">Add Phone</span>
                </ButtonPressFeedback>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <GitCompare size={24} className="text-white" strokeWidth={2} />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Phone Comparison</h1>
              </div>
              <p className="text-xl text-gray-300 font-medium">Compare specifications side-by-side</p>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-10 py-6">
              <div className="text-5xl font-bold text-white mb-2">{phones.length}/4</div>
              <div className="text-sm text-gray-300 font-medium">Phones Selected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="overflow-x-auto">
          <table className="w-full border-2 border-gray-200 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="border-r-2 border-gray-200 p-6 text-left w-56 bg-white sticky left-0 z-10">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Specification</span>
                </th>
                {phones.map((phone) => (
                  <th key={phone.id} className="border-r-2 border-gray-200 p-6 relative min-w-[240px]">
                    <ButtonPressFeedback 
                      onClick={() => removePhone(phone.id)} 
                      className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full transition-all shadow-sm border border-gray-200"
                    >
                      <X size={16} className="text-gray-600" strokeWidth={2} />
                    </ButtonPressFeedback>
                    <div className="w-40 h-40 bg-white rounded-2xl mx-auto mb-5 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-sm">
                      {phone.main_image_url ? (
                        <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-6" />
                      ) : (
                        <Smartphone size={48} className="text-gray-300" strokeWidth={2} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">{phone.brand}</p>
                      <p className="text-base font-bold text-black leading-tight mb-3 px-2">{phone.model_name}</p>
                      {phone.price_usd && (
                        <div className="inline-block bg-black text-white px-4 py-2 rounded-lg">
                          <p className="text-xl font-bold">${phone.price_usd}</p>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {phones.length < 4 && (
                  <th className="border-r-2 border-gray-200 p-6 min-w-[240px]">
                    <ButtonPressFeedback 
                      onClick={() => setShowAddModal(true)} 
                      className="w-full h-full flex flex-col items-center justify-center gap-4 hover:bg-gray-50 rounded-2xl transition-all py-8 border-2 border-dashed border-gray-300"
                    >
                      <div className="w-40 h-40 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <Plus size={48} className="text-gray-400" strokeWidth={2} />
                      </div>
                      <span className="text-base font-bold text-gray-500">Add Phone</span>
                    </ButtonPressFeedback>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {ALL_ROWS.map((row, rowIdx) => {
                const winner = getWinnerIdx(row);
                return (
                  <tr key={row.label} className={`border-t-2 border-gray-200 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="border-r-2 border-gray-200 p-5 bg-white sticky left-0 z-10">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900">{row.label}</span>
                        {row.tooltip && (
                          <Tooltip 
                            term={row.label}
                            layman={row.tooltip.layman}
                            nerd={row.tooltip.nerd}
                          />
                        )}
                      </div>
                    </td>
                    {phones.map((phone, idx) => {
                      const isWinner = winner === idx;
                      const hasWinner = winner !== -1;
                      const bg = isWinner ? 'bg-black text-white' : hasWinner ? 'bg-gray-100' : '';
                      const rawVal = phone[row.key];
                      const displayVal = row.fmt(rawVal);
                      return (
                        <td key={phone.id} className={`border-r-2 border-gray-200 p-5 ${bg} transition-all`}>
                          <span className={`block text-center text-sm ${isWinner ? 'font-bold' : 'font-semibold text-gray-700'}`}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    })}
                    {phones.length < 4 && (
                      <td className="border-r-2 border-gray-200 p-5 bg-gray-50/30"></td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-black rounded"></div>
            <span>Black highlights indicate the best value for each specification</span>
          </p>
        </div>
      </div>

      {showAddModal && (
        <AddPhoneModalDesktop
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map((p) => p.id)}
        />
      )}
    </div>
  );
}