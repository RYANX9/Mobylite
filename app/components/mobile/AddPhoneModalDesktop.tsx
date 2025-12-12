// app/components/desktop/AddPhoneModalDesktop.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Smartphone } from 'lucide-react';
import { Phone } from '@/lib/types';
import { api } from '@/lib/api';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { color } from '@/lib/tokens';

interface AddPhoneModalDesktopProps {
  onSelect: (phone: Phone) => void;
  onClose: () => void;
  existingIds: number[];
}

// Near the top of AddPhoneModalDesktop component
export default function AddPhoneModalDesktop({ onSelect, onClose, existingIds }: AddPhoneModalDesktopProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.phones.search({
          q: searchQuery,
          page_size: 20,
        });
        // Fix: ensure existingIds is always an array
        const validExistingIds = existingIds || [];
        setResults((data.results || []).filter((p: Phone) => !validExistingIds.includes(p.id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, existingIds]);

  const modalStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `2px solid ${color.borderLight}`,
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    borderColor: color.borderLight,
  };

  const searchInputStyle: React.CSSProperties = {
    backgroundColor: color.borderLight,
    border: `1px solid ${color.border}`,
    color: color.text,
  };

  const searchInputFocusStyle: React.CSSProperties = {
    borderColor: color.primary,
    boxShadow: `0 0 0 2px ${color.primary}1A`,
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: `${color.bgInverse}99` }}
    >
      <div 
        className="w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl"
        style={modalStyle}
      >
        <div 
          className="sticky top-0 px-8 py-6 flex items-center justify-between border-b"
          style={headerStyle}
        >
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: color.text }}>
            Add Phone to Compare
          </h2>
          <ButtonPressFeedback 
            onClick={onClose} 
            className="transition-colors"
            style={{ color: color.textMuted }}
            hoverStyle={{ color: color.text }}
          >
            <X size={24} />
          </ButtonPressFeedback>
        </div>

        <div className="p-8 border-b" style={{ borderColor: color.borderLight }}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={20} style={{ color: color.textMuted }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones..."
              autoFocus
              className="block w-full pl-14 pr-5 py-4 rounded-xl text-base font-medium focus:outline-none transition-all"
              style={searchInputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, searchInputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, searchInputStyle)}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                <Loader2 className="animate-spin" size={20} style={{ color: color.textMuted }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {!searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={64} style={{ color: color.border }} />
              <p className="text-base font-medium mt-4" style={{ color: color.textMuted }}>
                Start typing to search phones...
              </p>
            </div>
          )}
          {searchQuery.trim() && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Smartphone size={64} style={{ color: color.border }} />
              <p className="text-base font-semibold mt-4" style={{ color: color.text }}>No phones found</p>
              <p className="text-sm mt-2" style={{ color: color.textMuted }}>
                Try a different search term
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {results.map((phone) => (
              <ButtonPressFeedback
                key={phone.id}
                onClick={() => onSelect(phone)}
                className="w-full p-5 flex items-center gap-5 rounded-xl transition-all border"
                style={{ borderColor: color.borderLight, backgroundColor: color.bg }}
                hoverStyle={{ borderColor: color.text }}
              >
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden border"
                  style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
                >
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Smartphone size={28} style={{ color: color.textLight }} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                    {phone.brand}
                  </p>
                  <p className="font-semibold text-sm leading-tight" style={{ color: color.text }}>
                    {phone.model_name}
                  </p>
                </div>
                {phone.price_usd && (
                  <p className="font-bold text-xl" style={{ color: color.text }}>${phone.price_usd}</p>
                )}
              </ButtonPressFeedback>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}