// components/shared/Tooltip.tsx
import React, { useState } from 'react';
import { Info } from 'lucide-react';

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