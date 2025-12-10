'use client';
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, GitCompare } from 'lucide-react';
import { Phone } from '@/lib/types';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { color, font } from '@/lib/tokens';

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

  const arrowButtonStyle = (enabled: boolean): React.CSSProperties => ({
    border: `2px solid ${color.border}`,
    color: color.text,
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? 'pointer' : 'not-allowed',
    backgroundColor: color.bg,
  });

  const arrowHoverStyle = (enabled: boolean): React.CSSProperties | undefined => {
    if (!enabled) return undefined;
    return {
      borderColor: color.text,
      backgroundColor: color.borderLight,
    };
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${color.borderLight}`,
    flexShrink: 0,
    width: '256px',
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>{title}</h3>
          {subtitle && <p className="text-sm font-medium mt-1" style={{ color: color.textMuted }}>{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <ButtonPressFeedback
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={arrowButtonStyle(showLeftArrow)}
            hoverStyle={showLeftArrow ? arrowHoverStyle(true) : undefined}
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </ButtonPressFeedback>
          <ButtonPressFeedback
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={arrowButtonStyle(showRightArrow)}
            hoverStyle={showRightArrow ? arrowHoverStyle(true) : undefined}
          >
            <ChevronRight size={20} strokeWidth={2} />
          </ButtonPressFeedback>
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
            key={phone.id}
            className="rounded-2xl overflow-hidden transition-all"
            style={cardStyle}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = color.text}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = color.borderLight}
          >
            <ButtonPressFeedback
              onClick={() => onPhoneClick(phone)}
              className="w-full"
            >
              <div 
                className="w-full h-48 flex items-center justify-center overflow-hidden transition-colors p-6"
                style={{ backgroundColor: color.borderLight }}
              >
                {phone.main_image_url ? (
                  <img
                    src={phone.main_image_url}
                    alt={phone.model_name}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Smartphone size={48} style={{ color: color.textLight }} />
                )}
              </div>

              <div className="p-5">
                <p className="text-[10px] mb-1 font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>{phone.brand}</p>
                <p className="text-sm font-bold leading-tight line-clamp-2 mb-2 min-h-[36px]" style={{ color: color.text }}>
                  {phone.model_name}
                </p>
                {phone.price_usd && (
                  <p className="text-xl font-bold mb-2" style={{ color: color.text }}>${phone.price_usd}</p>
                )}
                {showComparisonCount && comparisonCounts[phone.id] && (
                  <p className="text-xs font-medium" style={{ color: color.textMuted }}>
                    Compared {comparisonCounts[phone.id].toLocaleString()} times
                  </p>
                )}
              </div>
            </ButtonPressFeedback>

            {onCompareClick && (
              <div className="px-5 pb-5">
                <ButtonPressFeedback
                  onClick={() => onCompareClick(phone)}
                  className="w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: color.text, color: color.bg }}
                  hoverStyle={{ backgroundColor: color.text }}
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