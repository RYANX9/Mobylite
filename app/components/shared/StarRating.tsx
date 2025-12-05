'use client';
import React from 'react';

interface StarRatingProps {
  value: number; // 0 – 5 in 0.5 steps
  onChange?: (next: number) => void; // omit for read-only
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  className = '',
  variant = 'desktop',
}) => {
  const size = variant === 'mobile' ? 'w-4 h-4' : 'w-5 h-5';

  const handleClick = (idx: number, half: boolean) => {
    if (!onChange) return;
    onChange(idx + (half ? 0.5 : 1));
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      {[...Array(5)].map((_, i) => {
        const full = value >= i + 1;
        const half = value >= i + 0.5 && value < i + 1;
        return (
          <div key={i} className="relative">
            {/* background star */}
            <svg className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>

            {/* foreground (filled portion) */}
            <div
              className={`absolute top-0 left-0 h-full overflow-hidden flex ${
                half ? 'w-1/2' : full ? 'w-full' : 'w-0'
              }`}
            >
              <svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            {/* invisible click targets */}
            {onChange && (
              <>
                <span
                  onClick={() => handleClick(i, true)}
                  className="absolute top-0 left-0 w-1/2 h-full cursor-pointer"
                />
                <span
                  onClick={() => handleClick(i, false)}
                  className="absolute top-0 left-1/2 w-1/2 h-full cursor-pointer"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};