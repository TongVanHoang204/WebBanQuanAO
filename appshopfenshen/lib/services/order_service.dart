import '../config/api_config.dart';
import '../models/order.dart';
import 'api_service.dart';

class OrderService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> checkout({
    required String customerName,
    required String customerPhone,
    required String addressLine1,
    String? addressLine2,
    required String city,
    required String province,
    required String paymentMethod,
    String? note,
    String? couponCode,
    String? shippingMethodId,
  }) async {
    final res = await _api.post(ApiConfig.checkout, data: {
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'ship_address_line1': addressLine1,
      'ship_address_line2': addressLine2,
      'ship_city': city,
      'ship_province': province,
      'payment_method': paymentMethod,
      'note': note,
      'coupon_code': couponCode,
      'shipping_method_id': shippingMethodId,
    });
    return res.data;
  }

  Future<List<Order>> getOrders({int page = 1, int limit = 10}) async {
    final res = await _api.get(ApiConfig.orders, queryParameters: {
      'page': page,
      'limit': limit,
    });
    if (res.data['data'] != null) {
      final ordersData = res.data['data'];
      if (ordersData is List) {
        return ordersData.map((o) => Order.fromJson(o)).toList();
      }
      if (ordersData is Map && ordersData['orders'] != null) {
        return (ordersData['orders'] as List)
            .map((o) => Order.fromJson(o))
            .toList();
      }
    }
    return [];
  }

  Future<Order?> getOrderById(String id) async {
    final res = await _api.get(ApiConfig.orderById(id));
    if (res.data['data'] != null) {
      return Order.fromJson(res.data['data']);
    }
    return null;
  }

  Future<Order?> getOrderByCode(String code) async {
    final res = await _api.get(ApiConfig.orderByCode(code));
    if (res.data['data'] != null) {
      return Order.fromJson(res.data['data']);
    }
    return null;
  }

  Future<Map<String, dynamic>> cancelOrder(String id) async {
    final res = await _api.post(ApiConfig.cancelOrder(id));
    return res.data;
  }

  Future<Map<String, dynamic>> calculateShipping({
    required String province,
    required double totalWeight,
  }) async {
    final res = await _api.post(ApiConfig.calculateShipping, data: {
      'province': province,
      'total_weight': totalWeight,
    });
    return res.data;
  }
}
