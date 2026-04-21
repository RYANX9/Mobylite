'use client'
import React, { useState } from 'react'
import { Smartphone, Heart, GitCompare, Check } from 'lucide-react'
import { ButtonPressFeedback } from './ButtonPressFeedback'
import { Phone } from '@/lib/types'
import { getAuthToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { navigateToLogin } from '@/lib/navigation'
import { color } from '@/lib/tokens'

interface PhoneCardProps {
  phone: Phone
  variant?: 'desktop' | 'mobile' | 'tiny'
  onPhoneClick?: (phone: Phone) => void
  onCompareToggle?: (phone: Phone) => void
  onPriceAlert?: (phone: Phone) => void
  isInCompare?: boolean
  isInFavorites?: boolean
  showRating?: boolean
  onFavoriteToggle?: (phone: Phone) => void
}

export const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  variant = 'desktop',
  onPhoneClick,
  onCompareToggle,
  onFavoriteToggle,
  isInCompare,
  isInFavorites,
}) => {
  const router = useRouter()
  // Optimistic favorite state — updates immediately, rolls back on API failure
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  // Track image load failure to show placeholder
  const [imgFailed, setImgFailed] = useState(false)

  const isFavorite = optimisticFavorite !== null ? optimisticFavorite : (isInFavorites ?? false)

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!getAuthToken()) {
      navigateToLogin(router)
      return
    }

    if (favoriteLoading) return

    // Optimistic update
    const previous = isFavorite
    setOptimisticFavorite(!previous)
    setFavoriteLoading(true)

    try {
      if (previous) {
        await api.favorites.remove(phone.id)
      } else {
        await api.favorites.add(phone.id)
      }
      onFavoriteToggle?.(phone)
    } catch {
      // Silent rollback
      setOptimisticFavorite(previous)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const favoriteButtonStyle: React.CSSProperties = {
    backgroundColor: isFavorite ? color.dangerBg : color.borderLight,
    color: isFavorite ? color.danger : color.textMuted,
    opacity: favoriteLoading ? 0.6 : 1,
  }

  const compareButtonStyle: React.CSSProperties = {
    backgroundColor: isInCompare ? color.borderLight : color.borderLight,
    color: isInCompare ? color.success : color.text,
    border: isInCompare ? `1.5px solid ${color.success}` : `1.5px solid transparent`,
  }

  const PhoneImage = () =>
    phone.main_image_url && !imgFailed ? (
      <img
        src={phone.main_image_url}
        alt={phone.model_name}
        className="w-full h-full object-contain"
        onError={() => setImgFailed(true)}
      />
    ) : (
      <Smartphone size={variant === 'tiny' ? 32 : 40} style={{ color: color.textLight }} />
    )

  if (variant === 'tiny') {
    return (
      <div
        className="rounded-xl p-3 transition-all relative"
        style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color.border
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = color.borderLight
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick?.(phone)}>
          <div
            className="h-32 rounded-lg mb-2 flex items-center justify-center overflow-hidden border"
            style={{ backgroundColor: color.borderLight, borderColor: color.border }}
          >
            <PhoneImage />
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
            className="flex-1 p-2 rounded-lg transition-all flex items-center justify-center"
            style={favoriteButtonStyle}
          >
            <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </ButtonPressFeedback>
        </div>
      </div>
    )
  }

  if (variant === 'mobile') {
    return (
      <div
        className="rounded-2xl overflow-hidden transition-all shadow-sm relative"
        style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color.border
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = color.borderLight
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick?.(phone)}>
          <div
            className="w-full h-44 flex items-center justify-center p-4 transition-colors border-b"
            style={{ backgroundColor: color.borderLight, borderColor: color.border }}
          >
            <PhoneImage />
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
            onClick={(e) => { e.stopPropagation(); onCompareToggle?.(phone) }}
            className="flex-[2] py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={compareButtonStyle}
          >
            {isInCompare ? <Check size={13} strokeWidth={2.5} /> : <GitCompare size={13} />}
            {isInCompare ? 'Added' : 'Compare'}
          </ButtonPressFeedback>

          <ButtonPressFeedback
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className="flex-1 py-2 rounded-xl transition-all flex items-center justify-center"
            style={favoriteButtonStyle}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </ButtonPressFeedback>
        </div>
      </div>
    )
  }

  // desktop variant
  return (
    <div
      className="w-full overflow-hidden rounded-2xl transition-all shadow-sm relative"
      style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color.border
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = color.borderLight
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <ButtonPressFeedback className="w-full" onClick={() => onPhoneClick?.(phone)}>
        <div
          className="w-full h-48 flex items-center justify-center overflow-hidden rounded-t-2xl p-6 border-b"
          style={{ backgroundColor: color.borderLight, borderColor: color.border }}
        >
          <PhoneImage />
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
          onClick={(e) => { e.stopPropagation(); onCompareToggle?.(phone) }}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
          style={compareButtonStyle}
        >
          {isInCompare ? <Check size={13} strokeWidth={2.5} /> : <GitCompare size={13} />}
          {isInCompare ? 'Added' : 'Compare'}
        </ButtonPressFeedback>

        <ButtonPressFeedback
          onClick={handleFavorite}
          disabled={favoriteLoading}
          className="px-3 py-2 rounded-lg transition-all flex items-center justify-center"
          style={favoriteButtonStyle}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </ButtonPressFeedback>
      </div>
    </div>
  )
}
