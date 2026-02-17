class User {
  final String id;
  final String username;
  final String email;
  final String? fullName;
  final String? phone;
  final String? avatarUrl;
  final String role;
  final String status;
  final bool twoFactorEnabled;
  final String? addressLine1;
  final String? addressLine2;
  final String? city;
  final String? province;
  final String? country;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    this.phone,
    this.avatarUrl,
    this.role = 'customer',
    this.status = 'active',
    this.twoFactorEnabled = false,
    this.addressLine1,
    this.addressLine2,
    this.city,
    this.province,
    this.country,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'],
      phone: json['phone'],
      avatarUrl: json['avatar_url'],
      role: json['role'] ?? 'customer',
      status: json['status'] ?? 'active',
      twoFactorEnabled: json['two_factor_enabled'] == true ||
          json['two_factor_enabled'] == 1,
      addressLine1: json['address_line1'],
      addressLine2: json['address_line2'],
      city: json['city'],
      province: json['province'],
      country: json['country'],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'username': username,
        'email': email,
        'full_name': fullName,
        'phone': phone,
        'avatar_url': avatarUrl,
        'address_line1': addressLine1,
        'address_line2': addressLine2,
        'city': city,
        'province': province,
        'country': country,
      };
}
