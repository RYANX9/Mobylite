// app/components/shared/PhoneCard.tsx
'use client';
import React, { useState } from 'react';
import { Smartphone, TrendingDown, Heart, GitCompare } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { Phone } from '@/lib/types';
import { isNewRelease } from '@/lib/utils';
import { getAuthToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/lib/config';
import { color } from '@/lib/tokens';

interface PhoneCardProps {
  phone: Phone;
  variant?: 'desktop' | 'mobile' | 'tiny';
  onPhoneClick?: (phone: Phone) => void;
  onCompareToggle?: (phone: Phone) => void;
  onPriceAlert?: (phone: Phone) => void;
  isInCompare?: boolean;
  isInFavorites?: boolean;
  showRating?: boolean;
  onFavoriteToggle?: (phone: Phone) => void;
}

export const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  variant = 'desktop',
  onPhoneClick,
  onCompareToggle,
  onPriceAlert,
  onFavoriteToggle,
  isInCompare,
  isInFavorites,
  showRating
}) => {
  const router = useRouter();
  const isNew = isNewRelease(phone);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const token = getAuthToken();
    if (!token) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('returnUrl', currentPath);
      
      if (confirm('Please sign in to save favorites. Go to sign in?')) {
        router.push(APP_ROUTES.login);
      }
      return;
    }

    setFavoriteLoading(true);
    try {
      let response;
      if (isInFavorites) {
        response = await api.favorites.remove(phone.id);
      } else {
        response = await api.favorites.add(phone.id);
      }
      
      if (response && response.success) {
        onFavoriteToggle?.(phone);
      } else {
        throw new Error('Failed to update favorite');
      }
    } catch (error: any) {
      console.error('Favorite error:', error);
      alert(error?.message || 'Failed to update favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const cardBaseStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${color.borderLight}`,
  };

  const favoriteButtonStyle: React.CSSProperties = {
    backgroundColor: isInFavorites ? color.dangerBg : color.borderLight,
    color: isInFavorites ? color.danger : color.textMuted,
    opacity: favoriteLoading ? 0.5 : 1,
    cursor: favoriteLoading ? 'not-allowed' : 'pointer',
  };

  const compareButtonStyle: React.CSSProperties = {
    backgroundColor: isInCompare ? color.bgInverse : color.borderLight,
    color: isInCompare ? color.primaryText : color.text,
  };

  const newBadgeStyle: React.CSSProperties = {
    backgroundColor: color.bgInverse,
    color: color.primaryText,
  };

  if (variant === 'tiny') {
    return (
      <div 
        className="rounded-xl p-3 transition-all relative"
        style={cardBaseStyle}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = color.border}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = color.borderLight}
      >
        <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick?.(phone)}>
          <div 
            className="h-32 rounded-lg mb-2 flex items-center justify-center overflow-hidden border"
            style={{ backgroundColor: '#FFFFFF', borderColor: color.border }}
          >
            {phone.main_image_url ? (
              <img
                src={phone.main_image_url}
                alt={phone.model_name}
                className="h-full object-contain p-2"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Smartphone size={32} style={{ color: color.textLight }} />
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
            {phone.brand}
          </p>
          <h3 className="font-bold text-sm line-clamp-2 min-h-[40px] mb-2" style={{ color: color.text }}>
            {phone.model_name}
          </h3>
          {phone.price_usd && (
            <p className="font-bold text-base" style={{ color: color.text }}>${phone.price_usd}</p>
          )}
        </ButtonPressFeedback>
        <div className="mt-2 flex gap-1">
          <ButtonPressFeedback
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className="flex-1 p-2 rounded-lg transition-all"
            style={favoriteButtonStyle}
          >
            <Heart size={14} fill={isInFavorites ? 'currentColor' : 'none'} />
          </ButtonPressFeedback>
        </div>
      </div>
    );
  }
  
  if (variant === 'mobile') {
      return (
        <div 
          className="rounded-2xl overflow-hidden transition-all shadow-sm relative"
          style={cardBaseStyle}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = color.border}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = color.borderLight}
        >
          {isNew && (
            <div 
              className="absolute top-3 left-3 text-[8px] font-bold px-2 py-1 rounded-full z-10"
              style={newBadgeStyle}
            >
              NEW
            </div>
          )}
          <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick?.(phone)}>
            <div 
              className="w-full h-44 flex items-center justify-center p-4 transition-colors border-b"
              style={{ backgroundColor: '#FFFFFF', borderColor: color.border }}
            >
              {phone.main_image_url ? (
                <img
                  src={phone.main_image_url}
                  alt={phone.model_name}
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Smartphone size={40} style={{ color: color.textLight }} />
              )}
            </div>
            <div className="p-4">
              <p className="text-[9px] mb-1 font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
                {phone.brand}
              </p>
              <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2 min-h-[40px]" style={{ color: color.text }}>
                {phone.model_name}
              </h3>
              {phone.price_usd ? (
                <p className="font-bold text-lg" style={{ color: color.text }}>${phone.price_usd}</p>
              ) : (
                <p className="text-xs" style={{ color: color.textLight }}>Price unavailable</p>
              )}
            </div>
          </ButtonPressFeedback>
          <div className="px-3 pb-4 flex gap-1.5">
            <ButtonPressFeedback
              onClick={(e) => {
                e.stopPropagation();
                onCompareToggle?.(phone);
              }}
              className="flex-[2] py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={compareButtonStyle}
            >
              <GitCompare size={14} />
              {isInCompare ? 'Remove' : 'Compare'}
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={(e) => {
                e.stopPropagation();
                onPriceAlert?.(phone);
              }}
              className="flex-1 py-2 rounded-xl transition-all flex items-center justify-center"
              style={{ backgroundColor: color.borderLight }}
            >
              <TrendingDown size={16} style={{ color: color.text }} />
            </ButtonPressFeedback>
            <ButtonPressFeedback
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className="flex-1 py-2 rounded-xl transition-all flex items-center justify-center"
              style={favoriteButtonStyle}
            >
              <Heart size={16} fill={isInFavorites ? 'currentColor' : 'none'} />
            </ButtonPressFeedback>
          </div>
        </div>
      );
    }

  return (
    <div 
      className="w-full overflow-hidden rounded-2xl transition-all shadow-sm relative"
      style={cardBaseStyle}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = color.border}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = color.borderLight}
    >
      {isNew && (
        <div 
          className="absolute top-3 right-3 text-[9px] font-bold px-3 py-1 rounded-full z-10"
          style={newBadgeStyle}
        >
          NEW
        </div>
      )}
      <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick?.(phone)}>
        <div 
          className="w-full h-48 flex items-center justify-center overflow-hidden rounded-t-2xl transition-colors p-6 border-b"
          style={{ backgroundColor: '#FFFFFF', borderColor: color.border }}
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
          <p className="text-[10px] mb-1 font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
            {phone.brand}
          </p>
          <h3 className="font-bold text-sm leading-tight mb-2 min-h-[36px] line-clamp-2" style={{ color: color.text }}>
            {phone.model_name}
          </h3>
          {phone.release_date_full && (
            <p className="text-[10px] mb-2" style={{ color: color.textLight }}>
              {phone.release_date_full.replace(/Released\s+/i, '')}
            </p>
          )}
          {phone.price_usd ? (
            <p className="font-bold text-xl" style={{ color: color.text }}>${phone.price_usd}</p>
          ) : (
            <p className="text-xs" style={{ color: color.textLight }}>Price unavailable</p>
          )}
        </div>
      </ButtonPressFeedback>
      <div className="px-5 pb-5 flex gap-2 justify-center">
        <ButtonPressFeedback
          onClick={(e) => {
            e.stopPropagation();
            onCompareToggle?.(phone);
          }}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
          style={compareButtonStyle}
        >
          <GitCompare size={14} />
          {isInCompare ? 'Remove' : 'Compare'}
        </ButtonPressFeedback>
        <ButtonPressFeedback
          onClick={(e) => {
            e.stopPropagation();
            onPriceAlert?.(phone);
          }}
          className="px-2.5 py-2 rounded-lg transition-all"
          style={{ backgroundColor: color.borderLight }}
        >
          <TrendingDown size={16} style={{ color: color.text }} />
        </ButtonPressFeedback>
        <ButtonPressFeedback
          onClick={handleFavorite}
          disabled={favoriteLoading}
          className="px-2.5 py-2 rounded-lg transition-all"
          style={favoriteButtonStyle}
        >
          <Heart size={16} fill={isInFavorites ? 'currentColor' : 'none'} />
        </ButtonPressFeedback>
      </div>
    </div>
  );
};
