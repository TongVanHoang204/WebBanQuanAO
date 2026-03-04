import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../config/env_config.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _isLoading = false;
  String? _error;

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: EnvConfig.googleServerClientId,
  );

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  AuthProvider() {
    _restore();
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token != null && token.isNotEmpty) {
      try {
        await ApiService().setToken(token);
        _user = await _authService.getMe();
        notifyListeners();
      } catch (_) {
        await _authService.logout();
      }
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _authService.login(username, password);
      if (result['success'] == true) {
        _user = await _authService.getMe();
      } else if (result['require_2fa'] == true) {
        _error = '2FA_REQUIRED';
      } else {
        _error = result['message'] ?? 'Đăng nhập thất bại';
      }
      return result;
    } catch (e) {
      _error = 'Đăng nhập thất bại. Kiểm tra kết nối mạng.';
      return {'success': false};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      print('[DEBUG] Step 1: Calling _googleSignIn.signIn()...');
      GoogleSignInAccount? googleUser;
      try {
        googleUser = await _googleSignIn.signIn();
      } catch (signInErr) {
        print('[DEBUG] signIn() error: $signInErr');
        print('[DEBUG] signIn() error type: ${signInErr.runtimeType}');
        rethrow;
      }
      if (googleUser == null) {
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'message': 'Đã hủy đăng nhập Google'};
      }
      print('[DEBUG] Step 2: Got googleUser: ${googleUser.email}');
      GoogleSignInAuthentication googleAuth;
      try {
        googleAuth = await googleUser.authentication;
      } catch (authErr) {
        print('[DEBUG] authentication error: $authErr');
        rethrow;
      }
      final idToken = googleAuth.idToken;
      print('[DEBUG] Step 3: Got idToken length: ${idToken?.length}');
      if (idToken == null) throw Exception('No ID token');

      print('[DEBUG] Step 4: Calling _authService.loginWithGoogle...');
      final result = await _authService.loginWithGoogle(idToken);
      print('[DEBUG] Step 5: Got result: $result');
      
      if (result['success'] == true) {
        print('[DEBUG] Step 6: Login success, calling getMe...');
        try {
          _user = await _authService.getMe();
          print('[DEBUG] Step 7: getMe success: ${_user?.email}');
        } catch (e) {
          print('[DEBUG] Step 6 ERROR in getMe: $e');
          // Still return success since the login itself worked
        }
      } else {
        _error = result['message'] ?? 'Đăng nhập Google thất bại';
        print('[DEBUG] Step 6: Login failed: $_error');
      }
      return result;
    } catch (e) {
      print('[DEBUG] CATCH ERROR: $e');
      _error = 'Đăng nhập Google thất bại: ${e.toString()}';
      return {'success': false, 'message': 'Google Error: ${e.toString()}'};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> register(Map<String, String> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _authService.register(data);
      return result;
    } catch (e) {
      _error = 'Đăng ký thất bại';
      return {'success': false};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    await _authService.logout();
    _user = null;
    notifyListeners();
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await _authService.updateProfile(data);
      if (result['success'] == true) _user = await _authService.getMe();
      return result['success'] == true;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshUser() async {
    try {
      _user = await _authService.getMe();
      notifyListeners();
    } catch (_) {}
  }
}
