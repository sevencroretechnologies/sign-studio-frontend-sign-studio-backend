import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../data/auth_repository.dart';
import '../data/models/user.dart';

/// Source of truth for the authenticated [User].
///
/// On startup it restores the cached user from secure storage; if only a token
/// is present it fetches a fresh profile. Login/logout update it via
/// [setUser] / [clear].
class CurrentUserController extends AsyncNotifier<User?> {
  SecureStorageService get _storage => ref.read(secureStorageProvider);

  @override
  Future<User?> build() async {
    final cached = await _storage.readUser();
    if (cached != null && cached.isNotEmpty) {
      return User.fromJson(jsonDecode(cached) as Map<String, dynamic>);
    }
    final token = await _storage.readToken();
    if (token != null && token.isNotEmpty) {
      try {
        final user = await ref.read(authRepositoryProvider).getProfile();
        await _storage.writeUser(jsonEncode(user.toJson()));
        return user;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  void setUser(User user) => state = AsyncData(user);

  void clear() => state = const AsyncData(null);
}

final currentUserControllerProvider =
    AsyncNotifierProvider<CurrentUserController, User?>(
  CurrentUserController.new,
);
