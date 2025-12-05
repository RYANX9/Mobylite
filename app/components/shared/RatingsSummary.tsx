// components/shared/RatingsSummary.tsx - NEW SEPARATE FILE
import React from 'react';
import { Star, Users, Heart } from 'lucide-react';

interface RatingsSummaryProps {
  averageRating: number;
  totalReviews: number;
  ownersCount?: number;
  wantCount?: number;
  variant?: 'compact' | 'detailed';
}

export const RatingsSummary: React.FC<RatingsSummaryProps> = ({
  averageRating,
  totalReviews,
  ownersCount,
  wantCount,
  variant = 'compact'
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star size={16} className="fill-black text-black" strokeWidth={2} />
          <span className="font-bold text-black">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-gray-500">({totalReviews.toLocaleString()} reviews)</span>
        {ownersCount && (
          <>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users size={14} />
              <span>{ownersCount.toLocaleString()} own it</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-black mb-2">{averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < Math.round(averageRating) ? 'fill-black text-black' : 'text-gray-300'}
                strokeWidth={2}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 font-medium">{totalReviews.toLocaleString()} reviews</div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
          {ownersCount && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <Users size={20} className="text-black mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{ownersCount.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium">Owners</div>
            </div>
          )}
          {wantCount && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <Heart size={20} className="text-black mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{wantCount.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium">Want it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};