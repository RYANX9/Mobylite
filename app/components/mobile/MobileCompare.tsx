import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Search, Loader2, Smartphone, Info, Share2, GitCompare, ChevronLeft, ChevronRight } from 'lucide-react';

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
        onClick={() => setShow(!show)}
        className="ml-1 text-gray-400 active:text-black transition-colors"
      >
        <Info size={14} />
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
          <div className="absolute z-50 w-64 bg-white border-2 border-black rounded-xl p-4 shadow-2xl left-0 top-6">
            <div className="mb-2">
              <div className="text-xs font-bold text-gray-500 mb-1">SIMPLE</div>
              <div className="text-sm text-black">{layman}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 mb-1">TECHNICAL</div>
              <div className="text-sm text-black">{nerd}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function AddPhoneModal({ onSelect, onClose, existingIds }) {
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">Add Phone</h2>
          <ButtonPressFeedback onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={24} strokeWidth={2} />
          </ButtonPressFeedback>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" strokeWidth={2} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones..."
              autoFocus
              className="block w-full pl-12 pr-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-xl focus:border-black focus:outline-none placeholder:text-gray-400 text-sm font-medium"
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Loader2 className="animate-spin text-gray-400" size={18} strokeWidth={2} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search size={48} className="text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-gray-400 text-sm font-medium">Start typing to search</p>
            </div>
          )}
          {searchQuery.trim() && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Smartphone size={48} className="text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-gray-500 text-sm font-semibold">No phones found</p>
            </div>
          )}
          <div className="space-y-3 pt-3">
            {results.map((phone) => (
              <ButtonPressFeedback
                key={phone.id}
                onClick={() => onSelect(phone)}
                className="w-full p-4 flex items-center gap-4 hover:border-black border border-gray-200 rounded-xl transition-all"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Smartphone size={24} className="text-gray-300" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[9px] text-gray-500 font-bold mb-0.5 uppercase tracking-wide">{phone.brand}</p>
                  <p className="font-semibold text-black text-sm leading-tight truncate">{phone.model_name}</p>
                </div>
                {phone.price_usd && <p className="font-bold text-black text-base flex-shrink-0">${phone.price_usd}</p>}
              </ButtonPressFeedback>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileCompare({ phones: initialPhones, setComparePhones, setView }) {
  const [phones, setPhones] = useState(initialPhones || []);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (initialPhones) {
      setPhones(initialPhones);
    }
  }, [initialPhones]);

  const addPhone = async (phone) => {
    if (phones.length >= 4) return;
    try {
      const res = await fetch(`${API_BASE}/phones/${phone.id}`);
      const full = await res.json();
      const updated = [...phones, full];
      setPhones(updated);
      setComparePhones(updated);
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const removePhone = (id) => {
    const updated = phones.filter((p) => p.id !== id);
    setPhones(updated);
    setComparePhones(updated);
    if (updated.length === 0) {
      setView('home');
    }
  };

  const shareComparison = () => {
    const ids = phones.map(p => p.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}#compare=${ids}`;
    navigator.clipboard.writeText(url);
    alert('Comparison link copied!');
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

  if (phones.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <ButtonPressFeedback onClick={() => setView('home')} className="text-white">
              <ArrowLeft size={20} strokeWidth={2} />
            </ButtonPressFeedback>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <GitCompare size={20} className="text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-white">Compare</h1>
          </div>
          <p className="text-sm text-gray-300 font-medium">Compare phone specs side-by-side</p>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <GitCompare size={32} className="text-gray-400" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Start Comparing</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Add phones to compare their specifications</p>
          <ButtonPressFeedback
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl"
          >
            <Plus size={18} strokeWidth={2} />
            <span className="text-sm font-bold">Add First Phone</span>
          </ButtonPressFeedback>
        </div>

        {showAddModal && (
          <AddPhoneModal
            onSelect={addPhone}
            onClose={() => setShowAddModal(false)}
            existingIds={phones.map((p) => p.id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ButtonPressFeedback onClick={() => setView('home')} className="text-white">
                <ArrowLeft size={20} strokeWidth={2} />
              </ButtonPressFeedback>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <GitCompare size={20} className="text-white" strokeWidth={2} />
              </div>
              <h1 className="text-xl font-bold text-white">Compare</h1>
            </div>
            <div className="flex items-center gap-2">
              <ButtonPressFeedback
                onClick={shareComparison}
                className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg"
              >
                <Share2 size={16} className="text-white" strokeWidth={2} />
              </ButtonPressFeedback>
              {phones.length < 4 && (
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg"
                >
                  <Plus size={16} strokeWidth={2} />
                  <span className="text-xs font-bold">Add</span>
                </ButtonPressFeedback>
              )}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 inline-block">
            <span className="text-lg font-bold text-white">{phones.length}</span>
            <span className="text-xs text-gray-300 font-medium ml-1">/4 Phones</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full">
          {/* Specs Column */}
          <div className="w-32 flex-shrink-0 sticky left-0 z-10 bg-white border-r-2 border-gray-200">
            {/* Empty header space */}
            <div className="h-48 border-b-2 border-gray-200 bg-gray-50"></div>
            
            {/* Spec rows */}
            {ALL_ROWS.map((row, idx) => (
              <div key={row.label} className={`h-16 border-b border-gray-200 px-3 py-2 flex items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-900 leading-tight">{row.label}</span>
                  {row.tooltip && (
                    <Tooltip 
                      term={row.label}
                      layman={row.tooltip.layman}
                      nerd={row.tooltip.nerd}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Phone Columns */}
          {phones.map((phone, phoneIdx) => {
            return (
              <div key={phone.id} className="w-40 flex-shrink-0 border-r-2 border-gray-200 bg-white">
                {/* Phone Header */}
                <div className="h-48 border-b-2 border-gray-200 p-3 bg-gradient-to-b from-gray-50 to-white relative">
                  <ButtonPressFeedback
                    onClick={() => removePhone(phone.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border border-gray-200 z-10"
                  >
                    <X size={12} className="text-gray-600" strokeWidth={2} />
                  </ButtonPressFeedback>
                  
                  <div className="w-20 h-20 bg-white rounded-xl mx-auto mb-2 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                    {phone.main_image_url ? (
                      <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <Smartphone size={24} className="text-gray-300" strokeWidth={2} />
                    )}
                  </div>
                  
                  <p className="text-[8px] text-gray-500 font-bold mb-0.5 uppercase tracking-wide text-center">{phone.brand}</p>
                  <p className="text-xs font-bold text-black leading-tight text-center mb-1 line-clamp-2">{phone.model_name}</p>
                  {phone.price_usd && (
                    <div className="bg-black text-white px-2 py-1 rounded-md text-center">
                      <p className="text-xs font-bold">${phone.price_usd}</p>
                    </div>
                  )}
                </div>

                {/* Value Rows */}
                {ALL_ROWS.map((row, idx) => {
                  const winner = getWinnerIdx(row);
                  const isWinner = winner === phoneIdx;
                  const hasWinner = winner !== -1;
                  const rawVal = phone[row.key];
                  const displayVal = row.fmt(rawVal);
                  
                  return (
                    <div 
                      key={row.label}
                      className={`h-16 border-b border-gray-200 px-3 py-2 flex items-center justify-center ${
                        isWinner ? 'bg-black' : hasWinner ? 'bg-gray-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs text-center leading-tight ${isWinner ? 'font-bold text-white' : 'font-semibold text-gray-700'}`}>
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Add Phone Column */}
          {phones.length < 4 && (
            <div className="w-40 flex-shrink-0 bg-gray-50/50">
              <div className="h-48 border-b-2 border-gray-200 p-3 flex items-center justify-center">
                <ButtonPressFeedback
                  onClick={() => setShowAddModal(true)}
                  className="flex flex-col items-center gap-2 py-4 px-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-100/50 transition-all"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Plus size={24} className="text-gray-400" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-bold text-gray-500">Add Phone</span>
                </ButtonPressFeedback>
              </div>
              {ALL_ROWS.map((_, idx) => (
                <div key={idx} className={`h-16 border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50/30' : 'bg-gray-50/50'}`}></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-600 font-medium flex items-center gap-2">
            <div className="w-4 h-4 bg-black rounded flex-shrink-0"></div>
            <span>Black = Best value</span>
          </p>
        </div>
      </div>

      {showAddModal && (
        <AddPhoneModal
          onSelect={addPhone}
          onClose={() => setShowAddModal(false)}
          existingIds={phones.map((p) => p.id)}
        />
      )}
    </div>
  );
}