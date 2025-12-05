// components/shared/PhoneCard.tsx
import React from 'react';
import { Smartphone, TrendingDown } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { Phone } from './types';
import { isNewRelease, API_BASE } from './utils';

interface PhoneCardProps {
  phone: Phone;
  variant?: 'desktop' | 'mobile' | 'tiny';   // <-- add tiny
  onPhoneClick?: (phone: Phone) => void;     // optional for tiny
  onCompareToggle?: (phone: Phone) => void;  // optional for tiny
  onPriceAlert?: (phone: Phone) => void;     // optional for tiny
  isInCompare?: boolean;                     // optional for tiny
  showRating?: boolean;                      // <-- new flag
}

export const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  variant = 'desktop',
  onPhoneClick,
  onCompareToggle,
  onPriceAlert,
  isInCompare
}) => {
  const isNew = isNewRelease(phone);
  /* ----------  TINY VARIANT (horizontal scroller) ---------- */
  if (variant === 'tiny') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 w-48 flex-shrink-0">
        {showRating && phone.averageRating !== undefined && (
          <div className="mb-2">
            <StarRating value={phone.averageRating} variant="mobile" />
          </div>
        )}

        <div className="h-32 bg-gray-50 rounded-lg mb-2 flex items-center justify-center">
          {phone.main_image_url ? (
            <img
              src={phone.main_image_url}
              alt={phone.model_name}
              className="h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Smartphone size={32} className="text-gray-300" />
          )}
        </div>

        <p className="text-[10px] text-gray-500">{phone.brand}</p>
        <h3 className="font-semibold text-sm text-black line-clamp-2 min-h-[40px]">{phone.model_name}</h3>
        {phone.price_usd && (
          <p className="font-bold text-black mt-1">${phone.price_usd}</p>
        )}
      </div>
    );
  }
  
  if (variant === 'mobile') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden active:scale-[0.97] transition-all">
        {isNew && (
          <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-bold px-2 py-1 rounded-full z-10">
            NEW
          </div>
        )}

        <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick(phone)}>
          <div className="w-full h-44 bg-gray-50 flex items-center justify-center p-4">
            {phone.main_image_url ? (
              <img
                src={phone.main_image_url}
                alt={phone.model_name}
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <Smartphone size={40} className="text-gray-300" strokeWidth={2} />
            )}
          </div>

          <div className="p-4">
            <p className="text-[9px] text-gray-500 mb-1 font-medium uppercase">{phone.brand}</p>
            <h3 className="font-bold text-black text-sm leading-snug mb-2 line-clamp-2 min-h-[40px]">
              {phone.model_name}
            </h3>
            {phone.price_usd ? (
              <p className="font-bold text-lg text-black">${phone.price_usd}</p>
            ) : (
              <p className="text-xs text-gray-400 font-medium">Price unavailable</p>
            )}
          </div>
        </ButtonPressFeedback>

        <div className="px-4 pb-4 flex gap-2">
          <ButtonPressFeedback
            onClick={() => onCompareToggle(phone)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isInCompare ? 'bg-black text-white' : 'bg-gray-100 text-black'
            }`}
          >
            {isInCompare ? 'Remove' : 'Compare'}
          </ButtonPressFeedback>
          <ButtonPressFeedback
            onClick={() => onPriceAlert(phone)}
            className="px-3 py-2.5 rounded-xl bg-gray-100"
          >
            <TrendingDown size={16} className="text-black" />
          </ButtonPressFeedback>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 hover:border-black transition-all relative overflow-hidden rounded-2xl group">
      {isNew && (
        <div className="absolute top-3 right-3 bg-black text-white text-[9px] font-bold px-3 py-1 rounded-full z-10">
          NEW
        </div>
      )}

      <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick(phone)}>
        <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden rounded-t-2xl group-hover:bg-gray-100 transition-colors">
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
          <p className="text-[10px] text-gray-500 mb-1 font-medium">{phone.brand}</p>
          <h3 className="font-semibold text-black text-sm leading-tight mb-2 min-h-[36px] line-clamp-2">
            {phone.model_name}
          </h3>
          {phone.release_date_full && (
            <p className="text-[10px] text-gray-400 font-medium mb-2">{phone.release_date_full}</p>
          )}
          {phone.price_usd ? (
            <p className="font-bold text-xl text-black">${phone.price_usd}</p>
          ) : (
            <p className="text-xs text-gray-400 font-medium">Price unavailable</p>
          )}
        </div>
      </ButtonPressFeedback>

      <div className="px-5 pb-5 flex gap-2">
        <ButtonPressFeedback
          onClick={() => onCompareToggle(phone)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            isInCompare ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          {isInCompare ? 'Remove' : 'Compare'}
        </ButtonPressFeedback>
        <ButtonPressFeedback
          onClick={() => onPriceAlert(phone)}
          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
        >
          <TrendingDown size={16} className="text-black" />
        </ButtonPressFeedback>
      </div>
    </div>
  );
};