import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../storage/secure_storage_service.dart';
import 'session_controller.dart';

/// Secure storage singleton.
final secureStorageProvider = Provider<SecureStorageService>(
  (ref) => SecureStorageService(),
);

/// Configured [ApiClient]. On a 401 it clears the session, which causes the
/// router to redirect to Login.
final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(
    storage: storage,
    onUnauthorized: () async {
      await ref.read(sessionControllerProvider.notifier).clearOnUnauthorized();
    },
  );
});
