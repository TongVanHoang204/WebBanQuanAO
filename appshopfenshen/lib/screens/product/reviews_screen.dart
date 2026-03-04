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
    if (_loading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF7F19E6))),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12.0),
          child: Center(
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFF0E6FF), // Light purple bg
                shape: BoxShape.circle,
              ),
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.arrow_back, color: Colors.grey, size: 20),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ),
        ),
        title: const Text(
          'Đánh giá',
          style: TextStyle(
            color: Color(0xFF140E1B),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFF0E6FF),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.share, color: Color(0xFF7F19E6), size: 18),
                  onPressed: () {},
                ),
              ),
            ),
          ),
        ],
      ),
      body: _reviews.isEmpty ? _buildEmpty() : _buildContent(),
      floatingActionButton: FloatingActionButton(
        onPressed: _showWriteReview,
        backgroundColor: const Color(0xFF7F19E6),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.rate_review_outlined, size: 60, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('Chưa có đánh giá nào', style: TextStyle(color: Colors.grey, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: Column(
              children: [
                _buildTopSummaryCard(),
                const SizedBox(height: 24),
                _buildFilterChips(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final review = _reviews[index];
              return Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                child: _buildReviewCard(review),
              );
            },
            childCount: _reviews.length,
          ),
        ),
      ],
    );
  }

  Widget _buildTopSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F6FF), // Soft lavender bg
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          // Left Side: Big Number & Stars
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _average.toStringAsFixed(1),
                style: const TextStyle(
                  color: Color(0xFF7F19E6),
                  fontSize: 48,
                  fontWeight: FontWeight.w800,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 8),
              RatingBarIndicator(
                rating: _average,
                itemBuilder: (_, __) => const Icon(Icons.star, color: Color(0xFF7F19E6)),
                itemCount: 5,
                itemSize: 14,
              ),
              const SizedBox(height: 8),
              Text(
                'Dựa trên ${_totalFormatted()} đánh giá',
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(width: 32),
          // Right Side: Progress Bars
          Expanded(
            child: Column(
              children: [5, 4, 3, 2, 1].map((star) {
                final count = _distribution['$star'] ?? 0;
                final percent = _total > 0 ? count / _total : 0.0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Text(
                        '$star',
                        style: const TextStyle(
                          color: Color(0xFF140E1B),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: percent,
                            backgroundColor: const Color(0xFFEBE1F8),
                            valueColor: const AlwaysStoppedAnimation(Color(0xFF7F19E6)),
                            minHeight: 6,
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

  String _totalFormatted() {
    if (_total >= 1000) {
      return '${(_total / 1000).toStringAsFixed(1)}k'.replaceAll('.0k', 'k');
    }
    return _total.toString();
  }

  Widget _buildFilterChips() {
    final filters = ['Tất cả', 'Có hình ảnh', '5 Sao', '4 Sao'];
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final isSelected = index == 0; // Hardcoded 'All' as selected for UI mockup
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF7F19E6) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? const Color(0xFF7F19E6) : Colors.grey.shade300,
                width: 1,
              ),
            ),
            child: Center(
              child: Text(
                filters[index],
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF140E1B),
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReviewCard(Review review) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: const Color(0xFFD4AF37).withAlpha(38), // ~0.15 opacity
              child: Text(
                (review.authorName ?? 'A').isNotEmpty ? (review.authorName ?? 'A').substring(0, 1).toUpperCase() : 'A',
                style: const TextStyle(
                  color: Color(0xFF7F19E6),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    review.authorName ?? 'Ẩn danh',
                    style: const TextStyle(
                      color: Color(0xFF140E1B),
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  if (review.isVerified || review.status == 'approved') // Fake verified based on status just for UI
                    Row(
                      children: [
                        const Icon(Icons.verified, color: Color(0xFF7F19E6), size: 12),
                        const SizedBox(width: 4),
                        const Text(
                          'ĐÃ MUA HÀNG',
                          style: TextStyle(
                            color: Color(0xFF7F19E6),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            Text(
              _formatTimeAgo(review.createdAt ?? DateTime.now()),
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 11,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Stars
        RatingBarIndicator(
          rating: review.rating.toDouble(),
          itemBuilder: (_, __) => const Icon(Icons.star, color: Color(0xFF7F19E6)),
          itemCount: 5,
          itemSize: 14,
        ),
        const SizedBox(height: 12),
        // Content
        if (review.content?.isNotEmpty == true) ...[
          Text(
            review.content!,
            style: const TextStyle(
              color: Color(0xFF4A4A4A),
              fontSize: 13,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
        ],
        // Footer: Helpful / Reply
        Row(
          children: [
            Icon(Icons.thumb_up_alt_rounded, size: 14, color: Colors.grey.shade500),
            const SizedBox(width: 6),
            Text(
              'Hữu ích (${review.helpfulCount > 0 ? review.helpfulCount : "0"})', // Fixed fallback to 0
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w500),
            ),
            const SizedBox(width: 24),
            Icon(Icons.chat_bubble_rounded, size: 14, color: Colors.grey.shade500),
            const SizedBox(width: 6),
            Text(
              'Phản hồi',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Divider(color: Colors.grey.shade200, height: 1),
      ],
    );
  }

  String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays > 14) return '2 tuần trước';
    if (diff.inDays > 7) return '1 tuần trước';
    if (diff.inDays > 1) return '${diff.inDays} ngày trước';
    if (diff.inDays == 1) return 'Hôm qua';
    if (diff.inHours > 0) return '${diff.inHours} giờ trước';
    if (diff.inMinutes > 0) return '${diff.inMinutes} phút trước';
    return 'Vừa xong';
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
      backgroundColor: Colors.white,
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
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Viết đánh giá',
                style: TextStyle(
                  color: Color(0xFF140E1B),
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
                  unratedColor: Colors.grey.shade200,
                  itemBuilder: (_, __) =>
                      const Icon(Icons.star, color: Color(0xFF7F19E6)),
                  onRatingUpdate: (val) => rating = val,
                ),
              ),
              const SizedBox(height: 16),

              // Title
              TextField(
                controller: titleCtrl,
                style: const TextStyle(color: Color(0xFF140E1B)),
                decoration: const InputDecoration(
                  hintText: 'Tiêu đề (tùy chọn)',
                  hintStyle: TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: Color(0xFFF9F6FF),
                  border: OutlineInputBorder(borderSide: BorderSide.none, borderRadius: BorderRadius.all(Radius.circular(12))),
                ),
              ),
              const SizedBox(height: 12),

              // Content
              TextField(
                controller: contentCtrl,
                style: const TextStyle(color: Color(0xFF140E1B)),
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Nhận xét của bạn...',
                  hintStyle: TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: Color(0xFFF9F6FF),
                  border: OutlineInputBorder(borderSide: BorderSide.none, borderRadius: BorderRadius.all(Radius.circular(12))),
                ),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 52,
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
                    backgroundColor: const Color(0xFF7F19E6),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Gửi đánh giá',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
