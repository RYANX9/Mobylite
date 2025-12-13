// app/components/shared/ReviewSection.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { ThumbsUp, Star, Plus } from 'lucide-react';
import { Review } from '@/lib/types';
import { StarRating } from './StarRating';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { RatingsSummary } from './RatingsSummary';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';

interface ReviewFormProps {
  phoneId: number;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ phoneId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please add a subject');
      return;
    }

    if (!body.trim()) {
      setError('Please write your review');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.reviews.create({
        phone_id: phoneId,
        rating,
        title: title.trim(),
        body: body.trim(),
        is_owner: isOwner,
      });
      
      setTitle('');
      setBody('');
      setRating(5);
      setIsOwner(false);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `2px solid ${color.primary}`,
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
    <div 
      className="rounded-xl p-6 transition-all mb-8"
      style={cardStyle}
    >
      <div className="mb-4">
        <span 
          className="inline-block px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: color.primary, color: color.bg }}
        >
          Write Your Review
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: color.dangerBg }}>
          <p className="text-sm font-semibold" style={{ color: color.danger }}>{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-bold" style={{ color: color.text }}>Rating:</span>
        <StarRating value={rating} onChange={setRating} variant="desktop" />
        <span className="text-xl font-bold" style={{ color: color.text, fontFamily: font.numeric }}>
          {rating.toFixed(1)}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: color.text }}>Subject</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all text-base font-medium"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            placeholder="e.g., Great camera for photography!"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: color.text }}>Your Review</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all min-h-[140px] text-base"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            placeholder="Share your detailed experience with this phone..."
            required
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isOwner}
            onChange={(e) => setIsOwner(e.target.checked)}
            className="w-5 h-5 rounded"
            style={{ accentColor: color.primary }}
          />
          <span className="text-sm font-medium" style={{ color: color.text }}>
            I own this phone
          </span>
        </label>

        <div className="flex gap-3 pt-4">
          <ButtonPressFeedback
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold transition-all text-base"
            style={{ 
              backgroundColor: loading ? color.border : color.text, 
              color: color.bg,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </ButtonPressFeedback>
        </div>
      </div>
    </div>
  );
};

interface ExpandableReviewCardProps {
  review: Review;
  isOwnReview?: boolean;
  onHelpful?: (reviewId: string) => Promise<void>;
  hasVoted?: boolean;
}

