class BannerModel {
  final String id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? linkUrl;
  final String? buttonText;
  final int sortOrder;
  final List<BannerImage> images;

  BannerModel({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.linkUrl,
    this.buttonText,
    this.sortOrder = 0,
    this.images = const [],
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      subtitle: json['subtitle'],
      imageUrl: json['image_url'] ?? '',
      linkUrl: json['link_url'],
      buttonText: json['button_text'],
      sortOrder: json['sort_order'] ?? 0,
      images: json['banner_images'] != null
          ? (json['banner_images'] as List)
              .map((i) => BannerImage.fromJson(i))
              .toList()
          : [],
    );
  }
}

class BannerImage {
  final String id;
  final String imageUrl;
  final int sortOrder;

  BannerImage({
    required this.id,
    required this.imageUrl,
    this.sortOrder = 0,
  });

  factory BannerImage.fromJson(Map<String, dynamic> json) {
    return BannerImage(
      id: json['id'].toString(),
      imageUrl: json['image_url'] ?? '',
      sortOrder: json['sort_order'] ?? 0,
    );
  }
}
