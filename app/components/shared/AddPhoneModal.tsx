// app/components/shared/AddPhoneModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Smartphone } from 'lucide-react';
import { Phone } from '@/lib/types';
import { api } from '@/lib/api';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { color } from '@/lib/tokens';

interface AddPhoneModalProps {
  onSelect: (phone: Phone) => void;
  onClose: () => void;
  existingIds: number[];
  variant?: 'desktop' | 'mobile';
}

export const AddPhoneModal: React.FC<AddPhoneModalProps> = ({ 
  onSelect, 
  onClose, 
  existingIds,
  variant = 'desktop'
}) => {
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
        setResults((data.results || []).filter((p: Phone) => !existingIds.includes(p.id)));
      } catch (e) {
        console.error('Search error:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, existingIds]);

  const handleSelect = async (phone: Phone) => {
    try {
      const fullPhone = await api.phones.getDetails(phone.id);
      onSelect(fullPhone);
    } catch (error) {
      console.error('Error loading phone:', error);
      alert('Failed to load phone details');
    }
  };

  if (variant === 'mobile') {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col"
        style={{ backgroundColor: color.bg }}
      >
        <div className="sticky top-0 px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: color.borderLight, backgroundColor: color.bg }}>
          <h2 className="text-lg font-bold" style={{ color: color.text }}>
            Add Phone
          </h2>
          <ButtonPressFeedback onClick={onClose}>
            <X size={24} style={{ color: color.textMuted }} />
          </ButtonPressFeedback>
        </div>

        <div className="p-4 border-b" style={{ borderColor: color.borderLight }}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} style={{ color: color.textMuted }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones..."
              autoFocus
              className="block w-full pl-10 pr-3 py-3 rounded-lg text-sm font-medium focus:outline-none"
              style={{
                backgroundColor: color.borderLight,
                border: `1px solid ${color.border}`,
                color: color.text,
              }}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="animate-spin" size={18} style={{ color: color.textMuted }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search size={48} style={{ color: color.border }} />
              <p className="text-sm font-medium mt-3" style={{ color: color.textMuted }}>
                Start typing to search
              </p>
            </div>
          )}

          {searchQuery.trim() && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Smartphone size={48} style={{ color: color.border }} />
              <p className="text-sm font-semibold mt-3" style={{ color: color.text }}>No results</p>
            </div>
          )}

          <div className="space-y-2">
            {results.map((phone) => (
              <ButtonPressFeedback
                key={phone.id}
                onClick={() => handleSelect(phone)}
                className="w-full p-3 flex items-center gap-3 rounded-lg border"
                style={{ borderColor: color.borderLight, backgroundColor: color.bg }}
              >
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color.borderLight }}
                >
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Smartphone size={24} style={{ color: color.textLight }} />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{ color: color.textMuted }}>
                    {phone.brand}
                  </p>
                  <p className="font-semibold text-sm leading-tight truncate" style={{ color: color.text }}>
                    {phone.model_name}
                  </p>
                </div>
                {phone.price_usd && (
                  <p className="font-bold text-base flex-shrink-0" style={{ color: color.text }}>${phone.price_usd}</p>
                )}
              </ButtonPressFeedback>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: color.bg }}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: color.borderLight }}>
          <h2 className="text-xl font-bold" style={{ color: color.text }}>
            Add Phone to Comparison
          </h2>
          <ButtonPressFeedback onClick={onClose}>
            <X size={24} style={{ color: color.textMuted }} />
          </ButtonPressFeedback>
        </div>

        <div className="p-6 border-b" style={{ borderColor: color.borderLight }}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} style={{ color: color.textMuted }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones..."
              autoFocus
              className="block w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={{
                backgroundColor: color.borderLight,
                border: `1px solid ${color.border}`,
                color: color.text,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = color.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = color.border}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Loader2 className="animate-spin" size={20} style={{ color: color.textMuted }} />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 max-h-[500px] overflow-y-auto">
          {!searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search size={64} style={{ color: color.border }} />
              <p className="text-base font-medium mt-4" style={{ color: color.textMuted }}>
                Start typing to search phones
              </p>
            </div>
          )}

          {searchQuery.trim() && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Smartphone size={64} style={{ color: color.border }} />
              <p className="text-base font-semibold mt-4" style={{ color: color.text }}>
                No phones found
              </p>
              <p className="text-sm mt-2" style={{ color: color.textMuted }}>
                Try different search terms
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {results.map((phone) => (
              <ButtonPressFeedback
                key={phone.id}
                onClick={() => handleSelect(phone)}
                className="p-4 flex flex-col items-center rounded-xl border transition-all"
                style={{ borderColor: color.borderLight, backgroundColor: color.bg }}
                hoverStyle={{ borderColor: color.text }}
              >
                <div 
                  className="w-32 h-32 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: color.borderLight }}
                >
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <Smartphone size={40} style={{ color: color.textLight }} />
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                  {phone.brand}
                </p>
                <p className="font-bold text-sm leading-tight text-center mb-2 line-clamp-2" style={{ color: color.text }}>
                  {phone.model_name}
                </p>
                {phone.price_usd && (
                  <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: color.text, color: color.bg }}>
                    <p className="font-bold text-sm">${phone.price_usd}</p>
                  </div>
                )}
              </ButtonPressFeedback>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};