import '../config/api_config.dart';
import '../models/user.dart';
import '../models/address.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> login(String username, String password) async {
    final res = await _api.post(ApiConfig.login, data: {
      'username': username,
      'password': password,
    });
    return res.data;
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    String? fullName,
  }) async {
    final res = await _api.post(ApiConfig.register, data: {
      'username': username,
      'email': email,
      'password': password,
      'full_name': fullName,
    });
    return res.data;
  }

  Future<User?> getMe() async {
    final res = await _api.get(ApiConfig.getMe);
    if (res.data['success'] == true) {
      return User.fromJson(res.data['data']);
    }
    return null;
  }

  Future<Map<String, dynamic>> updateProfile(
      Map<String, dynamic> data) async {
    final res = await _api.put(ApiConfig.updateProfile, data: data);
    return res.data;
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await _api.put(ApiConfig.changePassword, data: {
      'current_password': currentPassword,
      'new_password': newPassword,
    });
    return res.data;
  }

  // Address management
  Future<List<Address>> getAddresses() async {
    final res = await _api.get(ApiConfig.addresses);
    if (res.data['success'] == true) {
      return (res.data['data'] as List)
          .map((a) => Address.fromJson(a))
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> addAddress(Address address) async {
    final res = await _api.post(ApiConfig.addresses, data: address.toJson());
    return res.data;
  }

  Future<Map<String, dynamic>> updateAddress(
      String id, Address address) async {
    final res =
        await _api.put('${ApiConfig.addresses}/$id', data: address.toJson());
    return res.data;
  }

  Future<Map<String, dynamic>> deleteAddress(String id) async {
    final res = await _api.delete('${ApiConfig.addresses}/$id');
    return res.data;
  }

  Future<Map<String, dynamic>> setDefaultAddress(String id) async {
    final res = await _api.put('${ApiConfig.addresses}/$id/default');
    return res.data;
  }

  // 2FA
  Future<Map<String, dynamic>> verify2FA(String otp, String email) async {
    final res = await _api.post(ApiConfig.verify2FA, data: {
      'otp': otp,
      'email': email,
    });
    return res.data;
  }
}
