'use client';
import React, { useEffect, useState } from 'react';
import { Star, Users, Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { color } from '@//lib/tokens';

interface PhoneStats {
  average_rating: string;
  total_reviews: string;
  total_favorites: string;
}

interface RatingsSummaryProps {
  phoneId: number;
  variant?: 'compact' | 'detailed';
}

export const RatingsSummary: React.FC<RatingsSummaryProps> = ({
  phoneId,
  variant = 'compact'
}) => {
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ownersCount: 0,
    wantCount: 0,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    loadStats();
  }, [phoneId]);

  const loadStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.phones.getStats(phoneId);
      if (data.success && data.stats) {
        setStats({
          averageRating: parseFloat(data.stats.average_rating) || 0,
          totalReviews: parseInt(data.stats.total_reviews) || 0,
          ownersCount: Math.floor((parseInt(data.stats.total_reviews) || 0) * 0.7),
          wantCount: parseInt(data.stats.total_favorites) || 0,
          loading: false,
          error: null,
        });
      } else {
        setStats(prev => ({ ...prev, loading: false, error: 'Failed to load stats' }));
      }
    } catch (error) {
      console.error('Failed to fetch phone stats:', error);
      setStats(prev => ({ ...prev, loading: false, error: 'Network error' }));
    }
  };

  if (stats.loading) {
    return <div className="h-8 rounded animate-pulse" style={{ backgroundColor: color.borderLight }} />;
  }

  if (stats.error) {
    return (
      <div className="text-sm" style={{ color: color.textMuted }}>
        Stats unavailable
      </div>
    );
  }

  const starStyle = (filled: boolean): React.CSSProperties => ({
    color: filled ? color.starFilled : color.starEmpty,
  });

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star size={16} style={starStyle(true)} />
          <span className="font-bold" style={{ color: color.text }}>{stats.averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm" style={{ color: color.textMuted }}>
          ({stats.totalReviews.toLocaleString()} reviews)
        </span>
        {stats.ownersCount > 0 && (
          <>
            <span style={{ color: color.border }}>|</span>
            <div className="flex items-center gap-1 text-sm" style={{ color: color.textMuted }}>
              <Users size={14} />
              <span>{stats.ownersCount.toLocaleString()} own it</span>
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

  return (
    <div 
      className="rounded-2xl p-6 border"
      style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
    >
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-bold mb-2" style={{ fontFamily: 'Roboto, sans-serif', color: color.text }}>
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                style={starStyle(i < Math.round(stats.averageRating))}
              />
            ))}
          </div>
          <div className="text-xs font-medium" style={{ color: color.textMuted }}>
            {stats.totalReviews.toLocaleString()} reviews
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
          {stats.ownersCount > 0 && (
            <div className="rounded-xl p-4" style={statCardStyle}>
              <Users size={20} style={{ color: color.text }} />
              <div className="text-2xl font-bold mb-1" style={{ color: color.text }}>
                {stats.ownersCount.toLocaleString()}
              </div>
              <div className="text-xs font-medium" style={{ color: color.textMuted }}>Owners</div>
            </div>
          )}
          {stats.wantCount > 0 && (
            <div className="rounded-xl p-4" style={statCardStyle}>
              <Heart size={20} style={{ color: color.text }} />
              <div className="text-2xl font-bold mb-1" style={{ color: color.text }}>
                {stats.wantCount.toLocaleString()}
              </div>
              <div className="text-xs font-medium" style={{ color: color.textMuted }}>Want it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};