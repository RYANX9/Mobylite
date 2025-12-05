// components/shared/ReviewCard.tsx
import React from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { Review } from './types';

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: number) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpful }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < review.rating ? 'fill-black text-black' : 'text-gray-300'}
                  strokeWidth={2}
                />
              ))}
            </div>
            {review.verified_owner && (
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                <CheckCircle size={12} strokeWidth={2} />
                <span className="text-[10px] font-bold">Verified Owner</span>
              </div>
            )}
          </div>
          <h4 className="font-bold text-black text-base mb-1">{review.title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold">{review.user_name}</span>
            <span>•</span>
            <span>{formatDate(review.date)}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-4">{review.review_text}</p>

      {(review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0) ? (
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
          {review.pros && review.pros.length > 0 && (
            <div>
              <div className="text-xs font-bold text-green-700 mb-2">PROS</div>
              <ul className="space-y-1">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div>
              <div className="text-xs font-bold text-red-700 mb-2">CONS</div>
              <ul className="space-y-1">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">−</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={() => onHelpful?.(review.id)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
      >
        <ThumbsUp size={14} strokeWidth={2} />
        <span>Helpful ({review.helpful_count})</span>
      </button>
    </div>
  );
};