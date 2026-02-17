class Order {
  final String id;
  final String orderCode;
  final String status;
  final double subtotal;
  final double discountTotal;
  final double shippingFee;
  final double grandTotal;
  final String customerName;
  final String customerPhone;
  final String shipAddressLine1;
  final String? shipAddressLine2;
  final String shipCity;
  final String shipProvince;
  final String? note;
  final List<OrderItem> items;
  final List<OrderPayment> payments;
  final DateTime? createdAt;

  Order({
    required this.id,
    required this.orderCode,
    required this.status,
    this.subtotal = 0,
    this.discountTotal = 0,
    this.shippingFee = 0,
    this.grandTotal = 0,
    required this.customerName,
    required this.customerPhone,
    required this.shipAddressLine1,
    this.shipAddressLine2,
    required this.shipCity,
    required this.shipProvince,
    this.note,
    this.items = const [],
    this.payments = const [],
    this.createdAt,
  });

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'paid':
        return 'Đã thanh toán';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đang giao';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'].toString(),
      orderCode: json['order_code'] ?? '',
      status: json['status'] ?? 'pending',
      subtotal: _toDouble(json['subtotal']),
      discountTotal: _toDouble(json['discount_total']),
      shippingFee: _toDouble(json['shipping_fee']),
      grandTotal: _toDouble(json['grand_total']),
      customerName: json['customer_name'] ?? '',
      customerPhone: json['customer_phone'] ?? '',
      shipAddressLine1: json['ship_address_line1'] ?? '',
      shipAddressLine2: json['ship_address_line2'],
      shipCity: json['ship_city'] ?? '',
      shipProvince: json['ship_province'] ?? '',
      note: json['note'],
      items: json['order_items'] != null
          ? (json['order_items'] as List)
              .map((i) => OrderItem.fromJson(i))
              .toList()
          : [],
      payments: json['payments'] != null
          ? (json['payments'] as List)
              .map((p) => OrderPayment.fromJson(p))
              .toList()
          : [],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class OrderItem {
  final String id;
  final String name;
  final String sku;
  final String? optionsText;
  final double unitPrice;
  final int qty;
  final double lineTotal;

  OrderItem({
    required this.id,
    required this.name,
    required this.sku,
    this.optionsText,
    required this.unitPrice,
    required this.qty,
    required this.lineTotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      sku: json['sku'] ?? '',
      optionsText: json['options_text'],
      unitPrice: Order._toDouble(json['unit_price']),
      qty: json['qty'] ?? 1,
      lineTotal: Order._toDouble(json['line_total']),
    );
  }
}

class OrderPayment {
  final String id;
  final String method;
  final String status;
  final double amount;

  OrderPayment({
    required this.id,
    required this.method,
    required this.status,
    required this.amount,
  });

  String get methodLabel {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng';
      case 'bank_transfer':
        return 'Chuyển khoản';
      case 'momo':
        return 'MoMo';
      case 'vnpay':
        return 'VNPay';
      default:
        return method;
    }
  }

  factory OrderPayment.fromJson(Map<String, dynamic> json) {
    return OrderPayment(
      id: json['id'].toString(),
      method: json['method'] ?? '',
      status: json['status'] ?? 'pending',
      amount: Order._toDouble(json['amount']),
    );
  }
}
