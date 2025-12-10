'use client';
import React, { useState, useEffect } from 'react';
import { Plus, LogIn } from 'lucide-react';
import { Review } from '@/lib/types';
import { StarRating } from './StarRating';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { ReviewCard } from './ReviewCard';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';

interface ReviewFormProps {
  phoneId: number;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ phoneId, onSuccess }) => {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      if (confirm('Please sign in to write a review. Go to sign in?')) {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('returnUrl', currentPath);
        router.push(APP_ROUTES.login);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.reviews.create({
        phone_id: phoneId,
        rating,
        title,
        body,
        pros: pros.split('\n').filter(p => p.trim()),
        cons: cons.split('\n').filter(c => c.trim()),
      });
      
      onSuccess();
      setTitle('');
      setBody('');
      setPros('');
      setCons('');
      setRating(5);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: color.primary,
    boxShadow: `0 0 0 2px ${color.primary}1A`,
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 border" style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}>
      <h3 className="font-bold mb-4" style={{ color: color.text }}>Write Your Review</h3>
      
      {error && <p className="text-sm mb-4" style={{ color: color.danger }}>{error}</p>}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>Rating</label>
          <StarRating value={rating} onChange={setRating} variant="desktop" />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            placeholder="Great phone for photography!"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>Review</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all min-h-[120px]"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            placeholder="Share your experience with this phone..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>Pros (one per line)</label>
            <textarea
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all text-sm min-h-[80px]"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              placeholder="Great camera\nLong battery life"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>Cons (one per line)</label>
            <textarea
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all text-sm min-h-[80px]"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              placeholder="Expensive\nNo charger included"
            />
          </div>
        </div>

        <ButtonPressFeedback
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold transition-all"
          style={{ 
            backgroundColor: color.text, 
            color: color.bg,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </ButtonPressFeedback>
      </div>
    </form>
  );
};

interface ReviewSectionProps {
  phoneId: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ phoneId }) => {
  const router = useRouter();
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [phoneId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const data = await api.reviews.getByPhone(phoneId, 1, 10); // First page, 10 reviews
      
      if (data.success && data.reviews) {
        const allReviews: Review[] = data.reviews;
        
        if (isAuthenticated()) {
          try {
            const meResponse = await api.auth.getMe();
            if (meResponse.success) {
              const userId = meResponse.user.id;
              const userRev = allReviews.find((r: Review) => r.user_id === userId);
              setUserReview(userRev || null);
              setReviewsList(allReviews.filter((r: Review) => r.user_id !== userId));
              return;
            }
          } catch (err) {
            console.error('Failed to fetch user:', err);
          }
        }
        
        setReviewsList(allReviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!isAuthenticated()) {
      if (confirm('Please sign in to vote on reviews. Go to sign in?')) {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('returnUrl', currentPath);
        router.push(APP_ROUTES.login);
      }
      return;
    }

    try {
      await api.reviews.helpful(reviewId); // Assuming this method exists in lib/api.ts reviews section
      fetchReviews();
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: color.borderLight }} />
        ))}
      </div>
    );
  }

  const authBannerStyle: React.CSSProperties = {
    backgroundColor: color.bgInverse,
  };

  return (
    <div className="space-y-4">
      {userReview && (
        <div className="rounded-2xl p-4 border-2" style={{ backgroundColor: color.borderLight, borderColor: color.primary }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: color.borderLight, color: color.text }}>
              Your Review
            </span>
          </div>
          <ReviewCard review={userReview} onHelpful={handleHelpfulVote} />
        </div>
      )}

      {!userReview && (
        <div className="rounded-2xl p-6 text-white" style={authBannerStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ fontFamily: font.primary }}>Share Your Experience</h3>
            {!isAuthenticated() ? (
              <ButtonPressFeedback
                onClick={() => {
                  const currentPath = window.location.pathname + window.location.search;
                  sessionStorage.setItem('returnUrl', currentPath);
                  router.push(APP_ROUTES.login);
                }}
                className="px-4 py-2 rounded-xl font-bold flex items-center gap-2"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                <LogIn size={16} />
                Sign In to Review
              </ButtonPressFeedback>
            ) : (
              <ButtonPressFeedback
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-xl font-bold flex items-center gap-2"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                <Plus size={16} />
                Write Review
              </ButtonPressFeedback>
            )}
          </div>
          {showForm && <ReviewForm phoneId={phoneId} onSuccess={() => {
            setShowForm(false);
            fetchReviews();
          }} />}
        </div>
      )}

      {reviewsList.length > 0 ? (
        <div className="space-y-4">
          {reviewsList.map((review) => (
            <ReviewCard key={review.id} review={review} onHelpful={handleHelpfulVote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p style={{ color: color.textMuted }}>
            No reviews yet. {isAuthenticated() ? 'Be the first to review!' : 'Sign in to write the first review.'}
          </p>
        </div>
      )}
    </div>
  );
};