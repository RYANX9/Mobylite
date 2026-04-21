'use client'
import React from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Filters } from '@/lib/types'
import { ButtonPressFeedback } from './ButtonPressFeedback'
import { color, font } from '@/lib/tokens'
import { BRANDS } from '@/lib/config'

interface FilterPanelProps {
  filters: Filters
  setFilters: (filters: Filters) => void
  onReset: () => void
  variant?: 'desktop' | 'mobile'
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  setFilters,
  onReset,
  variant = 'desktop',
}) => {
  const panelStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${color.borderLight}`,
  }

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  }

  const inputFocusStyle: React.CSSProperties = {
    borderColor: color.primary,
    boxShadow: `0 0 0 2px ${color.primary}1A`,
  }

  const tagStyle: React.CSSProperties = {
    backgroundColor: color.text,
    color: color.bg,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: font.primary,
    color: color.text,
  }

  const handleBrandAdd = (newBrand: string) => {
    if (!newBrand) return
    const current = filters.brands || []
    if (!current.includes(newBrand)) {
      setFilters({ ...filters, brands: [...current, newBrand] })
    }
  }

  const handleBrandRemove = (brand: string) => {
    setFilters({ ...filters, brands: (filters.brands || []).filter((b) => b !== brand) })
  }

  const containerClass = variant === 'mobile' ? 'w-full' : 'w-80 flex-shrink-0'
  const stickyClass =
    variant === 'mobile' ? '' : 'sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto'

  return (
    <div className={containerClass}>
      <div
        className={`${stickyClass} p-6 rounded-2xl`}
        style={panelStyle}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-bold tracking-tight flex items-center gap-2"
            style={sectionTitleStyle}
          >
            <SlidersHorizontal size={20} strokeWidth={2} />
            Filters
          </h2>
          <ButtonPressFeedback
            onClick={onReset}
            className="text-xs font-semibold transition-colors"
            style={{ color: color.textMuted }}
            hoverStyle={{ color: color.text }}
          >
            Reset All
          </ButtonPressFeedback>
        </div>

        <div className="space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Price Range (USD)
            </label>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.min_price || ''}
                onChange={(e) =>
                  setFilters({ ...filters, min_price: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.max_price || ''}
                onChange={(e) =>
                  setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Brand
            </label>
            <select
              value=""
              onChange={(e) => handleBrandAdd(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Select brand...</option>
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            {filters.brands && filters.brands.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.brands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full"
                    style={tagStyle}
                  >
                    {brand}
                    <ButtonPressFeedback
                      onClick={() => handleBrandRemove(brand)}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: color.bg }}
                    >
                      <X size={12} />
                    </ButtonPressFeedback>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Minimum RAM */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum RAM
            </label>
            <select
              value={filters.min_ram || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_ram: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Any</option>
              <option value="4">4 GB</option>
              <option value="6">6 GB</option>
              <option value="8">8 GB</option>
              <option value="12">12 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>

          {/* Minimum Storage */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum Storage
            </label>
            <select
              value={filters.min_storage || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_storage: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Any</option>
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB</option>
            </select>
          </div>

          {/* Minimum Battery */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum Battery
            </label>
            <select
              value={filters.min_battery || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_battery: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Any</option>
              <option value="3000">3000 mAh</option>
              <option value="4000">4000 mAh</option>
              <option value="5000">5000 mAh</option>
              <option value="6000">6000 mAh</option>
            </select>
          </div>

          {/* Minimum Camera */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum Camera
            </label>
            <select
              value={filters.min_camera_mp || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_camera_mp: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Any</option>
              <option value="12">12 MP</option>
              <option value="48">48 MP</option>
              <option value="64">64 MP</option>
              <option value="108">108 MP</option>
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Release Year
            </label>
            <select
              value={filters.min_year || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_year: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Any</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
