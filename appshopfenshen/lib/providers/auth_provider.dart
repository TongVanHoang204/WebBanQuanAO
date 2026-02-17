import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/cart_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  final CartService _cartService = CartService();

  User? _user;
  bool _isLoading = false;
  String? _error;
  String? _pending2FAEmail;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null && _apiService.isAuthenticated;
  String? get error => _error;
  String? get pending2FAEmail => _pending2FAEmail;

  Future<bool> tryAutoLogin() async {
    if (!_apiService.isAuthenticated) return false;
    try {
      _isLoading = true;
      notifyListeners();
      _user = await _authService.getMe();
      _isLoading = false;
      notifyListeners();
      return _user != null;
    } catch (e) {
      _isLoading = false;
      await _apiService.clearToken();
      notifyListeners();
      return false;
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final res = await _authService.login(username, password);

      if (res['success'] == true) {
        // Check if 2FA is required
        if (res['require_2fa'] == true) {
          _pending2FAEmail = res['email'] ?? '';
          _isLoading = false;
          _error = '2FA_REQUIRED';
          notifyListeners();
          return {
            'success': false,
            'require_2fa': true,
            'email': _pending2FAEmail,
          };
        }

        final token = res['token'] ?? res['data']?['token'];
        if (token != null) {
          await _apiService.setToken(token);
          _user = await _authService.getMe();
          // Merge guest cart to user cart
          try {
            await _cartService.mergeCart();
          } catch (_) {}
          _isLoading = false;
          notifyListeners();
          return {'success': true};
        }
      }

      _error = res['message'] ?? 'Đăng nhập thất bại';
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'message': _error};
    } catch (e) {
      _error = 'Lỗi kết nối. Vui lòng thử lại.';
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'message': _error};
    }
  }

  Future<bool> verify2FA(String otp) async {
    if (_pending2FAEmail == null) return false;
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final res = await _authService.verify2FA(otp, _pending2FAEmail!);

      if (res['success'] == true) {
        final token = res['token'] ?? res['data']?['token'];
        if (token != null) {
          await _apiService.setToken(token);
          _user = await _authService.getMe();
          _pending2FAEmail = null;
          try {
            await _cartService.mergeCart();
          } catch (_) {}
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }

      _error = res['message'] ?? 'Mã OTP không đúng';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Lỗi xác thực. Vui lòng thử lại.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String username,
    required String email,
    required String password,
    String? fullName,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final res = await _authService.register(
        username: username,
        email: email,
        password: password,
        fullName: fullName,
      );

      if (res['success'] == true) {
        final token = res['token'] ?? res['data']?['token'];
        if (token != null) {
          await _apiService.setToken(token);
          _user = await _authService.getMe();
          try {
            await _cartService.mergeCart();
          } catch (_) {}
        }
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _error = res['message'] ?? 'Đăng ký thất bại';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Lỗi kết nối. Vui lòng thử lại.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _apiService.clearToken();
    _user = null;
    _pending2FAEmail = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await _authService.getMe();
      notifyListeners();
    } catch (_) {}
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
