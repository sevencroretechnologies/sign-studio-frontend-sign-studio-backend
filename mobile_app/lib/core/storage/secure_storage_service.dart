import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

/// Thin wrapper around [FlutterSecureStorage] for the auth token and cached
/// user JSON. Centralizes key usage so no other layer touches raw storage.
class SecureStorageService {
  SecureStorageService([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<String?> readToken() => _storage.read(key: StorageKeys.authToken);

  Future<void> writeToken(String token) =>
      _storage.write(key: StorageKeys.authToken, value: token);

  Future<String?> readUser() => _storage.read(key: StorageKeys.user);

  Future<void> writeUser(String userJson) =>
      _storage.write(key: StorageKeys.user, value: userJson);

  /// Clear all auth state (used on sign-out and on 401).
  Future<void> clearAuth() async {
    await _storage.delete(key: StorageKeys.authToken);
    await _storage.delete(key: StorageKeys.user);
  }
}
