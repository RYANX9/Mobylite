import React from 'react';
import {
  Camera, Battery, Monitor, Cpu, MemoryStick, Volume2, 
  Wifi, Zap, Info, Package, Signal, Calendar, Award, ChevronDown, ChevronUp
} from 'lucide-react';

const cleanHTMLText = (text) => {
  if (!text) return '';
  let cleaned = String(text);
  cleaned = cleaned.replace(/<br\s*\/?>/gi, ' • ');
  cleaned = cleaned.replace(/<sup>([^<]*)<\/sup>/gi, '$1');
  cleaned = cleaned.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  return cleaned;
};

const getIconForCategory = (category) => {
  const icons = {
    'Body': Package,
    'Display': Monitor,
    'Platform': Cpu,
    'Memory': MemoryStick,
    'Main Camera': Camera,
    'Selfie camera': Camera,
    'Selfie Camera': Camera,
    'Sound': Volume2,
    'Comms': Wifi,
    'Features': Zap,
    'Battery': Battery,
    'Misc': Info,
    'Network': Signal,
    'Launch': Calendar,
    'Our Tests': Award
  };
  return icons[category] || Info;
};

const formatSpecValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  if (Array.isArray(value)) {
    return value.map(v => cleanHTMLText(v)).join(', ');
  }
  
  if (typeof value === 'object' && value.price_usd) {
    return `$${value.price_usd}`;
  }
  
  if (typeof value === 'object') {
    return cleanHTMLText(JSON.stringify(value));
  }
  
  return cleanHTMLText(value);
};

export default function ExpertSpecs({ phone, showFullSpecs, setShowFullSpecs }) {
  const fullSpecs = phone.full_specifications?.specifications || {};
  
  const categoryOrder = [
    'Display',
    'Platform',
    'Memory',
    'Main Camera',
    'Selfie camera',
    'Selfie Camera',
    'Battery',
    'Network',
    'Body',
    'Sound',
    'Comms',
    'Features',
    'Launch',
    'Our Tests',
    'Misc'
  ];
  
  const sortedCategories = Object.entries(fullSpecs).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a[0]);
    const indexB = categoryOrder.indexOf(b[0]);
    
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
  
  const categories = sortedCategories;
  const displayCategories = showFullSpecs ? categories : categories.slice(0, 3);

  return (
    <div className="space-y-3 mb-6">
      {displayCategories.map(([category, specs]) => {
        const CategoryIcon = getIconForCategory(category);
        return (
          <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                <CategoryIcon size={12} className="text-black" strokeWidth={2} />
              </div>
              <h3 className="text-xs font-bold text-black">{category}</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-shrink-0">{key}</span>
                    <span className="text-xs font-medium text-black text-right leading-relaxed">
                      {formatSpecValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      
      {categories.length > 3 && (
        <button
          onClick={() => setShowFullSpecs(!showFullSpecs)}
          className="w-full py-3 bg-gray-100 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          {showFullSpecs ? (
            <>
              <ChevronUp size={18} strokeWidth={2} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={18} strokeWidth={2} />
              Show All Specs
            </>
          )}
        </button>
      )}
    </div>
  );
}