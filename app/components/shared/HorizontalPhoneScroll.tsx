// components/shared/HorizontalPhoneScroll.tsx
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, GitCompare } from 'lucide-react';
import { Phone } from './types';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { API_BASE } from './constants';

interface HorizontalPhoneScrollProps {
  title: string;
  subtitle?: string;
  phones: Phone[];
  onPhoneClick: (phone: Phone) => void;
  onCompareClick?: (phone: Phone) => void;
  showComparisonCount?: boolean;
  comparisonCounts?: { [key: number]: number };
}

export const HorizontalPhoneScroll: React.FC<HorizontalPhoneScrollProps> = ({
  title,
  subtitle,
  phones,
  onPhoneClick,
  onCompareClick,
  showComparisonCount = false,
  comparisonCounts = {}
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  if (phones.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-black">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 font-medium mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
            className={`w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center transition-all ${
              showLeftArrow ? 'hover:border-black hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={20} className="text-black" strokeWidth={2} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
            className={`w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center transition-all ${
              showRightArrow ? 'hover:border-black hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} className="text-black" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {phones.map((phone) => (
          <div
            key={`${phone.id}-${Math.random()}`}
            className="flex-shrink-0 w-64 bg-white border border-gray-200 hover:border-black rounded-2xl overflow-hidden transition-all group"
          >
            <ButtonPressFeedback
              onClick={() => onPhoneClick(phone)}
              className="w-full"
            >
              <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden group-hover:bg-gray-100 transition-colors">
                {phone.main_image_url ? (
                  <img
                    src={phone.main_image_url}
                    alt={phone.model_name}
                    className="w-full h-full object-contain p-6"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Smartphone size={48} className="text-gray-300" strokeWidth={2} />
                )}
              </div>

              <div className="p-5">
                <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wide">{phone.brand}</p>
                <p className="text-sm font-bold text-black leading-tight line-clamp-2 mb-2 min-h-[36px]">
                  {phone.model_name}
                </p>
                {phone.price_usd && (
                  <p className="text-xl font-bold text-black mb-2">${phone.price_usd}</p>
                )}
                {showComparisonCount && comparisonCounts[phone.id] && (
                  <p className="text-xs text-gray-500 font-medium">
                    Compared {comparisonCounts[phone.id].toLocaleString()} times
                  </p>
                )}
              </div>
            </ButtonPressFeedback>

            {onCompareClick && (
              <div className="px-5 pb-5">
                <ButtonPressFeedback
                  onClick={() => onCompareClick(phone)}
                  className="w-full py-2 bg-black text-white hover:bg-gray-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <GitCompare size={14} strokeWidth={2} />
                  Compare
                </ButtonPressFeedback>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};