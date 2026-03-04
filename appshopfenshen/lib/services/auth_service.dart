import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/address.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final res = await _api.post(
        ApiConfig.login,
        data: {'username': username, 'password': password},
      );
      final token = res.data['token'] ?? (res.data['data'] != null ? res.data['data']['token'] : null);
      if (token != null) {
        await _api.setToken(token);
      }
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body != null && body['require_2fa'] == true) {
        return {
          'success': false,
          'require_2fa': true,
          'email': body['email'] ?? '',
        };
      }
      return {
        'success': false,
        'message': body?['error']?['message'] ?? body?['message'] ?? 'Đăng nhập thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> loginWithGoogle(String idToken) async {
    try {
      final res = await _api.post(
        ApiConfig.googleLogin,
        data: {'credential': idToken},
      );
      final data = res.data;
      final token = data['token'] ?? (data['data'] != null ? data['data']['token'] : null);
      if (token != null) {
        await _api.setToken(token);
      }
      return {
        'success': data['success'] ?? true,
        'data': data['data'],
        'message': data['message'],
      };
    } on DioException catch (e) {
      final data = e.response?.data;
      String message = 'Google login failed';
      if (data is Map) {
        message = data['error']?['message'] ?? data['message'] ?? message;
      }
      return {
        'success': false,
        'message': message,
      };
    }
  }

  Future<Map<String, dynamic>> register(Map<String, String> data) async {
    try {
      final res = await _api.post(ApiConfig.register, data: data);
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Đăng ký thất bại',
      };
    }
  }

  Future<User> getMe() async {
    final res = await _api.get(ApiConfig.getMe);
    final data = res.data['data'] ?? res.data['user'] ?? res.data;
    return User.fromJson(data);
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final res = await _api.put(ApiConfig.updateProfile, data: data);
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Cập nhật thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> changePassword(
    String oldPw,
    String newPw,
  ) async {
    try {
      final res = await _api.post(
        ApiConfig.changePassword,
        data: {'old_password': oldPw, 'new_password': newPw},
      );
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final res = await _api.post(
        ApiConfig.forgotPassword,
        data: {'email': email},
      );
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> resetPassword(
    String token,
    String newPassword,
  ) async {
    try {
      final res = await _api.post(
        ApiConfig.resetPassword,
        data: {'token': token, 'new_password': newPassword},
      );
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> verify2FA(String code, String email) async {
    try {
      final res = await _api.post(
        ApiConfig.verify2FA,
        data: {'code': code, 'email': email},
      );
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Mã OTP không đúng',
      };
    }
  }

  Future<List<Address>> getAddresses() async {
    final res = await _api.get(ApiConfig.addresses);
    final list = res.data['data'] ?? [];
    return (list as List)
        .map((e) => Address.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> addAddress(Map<String, dynamic> data) async {
    try {
      final res = await _api.post(ApiConfig.addresses, data: data);
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> updateAddress(
    String id,
    Map<String, dynamic> data,
  ) async {
    try {
      final res = await _api.put(ApiConfig.addressById(id), data: data);
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> deleteAddress(String id) async {
    try {
      final res = await _api.delete(ApiConfig.deleteAddress(id));
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<Map<String, dynamic>> setDefaultAddress(String id) async {
    try {
      final res = await _api.put(ApiConfig.setDefaultAddress(id));
      return {'success': true, ...res.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['error']?['message'] ?? e.response?.data?['message'] ?? 'Thất bại',
      };
    }
  }

  Future<void> logout() async {
    await _api.clearToken();
  }
}
