class Address {
  final String id;
  final String fullName;
  final String phone;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String province;
  final String country;
  final String? postalCode;
  final bool isDefault;
  final String type; // 'Nhà riêng', 'Văn phòng'

  Address({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.province,
    this.country = 'VN',
    this.postalCode,
    this.isDefault = false,
    this.type = 'Nhà riêng',
  });

  String get fullAddress {
    final parts = [addressLine1];
    if (addressLine2 != null && addressLine2!.isNotEmpty) {
      parts.add(addressLine2!);
    }
    parts.addAll([city, province]);
    return parts.join(', ');
  }

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'].toString(),
      fullName: json['full_name'] ?? '',
      phone: json['phone'] ?? '',
      addressLine1: json['address_line1'] ?? '',
      addressLine2: json['address_line2'],
      city: json['city'] ?? '',
      province: json['province'] ?? '',
      country: json['country'] ?? 'VN',
      postalCode: json['postal_code'],
      isDefault: json['is_default'] == true || json['is_default'] == 1,
      type: json['type'] ?? 'Nhà riêng',
    );
  }

  Map<String, dynamic> toJson() => {
        'full_name': fullName,
        'phone': phone,
        'address_line1': addressLine1,
        'address_line2': addressLine2,
        'city': city,
        'province': province,
        'country': country,
        'postal_code': postalCode,
        'is_default': isDefault,
        'type': type,
      };
}
