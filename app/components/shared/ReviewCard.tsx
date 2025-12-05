'use client';
import React from 'react';
import { Review } from './types';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: Review;
  variant?: 'desktop' | 'mobile';
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  variant = 'desktop',
}) => {
  const size = variant === 'mobile' ? 'text-sm' : 'text-base';

  return (
    <div className={`border border-gray-200 rounded-xl p-4 bg-white ${size}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{review.userName}</span>
        <StarRating value={review.rating} variant={variant} />
      </div>
      <p className="text-gray-500 text-xs mb-1">
        {new Date(review.createdAt).toLocaleDateString()}
      </p>
      <h3 className="font-medium mb-1">{review.title}</h3>
      <p className="text-gray-700 whitespace-pre-wrap">{review.body}</p>
    </div>
  );
};