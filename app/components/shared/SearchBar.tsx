// components/shared/SearchBar.tsx
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  onKeyPress,
  placeholder = "Search phones...",
  className = "",
  variant = 'desktop'
}) => {
  const baseClasses = variant === 'mobile'
    ? "block w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30"
    : "block w-full pl-12 pr-4 py-3 bg-gray-50 text-black rounded-xl border border-gray-200 focus:border-black focus:outline-none placeholder:text-gray-400 text-sm font-medium transition-all";

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search size={variant === 'mobile' ? 18 : 20} className={variant === 'mobile' ? 'text-gray-400' : 'text-gray-400'} strokeWidth={2} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        className={baseClasses}
        placeholder={placeholder}
      />
    </div>
  );
};