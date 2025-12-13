// app\components\shared\ReviewCard.tsx
'use client';
import React, { useState } from 'react';
import { Review } from '@/lib/types';
import { StarRating } from './StarRating';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { color } from '@/lib/tokens';
import { APP_ROUTES } from '@/lib/config';

interface ReviewCardProps {
  review: Review;
  variant?: 'desktop' | 'mobile';
  onHelpful?: (reviewId: string) => Promise<void>;
  userVote?: 'helpful' | null;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  variant = 'desktop',
  onHelpful,
  userVote = null
}) => {
  const router = useRouter();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [voted, setVoted] = useState(!!userVote);

  const handleHelpful = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated()) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('returnUrl', currentPath);
      
      if (confirm('Please sign in to vote on reviews. Go to sign in?')) {
        router.push(APP_ROUTES.login);
      }
      return;
    }

    if (onHelpful) {
      await onHelpful(review.id);
      setHelpfulCount(prev => prev + 1);
      setVoted(true);
    }
  };

  const size = variant === 'mobile' ? 'text-sm' : 'text-base';
  const displayName = review.display_name || `User${review.user_id?.slice(0, 6) || 'Unknown'}`;

  return (
    <div 
      className={`rounded-xl p-4 transition-all ${size}`}
      style={{ 
        backgroundColor: color.bg,
        border: `1px solid ${color.borderLight}` 
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = color.border}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = color.borderLight}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: color.primary, color: color.bg }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold" style={{ color: color.text }}>
            {displayName}
          </span>
          {review.verified_owner && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: color.successBg,
                color: color.success
              }}
            >
              Verified Owner
            </span>
          )}
          {review.is_owner && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: color.primary + '20',
                color: color.primary
              }}
            >
              Owner
            </span>
          )}
        </div>
        <StarRating value={review.rating} variant={variant} />
      </div>
      
      <p className="text-xs mb-1" style={{ color: color.textMuted }}>
        {new Date(review.created_at).toLocaleDateString()}
        {review.edited_at && (
          <span className="ml-2 italic">(Edited)</span>
        )}
      </p>
      
      <h3 className="font-medium mb-2" style={{ color: color.text }}>
        {review.title}
      </h3>
      <p className="whitespace-pre-wrap mb-3" style={{ color: color.textMuted }}>
        {review.body}
      </p>

      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
          {review.pros?.length > 0 && (
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: color.success }}>
                PROS
              </div>
              <ul className="space-y-1">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-xs flex items-start gap-1" style={{ color: color.textMuted }}>
                    <span style={{ color: color.success }}>+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons?.length > 0 && (
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: color.danger }}>
                CONS
              </div>
              <ul className="space-y-1">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-xs flex items-start gap-1" style={{ color: color.textMuted }}>
                    <span style={{ color: color.danger }}>−</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleHelpful}
        disabled={voted}
        className="flex items-center gap-2 text-xs font-semibold transition-colors px-2 py-1 rounded-lg"
        style={{ 
          color: voted ? color.success : color.textMuted,
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => !voted && (e.currentTarget.style.backgroundColor = color.borderLight)}
        onMouseLeave={(e) => !voted && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Helpful ({helpfulCount})</span>
        {voted && <span>✓</span>}
      </button>
    </div>
  );
};