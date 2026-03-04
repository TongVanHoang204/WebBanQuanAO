import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';
import '../models/chat_message.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool _isConnected = false;
  String? _conversationId;

  // Stream controllers for reactive events
  final _messagesController = StreamController<SupportMessage>.broadcast();
  final _conversationStartedController = StreamController<String>.broadcast();
  final _conversationClosedController = StreamController<String>.broadcast();
  final _adminJoinedController = StreamController<String>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  Stream<SupportMessage> get onMessage => _messagesController.stream;
  Stream<String> get onConversationStarted =>
      _conversationStartedController.stream;
  Stream<String> get onConversationClosed =>
      _conversationClosedController.stream;
  Stream<String> get onAdminJoined => _adminJoinedController.stream;
  Stream<Map<String, dynamic>> get onTyping => _typingController.stream;
  Stream<bool> get onConnectionChanged => _connectionController.stream;

  bool get isConnected => _isConnected;
  String? get conversationId => _conversationId;

  Future<void> connect() async {
    if (_socket != null && _isConnected) return;

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    _socket = io.io(
      ApiConfig.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setAuth(token != null ? {'token': token} : {})
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      _connectionController.add(true);
      debugPrint('[Socket] Connected');

      // Always check for active conversation (backend will use token's userId or the provided id)
      _socket!.emit('check-active-conversation', {
        if (_conversationId != null) 'conversationId': _conversationId,
      });
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      _connectionController.add(false);
      debugPrint('[Socket] Disconnected');
    });

    _socket!.onConnectError((err) {
      debugPrint('[Socket] Connect error: $err');
      _isConnected = false;
      _connectionController.add(false);
    });

    // Listen for events
    _socket!.on('support-started', (data) {
      _conversationId = data['conversationId']?.toString();
      if (_conversationId != null) {
        _conversationStartedController.add(_conversationId!);
      }
    });

    _socket!.on('new-message', (data) {
      try {
        debugPrint('[Socket] new-message received: $data');
        Map<String, dynamic> msgData;
        if (data is Map<String, dynamic>) {
          msgData = data;
        } else if (data is Map) {
          msgData = Map<String, dynamic>.from(data);
        } else {
          debugPrint('[Socket] Unexpected data type: ${data.runtimeType}');
          return;
        }
        final msg = SupportMessage.fromJson(msgData);
        _messagesController.add(msg);
      } catch (e) {
        debugPrint('[Socket] Error parsing message: $e');
      }
    });

    _socket!.on('conversation-messages', (data) {
      debugPrint('[Socket] conversation-messages received. Count: ${data['messages']?.length}');
      if (data['messages'] is List) {
        for (final m in data['messages']) {
          try {
            Map<String, dynamic> msgData;
            if (m is Map<String, dynamic>) {
              msgData = m;
            } else if (m is Map) {
              msgData = Map<String, dynamic>.from(m);
            } else {
              continue;
            }
            final msg = SupportMessage.fromJson(msgData);
            _messagesController.add(msg);
          } catch (e) {
            debugPrint('[Socket] Error parsing history message: $e');
          }
        }
      }
    });

    _socket!.on('admin-joined', (data) {
      final adminName = data['adminName']?.toString() ?? 'Nhân viên';
      _adminJoinedController.add(adminName);
    });

    _socket!.on('conversation-closed', (data) {
      final convId = data['conversationId']?.toString() ?? '';
      _conversationId = null;
      _conversationClosedController.add(convId);
    });

    _socket!.on('user-typing', (data) {
      _typingController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('error', (data) {
      debugPrint('[Socket] Error: ${data['message']}');
    });

    _socket!.on('force_logout', (data) {
      debugPrint('[Socket] Force logout: ${data['message']}');
      disconnect();
    });
  }

  void requestHistory() {
    if (_socket != null) {
      _socket!.emit('check-active-conversation', {
        if (_conversationId != null) 'conversationId': _conversationId,
      });
    }
  }

  void startSupport({String? guestName, String? guestEmail}) {
    if (_socket == null) return;
    _socket!.emit('start-support', {
      if (guestName != null) 'guestName': guestName,
      if (guestEmail != null) 'guestEmail': guestEmail,
    });
  }

  void sendMessage(String content) {
    if (_socket == null || _conversationId == null) return;
    _socket!.emit('send-message', {
      'conversationId': _conversationId,
      'content': content,
    });
  }

  void setTyping(bool isTyping) {
    if (_socket == null || _conversationId == null) return;
    _socket!.emit('typing', {
      'conversationId': _conversationId,
      'isTyping': isTyping,
    });
  }

  void closeConversation() {
    if (_socket == null || _conversationId == null) return;
    _socket!.emit('close-conversation', {'conversationId': _conversationId});
    _conversationId = null;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _conversationId = null;
    _connectionController.add(false);
  }

  void dispose() {
    disconnect();
    _messagesController.close();
    _conversationStartedController.close();
    _conversationClosedController.close();
    _adminJoinedController.close();
    _typingController.close();
    _connectionController.close();
  }
}
