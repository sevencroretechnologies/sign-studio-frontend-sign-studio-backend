/// Application-wide constants.
///
/// The API base URL is provided at build/run time via `--dart-define`:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api
///
/// Defaults target the Android emulator, which reaches the host machine's
/// `127.0.0.1` through the special alias `10.0.2.2`.
class AppConstants {
  const AppConstants._();

  static const String appName = 'SignStudio Attendance';

  /// Base URL for the existing Laravel API (includes the `/api` prefix).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );

  /// Origin used to resolve stored attendance images (`/storage/<path>`).
  static const String storageBaseUrl = String.fromEnvironment(
    'STORAGE_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/storage',
  );

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}

/// Secure-storage keys.
class StorageKeys {
  const StorageKeys._();

  static const String authToken = 'auth_token';
  static const String user = 'user';
}

/// API endpoint paths (relative to [AppConstants.apiBaseUrl]).
class ApiEndpoints {
  const ApiEndpoints._();

  // Auth
  static const String signIn = '/auth/sign-in';
  static const String signOut = '/auth/sign-out';
  static const String profile = '/auth/profile';

  // Attendance (self)
  static const String currentStatusSelf = '/current-status-self';
  static const String clockInSelf = '/clock-in-self';
  static const String clockOutSelf = '/clock-out-self';
  static const String myLogs = '/my-logs';
  static const String mySummary = '/my-summary';
}
