// desktop/FilterPanel.tsx
import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
// src/desktop/FilterPanel.tsx
import { Filters } from '../../components/shared/types';
import { ButtonPressFeedback } from '../../components/shared/ButtonPressFeedback';
import { Tooltip } from '../../components/shared/Tooltip';

interface FilterPanelProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, onReset }) => {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto bg-white border border-gray-200 rounded-2xl p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
            <SlidersHorizontal size={20} strokeWidth={2} />
            Filters
          </h2>
          <ButtonPressFeedback
            onClick={onReset}
            className="text-xs font-semibold text-gray-600 hover:text-black transition-colors"
          >
            Reset All
          </ButtonPressFeedback>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-black mb-3">
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.max_price || ''}
                onChange={(e) =>
                  setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">Brand</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !filters.brands.includes(e.target.value)) {
                  setFilters({ ...filters, brands: [...filters.brands, e.target.value] });
                }
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Select brand...</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Oppo">Oppo</option>
              <option value="Vivo">Vivo</option>
              <option value="Realme">Realme</option>
              <option value="Motorola">Motorola</option>
              <option value="Nokia">Nokia</option>
            </select>
            {filters.brands.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.brands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center gap-2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full"
                  >
                    {brand}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, brands: filters.brands.filter((b) => b !== brand) })
                      }
                      className="hover:text-gray-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">Operating System</label>
            <select
              value={filters.os || ''}
              onChange={(e) => setFilters({ ...filters, os: e.target.value || null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Any</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Any</option>
              <option value="4">4 GB</option>
              <option value="6">6 GB</option>
              <option value="8">8 GB</option>
              <option value="12">12 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Any</option>
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Any</option>
              <option value="3000">3000 mAh</option>
              <option value="4000">4000 mAh</option>
              <option value="5000">5000 mAh</option>
              <option value="6000">6000 mAh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">
              Minimum Camera
              <Tooltip 
                term="Camera" 
                layman="Photo quality in megapixels" 
                nerd="Main sensor MP, aperture, pixel size, OIS/EIS, video recording specs" 
              />
            </label>
            <select
              value={filters.min_camera_mp || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_camera_mp: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Any</option>
              <option value="12">12 MP</option>
              <option value="48">48 MP</option>
              <option value="64">64 MP</option>
              <option value="108">108 MP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">Screen Size</label>
            <select
              value={filters.screen_size || ''}
              onChange={(e) => setFilters({ ...filters, screen_size: e.target.value || null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
            >
              <option value="">Any</option>
              <option value="small">Small (under 6")</option>
              <option value="medium">Medium (6" to 6.5")</option>
              <option value="large">Large (over 6.5")</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_5g === true}
                onChange={(e) => setFilters({ ...filters, has_5g: e.target.checked ? true : null })}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-semibold text-black">5G Support</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-3">Release Year</label>
            <select
              value={filters.min_year || ''}
              onChange={(e) => setFilters({ ...filters, min_year: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
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