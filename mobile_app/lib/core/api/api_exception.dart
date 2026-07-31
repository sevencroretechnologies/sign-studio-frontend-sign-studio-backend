import 'package:dio/dio.dart';

/// A normalized error surfaced to the UI layer.
///
/// The [message] always carries the backend's `message` verbatim when the
/// server responded; otherwise it holds a connectivity/timeout message. The UI
/// must display [message] as-is (never replace backend validation text).
class ApiException implements Exception {
  const ApiException({
    required this.message,
    this.statusCode,
    this.errors,
    this.isUnauthorized = false,
    this.isNetworkError = false,
  });

  final String message;
  final int? statusCode;

  /// Field-level validation errors (`{ field: [messages] }`) on HTTP 422.
  final Map<String, List<String>>? errors;

  final bool isUnauthorized;
  final bool isNetworkError;

  /// Build an [ApiException] from a Dio error, preserving the backend message.
  factory ApiException.fromDioException(DioException e) {
    final response = e.response;
    final status = response?.statusCode;

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.transformTimeout:
        return const ApiException(
          message:
              'The request timed out. Please check your connection and try again.',
          isNetworkError: true,
        );
      case DioExceptionType.connectionError:
        return const ApiException(
          message:
              'No internet connection. Please connect to a network and try again.',
          isNetworkError: true,
        );
      case DioExceptionType.badCertificate:
        return const ApiException(
          message: 'A secure connection could not be established.',
          isNetworkError: true,
        );
      case DioExceptionType.cancel:
        return const ApiException(message: 'Request cancelled.');
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        break;
    }

    final data = response?.data;
    String message = 'Something went wrong. Please try again.';
    Map<String, List<String>>? fieldErrors;

    if (data is Map) {
      final map = data.cast<String, dynamic>();
      if (map['message'] is String && (map['message'] as String).isNotEmpty) {
        message = map['message'] as String;
      }
      final rawErrors = map['errors'];
      if (rawErrors is Map) {
        fieldErrors = rawErrors.map(
          (key, value) => MapEntry(
            key.toString(),
            (value is List)
                ? value.map((e) => e.toString()).toList()
                : <String>[value.toString()],
          ),
        );
      }
    } else if (e.message != null && data == null) {
      message = 'No internet connection. Please try again.';
      return ApiException(message: message, isNetworkError: true);
    }

    return ApiException(
      message: message,
      statusCode: status,
      errors: fieldErrors,
      isUnauthorized: status == 401,
    );
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}
