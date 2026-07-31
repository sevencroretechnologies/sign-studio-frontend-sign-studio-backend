import 'package:dio/dio.dart';

/// Detects HTTP 401 responses and triggers a global session-expiry callback
/// (clear token + redirect to Login). The error is still propagated so callers
/// can surface the backend message.
class ErrorInterceptor extends Interceptor {
  ErrorInterceptor(this._onUnauthorized);

  final Future<void> Function() _onUnauthorized;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      await _onUnauthorized();
    }
    handler.next(err);
  }
}
