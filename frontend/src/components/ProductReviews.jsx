import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { reviewsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function StarRating({ value, onChange, readonly = false, size = 18 }) {
  return (
    <div className="star-rating" role={readonly ? 'img' : 'group'} aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= value ? 'filled' : ''}`}
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          aria-label={`${star} stars`}
        >
          <Star size={size} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewsApi.getForProduct(productId);
      const list = res.data.reviews || [];
      setReviews(list);
      setAverage(res.data.average_rating || 0);
      setTotal(res.data.total || 0);
      if (user) {
        setHasReviewed(list.some((r) => r.user_id === user.id));
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewsApi.create(productId, { rating, comment: comment.trim() });
      toast.success(t('review_submitted'));
      setComment('');
      setRating(5);
      setHasReviewed(true);
      await loadReviews();
    } catch (err) {
      const msg = err.response?.data?.detail || t('review_error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section className="product-reviews-section" data-testid="product-reviews">
      <div className="product-reviews-header">
        <h2 className="section-title">{t('product_reviews')}</h2>
        {total > 0 && (
          <div className="product-reviews-summary">
            <StarRating value={Math.round(average)} readonly size={20} />
            <span className="reviews-avg">{average.toFixed(1)}</span>
            <span className="reviews-count">
              ({t('reviews_count', { count: total })})
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="reviews-loading">{t('loading')}</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">{t('no_reviews_yet')}</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-card-header">
                <strong>{review.user_name}</strong>
                <StarRating value={review.rating} readonly size={14} />
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
              <time className="review-date">{formatDate(review.created_at)}</time>
            </article>
          ))}
        </div>
      )}

      <div className="review-form-wrap">
        {!user ? (
          <p className="review-login-prompt">
            <Link to="/login">{t('nav_login')}</Link> {t('login_to_review')}
          </p>
        ) : hasReviewed ? (
          <p className="review-already">{t('review_already')}</p>
        ) : (
          <form className="review-form" onSubmit={handleSubmit}>
            <h3>{t('write_review')}</h3>
            <label className="review-label">
              {t('your_rating')}
              <StarRating value={rating} onChange={setRating} size={22} />
            </label>
            <label className="review-label">
              {t('review_comment')}
              <textarea
                className="review-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t('loading') : t('submit_review')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
