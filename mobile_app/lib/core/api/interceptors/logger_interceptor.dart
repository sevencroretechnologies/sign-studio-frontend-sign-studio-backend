import 'dart:developer' as developer;

import 'package:dio/dio.dart';

/// Lightweight request/response logger. Only added to the Dio stack in debug
/// builds (see `ApiClient`); disabled in release. Redacts the Authorization
/// header and truncates large bodies (e.g. base64 selfies).
class LoggerInterceptor extends Interceptor {
  const LoggerInterceptor();

  static const int _maxBodyChars = 500;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '→ ${options.method} ${options.uri}\n'
      'headers: ${_redactHeaders(options.headers)}\n'
      'body: ${_truncate(options.data)}',
      name: 'API',
    );
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '← ${response.statusCode} ${response.requestOptions.uri}\n'
      'body: ${_truncate(response.data)}',
      name: 'API',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '✗ ${err.response?.statusCode} ${err.requestOptions.uri}\n'
      'body: ${_truncate(err.response?.data)}',
      name: 'API',
      error: err.message,
    );
    handler.next(err);
  }

  Map<String, dynamic> _redactHeaders(Map<String, dynamic> headers) {
    final copy = Map<String, dynamic>.from(headers);
    if (copy.containsKey('Authorization')) {
      copy['Authorization'] = 'Bearer ***';
    }
    return copy;
  }

  String _truncate(Object? data) {
    final text = data?.toString() ?? 'null';
    if (text.length <= _maxBodyChars) return text;
    return '${text.substring(0, _maxBodyChars)}… (${text.length} chars)';
  }
}
