'use client'
import React from 'react'
import { X } from 'lucide-react'
import { Filters } from '@/lib/types'
import { color } from '@/lib/tokens'

interface ActiveFilterChipsProps {
  filters: Filters
  onRemove: (key: keyof Filters) => void
  onRemoveBrand: (brand: string) => void
}

interface Chip {
  key: keyof Filters | string
  label: string
  isBrand?: boolean
  brandValue?: string
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemove,
  onRemoveBrand,
}) => {
  const chips: Chip[] = []

  if (filters.min_price || filters.max_price) {
    const label =
      filters.min_price && filters.max_price
        ? `$${filters.min_price}–$${filters.max_price}`
        : filters.min_price
        ? `From $${filters.min_price}`
        : `Up to $${filters.max_price}`
    chips.push({ key: 'min_price', label })
  }

  if (filters.brands && filters.brands.length > 0) {
    filters.brands.forEach((brand) => {
      chips.push({ key: `brand_${brand}`, label: brand, isBrand: true, brandValue: brand })
    })
  }

  if (filters.min_ram) {
    chips.push({ key: 'min_ram', label: `${filters.min_ram}GB+ RAM` })
  }

  if (filters.min_storage) {
    chips.push({ key: 'min_storage', label: `${filters.min_storage}GB+ Storage` })
  }

  if (filters.min_battery) {
    chips.push({ key: 'min_battery', label: `${filters.min_battery}mAh+ Battery` })
  }

  if (filters.min_camera_mp) {
    chips.push({ key: 'min_camera_mp', label: `${filters.min_camera_mp}MP+ Camera` })
  }

  if (filters.min_year) {
    chips.push({ key: 'min_year', label: `${filters.min_year}+` })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: color.borderLight, color: color.text }}
        >
          {chip.label}
          <button
            onClick={() =>
              chip.isBrand && chip.brandValue
                ? onRemoveBrand(chip.brandValue)
                : onRemove(chip.key as keyof Filters)
            }
            className="flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
            style={{ color: color.textMuted }}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  )
}
