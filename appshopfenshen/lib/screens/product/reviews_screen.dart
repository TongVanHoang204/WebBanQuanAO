import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:provider/provider.dart';
import '../../models/review.dart';
import '../../services/product_service.dart';
import '../../providers/auth_provider.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key});

  @override
  State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  final _productService = ProductService();
  List<Review> _reviews = [];
  bool _loading = true;
  String _productId = '';
  String _productName = '';
  double _average = 0;
  int _total = 0;
  Map<String, int> _distribution = {};
  String _sort = 'newest';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_productId.isEmpty) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map<String, dynamic>) {
        _productId = args['productId']?.toString() ?? '';
        _productName = args['productName']?.toString() ?? '';
      }
      if (_productId.isNotEmpty) _loadReviews();
    }
  }

  Future<void> _loadReviews() async {
    setState(() => _loading = true);
    try {
      final reviews = await _productService.getProductReviews(_productId);
      if (mounted) {
        // Calculate stats
        final total = reviews.length;
        double avg = 0;
        final dist = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0};
        for (final r in reviews) {
          avg += r.rating;
          dist['${r.rating}'] = (dist['${r.rating}'] ?? 0) + 1;
        }
        if (total > 0) avg /= total;

        // Sort
        reviews.sort((a, b) {
          switch (_sort) {
            case 'highest':
              return b.rating.compareTo(a.rating);
            case 'lowest':
              return a.rating.compareTo(b.rating);
            default: // newest
              return (b.createdAt ?? DateTime(2000)).compareTo(
                a.createdAt ?? DateTime(2000),
              );
          }
        });

        setState(() {
          _reviews = reviews;
          _average = avg;
          _total = total;
          _distribution = dist;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(
          'Đánh giá${_productName.isNotEmpty ? ' - $_productName' : ''}',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort, color: Colors.white70, size: 22),
            color: const Color(0xFF1A1A1A),
            onSelected: (val) {
              _sort = val;
              _loadReviews();
            },
            itemBuilder: (_) => [
              _sortMenuItem('newest', 'Mới nhất'),
              _sortMenuItem('highest', 'Đánh giá cao nhất'),
              _sortMenuItem('lowest', 'Đánh giá thấp nhất'),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFD4AF37)),
            )
          : _reviews.isEmpty
          ? _buildEmpty()
          : _buildContent(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showWriteReview,
        backgroundColor: const Color(0xFFD4AF37),
        icon: const Icon(Icons.edit, color: Colors.black, size: 20),
        label: const Text(
          'Viết đánh giá',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  PopupMenuItem<String> _sortMenuItem(String value, String label) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          if (_sort == value)
            const Icon(Icons.check, color: Color(0xFFD4AF37), size: 16)
          else
            const SizedBox(width: 16),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.rate_review_outlined,
            size: 60,
            color: Colors.white.withValues(alpha: 0.1),
          ),
          const SizedBox(height: 16),
          Text(
            'Chưa có đánh giá',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
          ),
          const SizedBox(height: 8),
          Text(
            'Hãy là người đầu tiên nhận xét!',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.3),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stats card
        _buildStatsCard(),
        const SizedBox(height: 16),

        // Review list
        Text(
          '${_reviews.length} đánh giá',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 12),
        ...(_reviews.map((r) => _buildReviewCard(r))),
        const SizedBox(height: 80), // FAB space
      ],
    );
  }

  Widget _buildStatsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          // Average
          Column(
            children: [
              Text(
                _average.toStringAsFixed(1),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                ),
              ),
              RatingBarIndicator(
                rating: _average,
                itemBuilder: (_, __) =>
                    const Icon(Icons.star, color: Color(0xFFD4AF37)),
                itemCount: 5,
                itemSize: 16,
              ),
              const SizedBox(height: 4),
              Text(
                '$_total đánh giá',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(width: 24),
          // Distribution
          Expanded(
            child: Column(
              children: [5, 4, 3, 2, 1].map((star) {
                final count = _distribution['$star'] ?? 0;
                final percent = _total > 0 ? count / _total : 0.0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      Text(
                        '$star',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.star,
                        color: Color(0xFFD4AF37),
                        size: 12,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: percent,
                            backgroundColor: Colors.white.withValues(
                              alpha: 0.06,
                            ),
                            valueColor: const AlwaysStoppedAnimation(
                              Color(0xFFD4AF37),
                            ),
                            minHeight: 6,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 24,
                        child: Text(
                          '$count',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Review review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: const Color(
                  0xFFD4AF37,
                ).withValues(alpha: 0.15),
                child: Text(
                  (review.authorName ?? 'A').substring(0, 1).toUpperCase(),
                  style: const TextStyle(
                    color: Color(0xFFD4AF37),
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          review.authorName ?? 'Ẩn danh',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (review.isVerified) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.verified,
                                  color: Colors.green,
                                  size: 10,
                                ),
                                SizedBox(width: 2),
                                Text(
                                  'Đã mua',
                                  style: TextStyle(
                                    color: Colors.green,
                                    fontSize: 9,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (review.createdAt != null)
                      Text(
                        _formatDate(review.createdAt!),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.3),
                          fontSize: 11,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          RatingBarIndicator(
            rating: review.rating.toDouble(),
            itemBuilder: (_, __) =>
                const Icon(Icons.star, color: Color(0xFFD4AF37)),
            itemCount: 5,
            itemSize: 16,
          ),
          if (review.title != null && review.title!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.title!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          if (review.content != null && review.content!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              review.content!,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
          if (review.helpfulCount > 0) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.thumb_up_outlined,
                  size: 12,
                  color: Colors.white.withValues(alpha: 0.3),
                ),
                const SizedBox(width: 4),
                Text(
                  '${review.helpfulCount} hữu ích',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _showWriteReview() {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập để viết đánh giá')),
      );
      return;
    }

    double rating = 5;
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Viết đánh giá',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Rating
              Center(
                child: RatingBar.builder(
                  initialRating: rating,
                  minRating: 1,
                  allowHalfRating: false,
                  itemCount: 5,
                  itemSize: 36,
                  unratedColor: Colors.white.withValues(alpha: 0.1),
                  itemBuilder: (_, __) =>
                      const Icon(Icons.star, color: Color(0xFFD4AF37)),
                  onRatingUpdate: (val) => rating = val,
                ),
              ),
              const SizedBox(height: 16),

              // Title
              TextField(
                controller: titleCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Tiêu đề (tùy chọn)',
                  hintStyle: TextStyle(color: Colors.grey),
                ),
              ),
              const SizedBox(height: 12),

              // Content
              TextField(
                controller: contentCtrl,
                style: const TextStyle(color: Colors.white),
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Nhận xét của bạn...',
                  hintStyle: TextStyle(color: Colors.grey),
                ),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          if (contentCtrl.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Vui lòng nhập nội dung đánh giá',
                                ),
                              ),
                            );
                            return;
                          }
                          setSheetState(() => submitting = true);
                          try {
                            final review = Review(
                              id: '',
                              productId: _productId,
                              rating: rating.toInt(),
                              title: titleCtrl.text.trim().isNotEmpty
                                  ? titleCtrl.text.trim()
                                  : null,
                              content: contentCtrl.text.trim(),
                              authorName:
                                  auth.user?.fullName ?? auth.user?.username,
                              status: 'pending',
                              isVerified: false,
                              helpfulCount: 0,
                            );
                            await _productService.createReview(review);
                            if (ctx.mounted) Navigator.of(ctx).pop();
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Đánh giá đã được gửi! Sẽ hiển thị sau khi duyệt.',
                                  ),
                                  backgroundColor: Color(0xFF2E7D32),
                                ),
                              );
                              _loadReviews();
                            }
                          } catch (e) {
                            setSheetState(() => submitting = false);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Lỗi: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD4AF37),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.black,
                          ),
                        )
                      : const Text(
                          'Gửi đánh giá',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }
}
