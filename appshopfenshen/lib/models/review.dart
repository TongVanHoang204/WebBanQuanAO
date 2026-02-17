class Review {
  final String id;
  final String productId;
  final int rating;
  final String? title;
  final String? content;
  final String? authorName;
  final String status;
  final bool isVerified;
  final int helpfulCount;
  final DateTime? createdAt;

  Review({
    required this.id,
    required this.productId,
    required this.rating,
    this.title,
    this.content,
    this.authorName,
    this.status = 'approved',
    this.isVerified = false,
    this.helpfulCount = 0,
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'].toString(),
      productId: json['product_id'].toString(),
      rating: json['rating'] ?? 5,
      title: json['title'],
      content: json['content'],
      authorName: json['author_name'],
      status: json['status'] ?? 'approved',
      isVerified: json['is_verified'] == true || json['is_verified'] == 1,
      helpfulCount: json['helpful_count'] ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'product_id': int.tryParse(productId) ?? productId,
        'rating': rating,
        'title': title,
        'content': content,
        'author_name': authorName,
      };
}
