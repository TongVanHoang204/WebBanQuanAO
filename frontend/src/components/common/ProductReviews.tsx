import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Image as ImageIcon, ThumbsUp, X } from 'lucide-react';
import { reviewsAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  user_name: string;
  user_avatar: string | null;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  images: string[];
}

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');

  // Load liked reviews from local storage once on mount
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('liked_reviews');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await reviewsAPI.getByProduct(productId, {
        page: pageNumber,
        limit: 5,
        rating: selectedRatingFilter || undefined,
        has_images: showOnlyWithImages ? 'true' : undefined,
        sort: sortBy
      });
      if (response.data.success) {
        setReviews((prev) =>
          pageNumber === 1 ? response.data.data.reviews : [...prev, ...response.data.data.reviews]
        );
        setStats(response.data.data.stats);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setReviews([]);
  }, [productId, selectedRatingFilter, showOnlyWithImages, sortBy]);

  useEffect(() => {
    fetchReviews(page);
  }, [page, productId, selectedRatingFilter, showOnlyWithImages, sortBy]);

  const handleHelpful = async (reviewId: string) => {
    if (likedReviews[reviewId]) {
      toast.error('Bạn đã đánh giá hữu ích cho bình luận này rồi');
      return;
    }
    
    try {
      const response = await reviewsAPI.markHelpful(reviewId);
      const helpfulCount = response.data?.data?.helpful_count;

      // Update state and local storage to prevent duplicate clicks
      setLikedReviews(prev => {
        const next = { ...prev, [reviewId]: true };
        localStorage.setItem('liked_reviews', JSON.stringify(next));
        return next;
      });

      setReviews(prev => prev.map(review => (
        review.id === reviewId
          ? { ...review, helpful_count: typeof helpfulCount === 'number' ? helpfulCount : review.helpful_count + 1 }
          : review
      )));
      toast.success('Cảm ơn bạn đã đánh giá hữu ích');
    } catch (error) {
      toast.error('Không thể cập nhật đánh giá hữu ích');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 3) {
        toast.error('Bạn chỉ có thể tải lên tối đa 3 ảnh');
        return;
      }
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);
      setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi đánh giá');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        const uploadRes = await uploadAPI.multiple(selectedFiles);
        if (uploadRes.data.success) {
          imageUrls = uploadRes.data.urls;
        }
      }

      const response = await reviewsAPI.create({
        product_id: parseInt(productId),
        rating,
        title,
        content,
        images: imageUrls
      });

      if (response.data.success) {
        toast.success(response.data.message);
        if (response.data.data.points_awarded) {
          toast.success(`Bạn nhận được ${response.data.data.points_awarded} điểm thưởng!`, { icon: '🎁' });
        }
        setShowForm(false);
        setRating(5);
        setTitle('');
        setContent('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setPage(1);
        fetchReviews(1); // Refresh reviews
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && reviews.length === 0) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg dark:bg-gray-800"></div>;
  }

  return (
    <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đánh giá khách hàng</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(stats.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                />
              ))}
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.average_rating}</span>
            <span className="text-sm text-gray-500">Dựa trên {stats.total_reviews} đánh giá</span>
          </div>
        </div>
        
        {isAuthenticated ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Hủy đánh giá' : 'Viết đánh giá'}
          </button>
        ) : (
          <p className="text-sm text-gray-500">Đăng nhập để viết đánh giá.</p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedRatingFilter ?? ''}
          onChange={(e) => setSelectedRatingFilter(e.target.value ? Number(e.target.value) : null)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option value="">Tất cả số sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest' | 'lowest' | 'helpful')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option value="newest">Mới nhất</option>
          <option value="highest">Điểm cao nhất</option>
          <option value="lowest">Điểm thấp nhất</option>
          <option value="helpful">Hữu ích nhất</option>
        </select>

        <button
          onClick={() => setShowOnlyWithImages(v => !v)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            showOnlyWithImages
              ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
              : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
          }`}
        >
          Chỉ hiện đánh giá có ảnh
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm đánh giá</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tóm tắt trải nghiệm của bạn (không bắt buộc)"
              className="input text-gray-900 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội dung đánh giá</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn thích hoặc chưa hài lòng điều gì? Form mặc có vừa không?"
              rows={4}
              className="input text-gray-900 dark:text-white resize-none"
              required
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thêm ảnh (tối đa 3) <span className="text-primary-600 dark:text-primary-400 font-medium ml-1">+50 điểm!</span>
            </label>
            <div className="flex flex-wrap gap-4 items-start">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {selectedFiles.length < 3 && (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-white dark:bg-gray-800">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Tải lên</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              Hủy
            </button>
            <button type="submit" disabled={submitting || !content} className="btn btn-primary">
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {review.user_avatar ? (
                      <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                        {review.user_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {review.user_name}
                      {review.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Đã mua hàng
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200 dark:text-gray-700'}`}
                    />
                  ))}
                </div>
              </div>
              
              {review.title && <h5 className="font-semibold text-gray-900 dark:text-white mt-3 mb-1">{review.title}</h5>}
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-2">{review.content}</p>
              
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {review.images.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={img} alt="Review" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Hữu ích ({review.helpful_count})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {page < totalPages && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Xem thêm đánh giá'}
          </button>
        </div>
      )}
      
    </div>
  );
};
