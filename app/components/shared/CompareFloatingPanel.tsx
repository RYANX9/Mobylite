// components/shared/CompareFloatingPanel.tsx
import React from 'react';
import { X, GitCompare } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { Phone } from './types';

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
  if (compareList.length === 0) return null;

  if (variant === 'mobile') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Compare ({compareList.length}/4)</h3>
          <button onClick={onClear} className="text-gray-400">
            <X size={18} />
          </button>
        </div>
        <ButtonPressFeedback
          onClick={onCompare}
          className="w-full py-3 bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        >
          <GitCompare size={16} />
          Compare Now
        </ButtonPressFeedback>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 bg-black text-white rounded-2xl p-6 shadow-2xl z-40 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Compare List ({compareList.length}/4)</h3>
        <button onClick={onClear} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-2 mb-4">
        {compareList.map((phone) => (
          <div key={phone.id} className="flex items-center justify-between bg-white/10 rounded-lg p-2">
            <span className="text-xs font-medium truncate flex-1">{phone.model_name}</span>
            <button
              onClick={() => onRemove(phone.id)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCompare}
          className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
        >
          <GitCompare size={16} />
          Compare
        </button>
      </div>
    </div>
  );
};