const ExpandableReviewCard: React.FC<ExpandableReviewCardProps> = ({
  review,
  isOwnReview = false,
  onHelpful,
  hasVoted = false
}) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [voted, setVoted] = useState(hasVoted);
  
  const [editData, setEditData] = useState({
    rating: review.rating,
    title: review.title,
    body: review.body,
    is_owner: review.is_owner || false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const maxLines = 4;
  const lineHeight = 1.6;
  const maxHeight = maxLines * lineHeight;

  const lines = review.body.split('\n').length;
  const estimatedLines = Math.ceil(review.body.length / 80);
  const needsExpansion = lines > maxLines || estimatedLines > maxLines;

  const handleHelpful = async () => {
    if (!isAuthenticated()) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('returnUrl', currentPath);
      
      if (confirm('Please sign in to vote on reviews. Go to sign in?')) {
        router.push(APP_ROUTES.login);
      }
      return;
    }

    if (onHelpful && !voted && !isOwnReview) {
      await onHelpful(review.id);
      setHelpfulCount(prev => prev + 1);
      setVoted(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim() || !editData.body.trim()) {
      setError('Title and body are required');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      await api.reviews.update(review.id, editData);
      
      review.rating = editData.rating;
      review.title = editData.title;
      review.body = editData.body;
      review.is_owner = editData.is_owner;
      review.edited_at = new Date().toISOString();
      
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      rating: review.rating,
      title: review.title,
      body: review.body,
      is_owner: review.is_owner || false
    });
    setError(null);
    setIsEditing(false);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: isOwnReview ? `2px solid ${color.primary}` : `1px solid ${color.borderLight}`,
  };

  const displayName = review.display_name || `User${review.user_id?.slice(0, 6) || 'Unknown'}`;

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: color.primary,
    boxShadow: `0 0 0 2px ${color.primary}1A`,
  };

  if (isEditing) {
    return (
      <div 
        className="rounded-xl p-6 transition-all"
        style={cardStyle}
      >
        <div className="mb-4">
          <span 
            className="inline-block px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: color.primary, color: color.bg }}
          >
            Editing Your Review
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: color.dangerBg }}>
            <p className="text-sm font-semibold" style={{ color: color.danger }}>{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-bold" style={{ color: color.text }}>Rating:</span>
          <StarRating value={editData.rating} onChange={(val) => setEditData({...editData, rating: val})} variant="desktop" />
          <span className="text-xl font-bold" style={{ color: color.text, fontFamily: font.numeric }}>
            {editData.rating.toFixed(1)}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: color.text }}>Subject</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all text-base font-medium"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: color.text }}>Your Review</label>
            <textarea
              value={editData.body}
              onChange={(e) => setEditData({...editData, body: e.target.value})}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all min-h-[140px] text-base"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editData.is_owner}
              onChange={(e) => setEditData({...editData, is_owner: e.target.checked})}
              className="w-5 h-5 rounded"
              style={{ accentColor: color.primary }}
            />
            <span className="text-sm font-medium" style={{ color: color.text }}>
              I own this phone
            </span>
          </label>

          <div className="flex gap-3">
            <ButtonPressFeedback
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-bold transition-all text-base"
              style={{ 
                backgroundColor: saving ? color.border : color.text, 
                color: color.bg,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </ButtonPressFeedback>
            
            <ButtonPressFeedback
              onClick={handleCancelEdit}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-bold transition-all text-base"
              style={{ 
                backgroundColor: 'transparent',
                color: color.text,
                border: `1px solid ${color.border}`
              }}
            >
              Cancel
            </ButtonPressFeedback>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl p-6 transition-all"
      style={cardStyle}
      onMouseEnter={(e) => !isOwnReview && (e.currentTarget.style.borderColor = color.border)}
      onMouseLeave={(e) => !isOwnReview && (e.currentTarget.style.borderColor = color.borderLight)}
    >
      {isOwnReview && (
        <div className="mb-4 flex items-center justify-between">
          <span 
            className="inline-block px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: color.primary, color: color.bg }}
          >
            Your Review
          </span>
          <ButtonPressFeedback
            onClick={() => setIsEditing(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ 
              backgroundColor: 'transparent',
              color: color.primary,
              border: `1px solid ${color.primary}`
            }}
          >
            Edit
          </ButtonPressFeedback>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: color.primary, color: color.bg }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-base" style={{ color: color.text }}>
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
                ✓ Verified
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
          <p className="text-xs font-medium" style={{ color: color.textMuted }}>
            {new Date(review.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
            {review.edited_at && (
              <span className="ml-2 italic" style={{ color: color.textMuted }}>
                (Edited)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xl font-bold"
            style={{ color: color.text, fontFamily: font.numeric }}
          >
            {review.rating.toFixed(1)}
          </span>
          <Star size={20} fill={color.starFilled} style={{ color: color.starFilled }} />
        </div>
      </div>

      <h4 className="font-bold text-lg mb-3 leading-tight" style={{ color: color.text }}>
        {review.title}
      </h4>

      <div 
        className="mb-4 whitespace-pre-wrap transition-all text-base leading-relaxed"
        style={{ 
          color: color.textMuted,
          maxHeight: isExpanded ? 'none' : `${maxHeight}em`,
          overflow: 'hidden',
          lineHeight: `${lineHeight}em`
        }}
      >
        {review.body}
      </div>

      <div className="flex items-center justify-between pt-3">
        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-bold transition-opacity"
            style={{ color: color.primary }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {isExpanded ? '← Show Less' : 'Read More →'}
          </button>
        )}
        
        {!isOwnReview && onHelpful && (
          <ButtonPressFeedback
            onClick={handleHelpful}
            disabled={voted}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ml-auto"
            style={{ 
              color: voted ? color.success : color.textMuted,
              backgroundColor: voted ? color.successBg : 'transparent',
              border: `1px solid ${voted ? color.success : color.border}`
            }}
            hoverStyle={!voted ? { backgroundColor: color.borderLight } : {}}
          >
            <ThumbsUp size={16} fill={voted ? 'currentColor' : 'none'} />
            <span>Helpful ({helpfulCount})</span>
          </ButtonPressFeedback>
        )}
      </div>
    </div>
  );
};

interface ReviewSectionProps {
  phoneId: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ phoneId }) => {
  const router = useRouter();
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndReviews();
  }, [phoneId]);

  const loadUserAndReviews = async () => {
    setLoading(true);
    
    let currentUserId: string | null = null;
    if (isAuthenticated()) {
      try {
        const meResponse = await api.auth.getMe();
        currentUserId = meResponse?.id || meResponse?.user?.id || null;
        setUserId(currentUserId);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    
    await fetchReviews(currentUserId);
    setLoading(false);
  };

  const fetchReviews = async (currentUserId: string | null = userId) => {
    try {
      const data = await api.reviews.getByPhone(phoneId, 1, 100);
      
      if (data && data.reviews) {
        let allReviews: Review[] = data.reviews;
        
        if (currentUserId) {
          const userRev = allReviews.find((r: Review) => r.user_id === currentUserId);
          setUserReview(userRev || null);
          allReviews = allReviews.filter((r: Review) => r.user_id !== currentUserId);
        }
        
        const sortedReviews = [...allReviews].sort((a, b) => 
          (b.helpful_count || 0) - (a.helpful_count || 0)
        );
        
        setTopReviews(sortedReviews.slice(0, 3));
      }
      
      // Use bundled helpful votes from the same response
      if (data && data.helpful_review_ids && data.helpful_review_ids.length > 0) {
        setHelpfulVotes(new Set(data.helpful_review_ids.map(String)));
      } else {
        setHelpfulVotes(new Set());
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setHelpfulVotes(new Set());
    } finally {
      setShowForm(false);
    }
  };

  const ReviewForm: React.FC<ReviewFormProps> = ({ phoneId, onSuccess }) => {
    const handleSubmit = async (e: React.FormEvent) => {
      await api.reviews.create({
        phone_id: phoneId,
        rating,
        title: title.trim(),
        body: body.trim(),
        is_owner: isOwner,
      });
      onSuccess();
    };
  }
  const handleHelpfulVote = async (reviewId: string) => {
    try {
      await api.reviews.helpful(reviewId);
      setHelpfulVotes(prev => new Set(prev).add(reviewId));
      fetchReviews();
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: color.borderLight }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RatingsSummary phoneId={phoneId} variant="detailed" />

      {isAuthenticated() ? (
        <>
          {userReview ? (
            <ExpandableReviewCard 
              review={userReview} 
              isOwnReview={true}
            />
          ) : (
            <>
              {showForm ? (
                <ReviewForm 
                  phoneId={phoneId} 
                  onSuccess={() => {
                    fetchReviews();
                  }} 
                />
              ) : (
                <ButtonPressFeedback
                  onClick={() => setShowForm(true)}
                  className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ backgroundColor: color.text, color: color.bg }}
                >
                  <Plus size={18} />
                  Write Your Review
                </ButtonPressFeedback>
              )}
            </>
          )}
        </>
      ) : (
        <div 
          className="rounded-2xl p-10 text-center"
          style={{ backgroundColor: color.bgInverse }}
        >
          <h3 
            className="font-bold text-2xl mb-3"
            style={{ fontFamily: font.primary, color: color.textInverse }}
          >
            Share Your Experience
          </h3>
          <p className="mb-6 text-base" style={{ color: color.textInverse, opacity: 0.85 }}>
            Sign in to write a review and help others make informed decisions
          </p>
          <ButtonPressFeedback
            onClick={() => {
              const currentPath = window.location.pathname + window.location.search + window.location.hash;
              sessionStorage.setItem('returnUrl', currentPath);
              router.push(APP_ROUTES.login);
            }}
            className="px-8 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 mx-auto transition-all"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            Sign In to Review
          </ButtonPressFeedback>
        </div>
      )}

      {topReviews.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xl" style={{ color: color.text }}>
              Top Reviews
            </h4>
            <span className="text-sm font-medium" style={{ color: color.textMuted }}>
              Sorted by most helpful
            </span>
          </div>
          
          <div className="space-y-4">
            {topReviews.map((review) => (
              <ExpandableReviewCard 
                key={review.id} 
                review={review}
                onHelpful={handleHelpfulVote}
                hasVoted={helpfulVotes.has(review.id)}
              />
            ))}
          </div>
        </div>
      )}

      {topReviews.length === 0 && !userReview && (
        <div className="text-center py-16 rounded-xl" style={{ backgroundColor: color.borderLight }}>
          <p className="text-lg font-medium mb-2" style={{ color: color.text }}>
            No reviews yet
          </p>
          <p className="text-sm" style={{ color: color.textMuted }}>
            Be the first to share your experience with this phone
          </p>
        </div>
      )}
    </div>
  );
};