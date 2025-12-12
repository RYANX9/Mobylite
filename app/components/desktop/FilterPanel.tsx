// app\components\desktop\FilterPanel.tsx
'use client';
import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Filters } from '@/lib/types';
import { ButtonPressFeedback } from '../shared/ButtonPressFeedback';
import { Tooltip } from '../shared/Tooltip';
import { color, font } from '@/lib/tokens';
import { BRANDS } from '@/lib/config';

interface FilterPanelProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, onReset }) => {
  const panelStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${color.borderLight}`,
  };

  const scrollbarStyle = {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${color.border} ${color.borderLight}`,
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: color.primary,
    boxShadow: `0 0 0 2px ${color.primary}1A`,
  };

  const tagStyle: React.CSSProperties = {
    backgroundColor: color.text,
    color: color.bg,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: font.primary,
    color: color.text,
  };

  const handleBrandAdd = (newBrand: string) => {
    if (!newBrand) return;
    const currentBrands = filters.brands || [];
    if (!currentBrands.includes(newBrand)) {
      setFilters({ ...filters, brands: [...currentBrands, newBrand] });
    }
  };

  const handleBrandRemove = (brandToRemove: string) => {
    const currentBrands = filters.brands || [];
    setFilters({ 
      ...filters, 
      brands: currentBrands.filter(b => b !== brandToRemove) 
    });
  };

  return (
    <div className="w-80 flex-shrink-0">
      <div 
        className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-6 rounded-2xl scrollbar-thin"
        style={{ ...panelStyle, ...scrollbarStyle }}
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
              <Tooltip 
                term="Price" 
                layman="Total cost to buy the phone new" 
                nerd="Manufacturer suggested retail price at launch, USD converted from local currency" 
              />
            </label>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.min_price || ''}
                onChange={(e) =>
                  setFilters({ ...filters, min_price: e.target.value ? Number(e.target.value) : null })
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
                  setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>
          </div>

          {/* Brands */}
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

          {/* OS */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Operating System
            </label>
            <select
              value={filters.os || ''}
              onChange={(e) => setFilters({ ...filters, os: e.target.value || null })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            >
              <option value="">Any</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
            </select>
          </div>

          {/* RAM */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum RAM
              <Tooltip 
                term="RAM" 
                layman="Memory for running apps smoothly" 
                nerd="LPDDR5/5X volatile memory, GB capacity, bandwidth in MT/s" 
              />
            </label>
            <select
              value={filters.min_ram || ''}
              onChange={(e) => setFilters({ ...filters, min_ram: e.target.value ? Number(e.target.value) : null })}
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

          {/* Storage */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum Storage
              <Tooltip 
                term="Storage" 
                layman="Space for apps, photos, and videos" 
                nerd="UFS 3.1/4.0 NAND flash storage capacity in GB" 
              />
            </label>
            <select
              value={filters.min_storage || ''}
              onChange={(e) => setFilters({ ...filters, min_storage: e.target.value ? Number(e.target.value) : null })}
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

          {/* Battery */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum Battery
              <Tooltip 
                term="Battery" 
                layman="How long the phone lasts on one charge" 
                nerd="Li-Po/Li-Ion capacity in mAh, typical/rated, wired/wireless charging watts" 
              />
            </label>
            <select
              value={filters.min_battery || ''}
              onChange={(e) => setFilters({ ...filters, min_battery: e.target.value ? Number(e.target.value) : null })}
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

          {/* Camera */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Minimum Camera
              <Tooltip 
                term="Camera" 
                layman="Photo quality in megapixels" 
                nerd="Main sensor MP, aperture, pixel size, OIS/EIS, video recording specs" 
              />
            </label>
            <select
              value={filters.min_camera_mp || ''}
              onChange={(e) => setFilters({ ...filters, min_camera_mp: e.target.value ? Number(e.target.value) : null })}
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

          {/* 5G Support */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_5g === true}
                onChange={(e) => setFilters({ ...filters, has_5g: e.target.checked ? true : null })}
                className="w-5 h-5 rounded transition-colors"
                style={{ 
                  border: `1px solid ${color.border}`, 
                  accentColor: color.text 
                }}
              />
              <span className="text-sm font-semibold" style={{ color: color.text }}>5G Support</span>
            </label>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={sectionTitleStyle}>
              Release Year
            </label>
            <select
              value={filters.min_year || ''}
              onChange={(e) => setFilters({ ...filters, min_year: e.target.value ? Number(e.target.value) : null })}
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
  );
};