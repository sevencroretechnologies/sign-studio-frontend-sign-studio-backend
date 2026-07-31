import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';
import '../storage/secure_storage_service.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/error_interceptor.dart';
import 'interceptors/logger_interceptor.dart';

/// Configured Dio HTTP client for the existing Laravel API.
///
/// Wires the auth, error and (debug-only) logger interceptors and applies the
/// 30-second timeouts. Consumers use [dio] to issue requests.
class ApiClient {
  ApiClient({
    required SecureStorageService storage,
    required Future<void> Function() onUnauthorized,
    Dio? dio,
  }) : dio = dio ?? Dio() {
    this.dio
      ..options.baseUrl = AppConstants.apiBaseUrl
      ..options.connectTimeout = AppConstants.connectTimeout
      ..options.receiveTimeout = AppConstants.receiveTimeout
      ..options.sendTimeout = AppConstants.sendTimeout
      ..options.headers.addAll({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });

    this.dio.interceptors.addAll([
      AuthInterceptor(storage),
      ErrorInterceptor(onUnauthorized),
      if (kDebugMode) const LoggerInterceptor(),
    ]);
  }

  final Dio dio;
}
