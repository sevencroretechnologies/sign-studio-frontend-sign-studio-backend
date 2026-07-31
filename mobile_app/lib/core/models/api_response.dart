import 'pagination_meta.dart';

/// Generic wrapper for the standard Laravel API envelope:
/// `{ "success": bool, "message": string, "data": T, "errors": {...}? }`.
class ApiResponse<T> {
  const ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.errors,
    this.meta,
  });

  final bool success;
  final String message;
  final T? data;
  final Map<String, dynamic>? errors;
  final PaginationMeta? meta;

  /// Parse an envelope where `data` is a single object (or null).
  ///
  /// [fromData] converts the raw `data` JSON into [T]. When `data` is null the
  /// resulting [data] is null and [fromData] is not called.
  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? data) fromData,
  ) {
    final rawData = json['data'];
    return ApiResponse<T>(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      data: rawData == null ? null : fromData(rawData),
      errors: (json['errors'] as Map?)?.cast<String, dynamic>(),
      meta: json['meta'] is Map
          ? PaginationMeta.fromJson((json['meta'] as Map).cast<String, dynamic>())
          : null,
    );
  }
}
