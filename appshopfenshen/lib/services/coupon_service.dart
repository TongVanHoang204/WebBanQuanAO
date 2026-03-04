import '../config/api_config.dart';
import 'api_service.dart';

class CouponService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> validateCoupon(String code, double orderTotal) async {
    try {
      final res = await _api.post(ApiConfig.validateCoupon, data: {
        'code': code,
        'order_total': orderTotal,
      });
      return res.data;
    } catch (e) {
      return {'success': false, 'message': 'Mã không hợp lệ'};
    }
  }

  Future<List<Map<String, dynamic>>> getUserCoupons() async {
    try {
      final res = await _api.get(ApiConfig.userCoupons);
      if (res.data['data'] != null) {
        return List<Map<String, dynamic>>.from(res.data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getPublicCoupons() async {
    try {
      final res = await _api.get(ApiConfig.coupons, queryParameters: {'is_public': true});
      if (res.data['data'] != null) {
        return List<Map<String, dynamic>>.from(res.data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
