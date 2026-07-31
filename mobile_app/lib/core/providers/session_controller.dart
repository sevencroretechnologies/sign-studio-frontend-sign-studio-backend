import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_storage_service.dart';
import 'core_providers.dart';

/// Authentication lifecycle states used by the router to gate routes.
enum SessionStatus { unknown, authenticated, unauthenticated }

/// Holds the current session status, seeded from secure storage on startup.
///
/// Feature layers (Phase 3+) call [setAuthenticated] after a successful login
/// and [signOutLocally] on logout. [clearOnUnauthorized] is invoked by the
/// error interceptor on HTTP 401.
class SessionController extends Notifier<SessionStatus> {
  late final SecureStorageService _storage;

  @override
  SessionStatus build() {
    _storage = ref.read(secureStorageProvider);
    _restore();
    return SessionStatus.unknown;
  }

  Future<void> _restore() async {
    final token = await _storage.readToken();
    state = (token != null && token.isNotEmpty)
        ? SessionStatus.authenticated
        : SessionStatus.unauthenticated;
  }

  void setAuthenticated() => state = SessionStatus.authenticated;

  Future<void> signOutLocally() async {
    await _storage.clearAuth();
    state = SessionStatus.unauthenticated;
  }

  Future<void> clearOnUnauthorized() async {
    await _storage.clearAuth();
    state = SessionStatus.unauthenticated;
  }
}

final sessionControllerProvider =
    NotifierProvider<SessionController, SessionStatus>(SessionController.new);
