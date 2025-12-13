// app/components/shared/RatingsSummary.tsx

'use client';
import React, { useEffect, useState } from 'react';
import { Star, Users, Heart, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { color } from '@/lib/tokens';

interface PhoneStats {
  average_rating: number;
  total_reviews: number;
  total_favorites: number;
  total_owners: number;
  rating_distribution: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
  verified_owners_percentage: number;
}

interface RatingsSummaryProps {
  phoneId: number;
  variant?: 'compact' | 'detailed';
}

export const RatingsSummary: React.FC<RatingsSummaryProps> = ({
  phoneId,
  variant = 'compact'
}) => {
  const [stats, setStats] = useState<PhoneStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [phoneId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.phones.getStats(phoneId);
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch phone stats:', error);
      setStats({
        average_rating: 0,
        total_reviews: 0,
        total_favorites: 0,
        total_owners: 0,
        rating_distribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
        verified_owners_percentage: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-8 rounded animate-pulse" style={{ backgroundColor: color.borderLight }} />;
  }

  if (!stats) return null;

  const starStyle = (filled: boolean): React.CSSProperties => ({
    color: filled ? color.starFilled : color.starEmpty,
  });

  const verifiedOwnersCount = stats.total_owners;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star size={16} style={starStyle(true)} />
          <span className="font-bold" style={{ color: color.text }}>
            {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : 'N/A'}
          </span>
        </div>
        <span className="text-sm" style={{ color: color.textMuted }}>
          ({stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'})
        </span>
        {verifiedOwnersCount > 0 && (
          <>
            <span style={{ color: color.border }}>|</span>
            <div className="flex items-center gap-1 text-sm" style={{ color: color.success }}>
              <UserCheck size={14} />
              <span>{verifiedOwnersCount} owners</span>
            </div>
          </>
        )}
      </div>
    );
  }

  const statCardStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${color.borderLight}`,
  };

  const totalRatings = stats.total_reviews;
  const getRatingPercentage = (count: number) => 
    totalRatings > 0 ? (count / totalRatings) * 100 : 0;

  return (
    <div 
      className="rounded-2xl p-6 border"
      style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2" style={{ fontFamily: 'Roboto, sans-serif', color: color.text }}>
              {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : 'N/A'}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  style={starStyle(i < Math.round(stats.average_rating))}
                  fill={i < Math.round(stats.average_rating) ? color.starFilled : 'none'}
                />
              ))}
            </div>
            <div className="text-xs font-medium" style={{ color: color.textMuted }}>
              {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
            </div>
            {verifiedOwnersCount > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs font-medium mt-1" style={{ color: color.success }}>
                <UserCheck size={14} />
                <span>{verifiedOwnersCount} verified owners</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.rating_distribution[rating.toString() as keyof typeof stats.rating_distribution];
              const percentage = getRatingPercentage(count);
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-8" style={{ color: color.textMuted }}>
                    {rating} ★
                  </span>
                  <div 
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: color.border }}
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: color.starFilled
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color: color.textMuted }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={statCardStyle}>
            <UserCheck size={20} style={{ color: color.success }} className="mb-2" />
            <div className="text-2xl font-bold mb-1" style={{ color: color.text }}>
              {verifiedOwnersCount}
            </div>
            <div className="text-xs font-medium" style={{ color: color.textMuted }}>Verified Owners</div>
          </div>
          <div className="rounded-xl p-4" style={statCardStyle}>
            <Heart size={20} style={{ color: color.text }} className="mb-2" />
            <div className="text-2xl font-bold mb-1" style={{ color: color.text }}>
              {stats.total_favorites}
            </div>
            <div className="text-xs font-medium" style={{ color: color.textMuted }}>Favorites</div>
          </div>

        </div>
      </div>
    </div>
  );
};