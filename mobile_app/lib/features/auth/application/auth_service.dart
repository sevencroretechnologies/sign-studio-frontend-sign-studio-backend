import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/providers/session_controller.dart';
import '../data/auth_repository.dart';
import 'current_user_controller.dart';

/// Orchestrates the auth lifecycle: persists the token/user, updates the
/// current-user state and flips the session status (which drives routing).
class AuthService {
  AuthService(this._ref);

  final Ref _ref;

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    final session = await _ref
        .read(authRepositoryProvider)
        .signIn(email: email, password: password);

    final storage = _ref.read(secureStorageProvider);
    await storage.writeToken(session.token);
    await storage.writeUser(jsonEncode(session.user.toJson()));

    _ref.read(currentUserControllerProvider.notifier).setUser(session.user);
    _ref.read(sessionControllerProvider.notifier).setAuthenticated();
  }

  /// Signs out: best-effort server revoke, then always clears local state.
  Future<void> signOut() async {
    try {
      await _ref.read(authRepositoryProvider).signOut();
    } on ApiException {
      // Ignore network/revoke errors — we still clear the local session.
    }
    _ref.read(currentUserControllerProvider.notifier).clear();
    await _ref.read(sessionControllerProvider.notifier).signOutLocally();
  }
}

final authServiceProvider = Provider<AuthService>(AuthService.new);
