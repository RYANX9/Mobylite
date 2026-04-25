'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Smartphone, Check } from 'lucide-react'
import { ROUTES, brandSlug, phoneSlug, valueScoreColor } from '@/lib/config'
import { c, f } from '@/lib/tokens'
import type { Phone } from '@/lib/types'

interface PhoneCardProps {
  phone: Phone
  compareIds: number[]
  onCompareToggle: (phone: Phone) => void
  /** compact = image + name + price only, no badges */
  compact?: boolean
}

function SpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        padding: '6px 8px',
        background: 'var(--bg)',
        borderRadius: 'var(--r-sm)',
      }}
    >
      <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>
        {value}
      </span>
    </div>
  )
}

export default function PhoneCard({ phone, compareIds, onCompareToggle, compact }: PhoneCardProps) {
  const [imgErr, setImgErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  const inCompare = compareIds.includes(phone.id)

  const href = ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone))

  const specs = [
    phone.screen_size ? { label: 'Display', value: `${phone.screen_size}"` } : null,
    phone.battery_capacity ? { label: 'Battery', value: `${phone.battery_capacity.toLocaleString()} mAh` } : null,
    phone.ram_options?.length ? { label: 'RAM', value: `${Math.max(...phone.ram_options)} GB` } : null,
    phone.main_camera_mp ? { label: 'Camera', value: `${phone.main_camera_mp} MP` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Compare checkbox */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onCompareToggle(phone) }}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 2,
          width: 22,
          height: 22,
          borderRadius: 5,
          border: `1.5px solid ${inCompare ? 'var(--accent)' : 'var(--border)'}`,
          background: inCompare ? 'var(--accent)' : 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
        title={inCompare ? 'Remove from compare' : 'Add to compare'}
      >
        {inCompare && <Check size={12} color="#fff" strokeWidth={2.5} />}
      </button>

      <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>
        {/* Image */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: compact ? 16 : 20,
            overflow: 'hidden',
          }}
        >
          {phone.main_image_url && !imgErr ? (
            <img
              src={phone.main_image_url}
              alt={phone.model_name}
              onError={() => setImgErr(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'transform 0.2s ease',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <Smartphone size={40} color="var(--border)" strokeWidth={1.5} />
          )}
        </div>

        {/* Info */}
        <div style={{ padding: compact ? '10px 12px 12px' : '12px 14px 14px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-3)',
              marginBottom: 2,
            }}
          >
            {phone.brand}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: compact ? 14 : 16,
              color: 'var(--text-1)',
              lineHeight: 1.3,
              marginBottom: 6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {phone.model_name}
          </div>
          <div
            style={{
              fontSize: compact ? 15 : 17,
              fontWeight: 600,
              color: phone.price_usd ? 'var(--text-1)' : 'var(--text-3)',
              marginBottom: compact ? 0 : 10,
            }}
          >
            {phone.price_usd ? `$${phone.price_usd.toLocaleString()}` : 'Price TBA'}
          </div>

          {/* Spec badges */}
          {!compact && specs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
              {specs.slice(0, 4).map(s => (
                <SpecBadge key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          )}

          {/* Footer row */}
          {!compact && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: '1px solid var(--border)',
              }}
            >
              {phone.value_score != null ? (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Value:{' '}
                  <span style={{ fontWeight: 600, color: valueScoreColor(phone.value_score) }}>
                    {phone.value_score.toFixed(1)}
                  </span>
                  /10
                </span>
              ) : <span />}
              {phone.release_year && (
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{phone.release_year}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}

// Skeleton version
export function PhoneCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
      }}
    >
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1' }} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 4 }} />
        <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 18, width: '35%', marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 36 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
