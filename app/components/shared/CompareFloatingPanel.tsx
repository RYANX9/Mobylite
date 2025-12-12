
// app\components\shared\CompareFloatingPanel.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { X, GitCompare } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { Phone } from '@/lib/types';
import { APP_ROUTES, createPhoneSlug } from '@/lib/config';
import { color } from '@/lib/tokens';

interface CompareFloatingPanelProps {
  compareList: Phone[];
  onRemove: (phoneId: number) => void;
  onClear: () => void;
  onCompare: () => void;
  variant?: 'desktop' | 'mobile';
}

export const CompareFloatingPanel: React.FC<CompareFloatingPanelProps> = ({
  compareList,
  onRemove,
  onClear,
  onCompare,
  variant = 'desktop'
}) => {
  const router = useRouter();
  
  if (compareList.length === 0) return null;

  const handleCompare = () => {
    const phoneSlugs = compareList.map(phone => createPhoneSlug(phone));
    router.push(APP_ROUTES.compare(phoneSlugs));
    onCompare();
  };

  const basePanelStyle: React.CSSProperties = {
    backgroundColor: color.bgInverse,
    color: color.primaryText,
  };

  const clearButtonStyle: React.CSSProperties = {
    color: color.textMuted,
  };

  const compareButtonStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    color: color.text,
  };

  if (variant === 'mobile') {
    return (
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 z-50 safe-area-inset-bottom"
        style={basePanelStyle}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Compare ({compareList.length}/4)
          </h3>
          <button onClick={onClear} style={clearButtonStyle}>
            <X size={18} />
          </button>
        </div>
        <ButtonPressFeedback
          onClick={handleCompare}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={compareButtonStyle}
        >
          <GitCompare size={16} />
          Compare Now
        </ButtonPressFeedback>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-8 right-8 rounded-2xl p-6 shadow-2xl z-40 w-80 border"
      style={{ ...basePanelStyle, borderColor: color.border }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
          Compare List ({compareList.length}/4)
        </h3>
        <button onClick={onClear} style={clearButtonStyle}>
          <X size={20} />
        </button>
      </div>
      <div className="space-y-2 mb-4">
        {compareList.map((phone) => (
          <div 
            key={phone.id} 
            className="flex items-center justify-between rounded-lg p-2"
            style={{ backgroundColor: `${color.bg}1A` }}
          >
            <span className="text-xs font-medium truncate flex-1" style={{ color: color.primaryText }}>
              {phone.model_name}
            </span>
            <button
              onClick={() => onRemove(phone.id)}
              className="ml-2 transition-colors"
              style={clearButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = color.primaryText}
              onMouseLeave={(e) => e.currentTarget.style.color = color.textMuted}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <ButtonPressFeedback
        onClick={handleCompare}
        className="w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
        style={compareButtonStyle}
      >
        <GitCompare size={16} />
        Compare
      </ButtonPressFeedback>
    </div>
  );
};