import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reviewsAPI } from '../../services/api';
import { Star, ThumbsUp, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  is_verified: boolean;
  helpful_count: number;
}

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await reviewsAPI.getByProduct(productId);
      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        setStats(response.data.data.stats);
        setRequiresLogin(!!response.data.data.requiresLogin);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated && !authorName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create({
        product_id: productId,
        rating,
        title,
        content,
        author_name: isAuthenticated ? user?.full_name || user?.username : authorName
      });
      toast.success('Gửi đánh giá thành công! Đánh giá sẽ được hiển thị sau khi duyệt.');
      setShowForm(false);
      setTitle('');
      setContent('');
      setAuthorName('');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const maskName = (name: string) => {
    if (!name) return 'Người dùng';
    if (name.length <= 1) return name + '**';
    if (name.length === 2) return name.charAt(0) + '*';
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
  };

  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // Load liked reviews from local storage
  useEffect(() => {
    const storedLikes = localStorage.getItem('likedReviews');
    if (storedLikes) {
      setLikedReviews(new Set(JSON.parse(storedLikes)));
    }
  }, []);

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích đánh giá');
      return;
    }

    const isLiked = likedReviews.has(reviewId);
    
    // Optimistic update
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, helpful_count: r.helpful_count + (isLiked ? -1 : 1) } : r
    ));
    
    setLikedReviews(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(reviewId);
      else newSet.add(reviewId);
      
      localStorage.setItem('likedReviews', JSON.stringify([...newSet]));
      return newSet;
    });

    try {
      if (isLiked) {
        await reviewsAPI.unmarkHelpful(reviewId);
      } else {
        await reviewsAPI.markHelpful(reviewId);
      }
    } catch (error) {
      // Revert if failed
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + (isLiked ? 1 : -1) } : r
      ));
      setLikedReviews(prev => {
          const newSet = new Set(prev);
          if (isLiked) newSet.add(reviewId);
          else newSet.delete(reviewId);
          localStorage.setItem('likedReviews', JSON.stringify([...newSet]));
          return newSet;
      });
      console.error('Failed to toggle helpful:', error);
    }
  };

  if (loading) return <div className="py-8 text-center">Đang tải đánh giá...</div>;

  return (
    <div className="mt-12 pt-8 border-t border-secondary-100 dark:border-secondary-800">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Stats */}
        <div className="md:w-1/3">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Đánh giá khách hàng</h2>
          
          {requiresLogin ? (
            <div className="bg-secondary-50 dark:bg-secondary-800/50 p-8 rounded-xl border border-dashed border-secondary-300 dark:border-secondary-600 text-center">
               <p className="text-secondary-600 dark:text-secondary-400 mb-4 font-medium">Vui lòng đăng nhập để xem đánh giá sản phẩm</p>
               <button 
                  onClick={() => window.location.href = '/login'}
                  className="btn btn-primary btn-sm rounded-full"
               >
                  Đăng nhập ngay
               </button>
            </div>
          ) : stats && (
            <>
              <div className="bg-secondary-50 dark:bg-secondary-800/50 p-6 rounded-xl border border-secondary-100 dark:border-secondary-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl font-bold text-secondary-900 dark:text-white">
                    {Number(stats.average).toFixed(1)}
                  </div>
                  <div>
                    <div className="flex text-yellow-400 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(stats.average) ? 'fill-current' : 'text-secondary-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-secondary-500 dark:text-secondary-400 text-sm">{stats.total} đánh giá</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-secondary-600 dark:text-secondary-400">{star}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <div className="flex-1 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400"
                          style={{ 
                            width: `${stats.total > 0 ? ((stats.distribution[star] || 0) / stats.total) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs text-secondary-500 dark:text-secondary-400">
                        {stats.total > 0 ? Math.round(((stats.distribution[star] || 0) / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full btn btn-primary rounded-full mt-4"
              >
                Viết đánh giá
              </button>
            </>
          )}
        </div>

        {/* Review List & Form */}
        <div className="flex-1">
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700 mb-8 animate-fade-in shadow-xl">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Viết đánh giá của bạn</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Đánh giá chung</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-secondary-300'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 pl-2">Tên hiển thị *</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 pl-2">Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Ví dụ: Sản phẩm rất tốt"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 pl-2">Nội dung đánh giá *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input !rounded-2xl px-4 py-3"
                  rows={4}
                  required
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-secondary-500 dark:text-secondary-400 text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-secondary-100 dark:border-secondary-800 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-900 dark:text-white">{maskName(review.author_name)}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex text-yellow-400 text-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-secondary-300'}`}
                              />
                            ))}
                          </div>
                          {review.is_verified && (
                            <span className="text-xs text-accent-green font-medium flex items-center gap-1">
                              • Đã mua hàng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-secondary-500 dark:text-secondary-400">
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {review.title && <h4 className="font-semibold mb-1 dark:text-white">{review.title}</h4>}
                  <p className="text-secondary-600 dark:text-secondary-400 mb-3">{review.content}</p>
                  
                  <button 
                    onClick={() => handleHelpful(review.id)}
                    className={`flex items-center gap-1 text-sm ${likedReviews.has(review.id) ? 'text-primary-600 font-medium' : 'text-secondary-500 hover:text-primary-600'}`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${likedReviews.has(review.id) ? 'fill-current' : ''}`} />
                    Hữu ích ({review.helpful_count})
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
