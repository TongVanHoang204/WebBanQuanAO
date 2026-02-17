class CategoryModel {
  final String id;
  final String? parentId;
  final String name;
  final String slug;
  final bool isActive;
  final int sortOrder;
  final List<CategoryModel> children;

  CategoryModel({
    required this.id,
    this.parentId,
    required this.name,
    required this.slug,
    this.isActive = true,
    this.sortOrder = 0,
    this.children = const [],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'].toString(),
      parentId: json['parent_id']?.toString(),
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      isActive: json['is_active'] == true || json['is_active'] == 1,
      sortOrder: json['sort_order'] ?? 0,
      children: json['children'] != null
          ? (json['children'] as List)
              .map((c) => CategoryModel.fromJson(c))
              .toList()
          : [],
    );
  }
}
