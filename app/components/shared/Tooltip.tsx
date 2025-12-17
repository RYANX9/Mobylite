// app/components/shared/Tooltip.tsx
import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { color } from '@/lib/tokens';

interface TooltipProps {
  term: string;
  layman: string;
  nerd: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ term, layman, nerd }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 transition-colors"
        style={{ color: color.textMuted }}
        onMouseOver={(e) => e.currentTarget.style.color = color.text}
        onMouseOut={(e) => e.currentTarget.style.color = color.textMuted}
      >
        <Info size={14} />
      </button>
      {show && (
        <div 
          className="absolute z-50 w-72 rounded-xl p-4 shadow-2xl left-0 top-6"
          style={{ 
            backgroundColor: color.bg, 
            border: `2px solid ${color.primary}` 
          }}
        >
          <div className="mb-2">
            <div className="text-xs font-bold mb-1" style={{ color: color.textMuted }}>
              SIMPLE
            </div>
            <div className="text-sm" style={{ color: color.text }}>
              {layman}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold mb-1" style={{ color: color.textMuted }}>
              TECHNICAL
            </div>
            <div className="text-sm" style={{ color: color.text }}>
              {nerd}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};