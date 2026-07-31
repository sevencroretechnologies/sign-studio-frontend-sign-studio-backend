import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/core_providers.dart';
import 'models/current_status.dart';

/// Network calls for the self-attendance endpoints. Errors are normalized to
/// [ApiException] so the UI can display the backend `message` verbatim.
class AttendanceRepository {
  AttendanceRepository(this._client);

  final ApiClient _client;
  Dio get _dio => _client.dio;

  Future<CurrentStatus> getCurrentStatusSelf() async {
    try {
      final res = await _dio.get(ApiEndpoints.currentStatusSelf);
      final data = (res.data['data'] as Map).cast<String, dynamic>();
      return CurrentStatus.fromJson(data);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Submits a self clock-in. Returns the backend `message` (shown verbatim).
  Future<String> clockInSelf({
    required double latitude,
    required double longitude,
    double? accuracy,
    String? image,
  }) =>
      _submitClock(
        ApiEndpoints.clockInSelf,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        image: image,
        fallback: 'Clocked in successfully',
      );

  /// Submits a self clock-out. Returns the backend `message` (shown verbatim).
  Future<String> clockOutSelf({
    required double latitude,
    required double longitude,
    double? accuracy,
    String? image,
  }) =>
      _submitClock(
        ApiEndpoints.clockOutSelf,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        image: image,
        fallback: 'Clocked out successfully',
      );

  Future<String> _submitClock(
    String endpoint, {
    required double latitude,
    required double longitude,
    double? accuracy,
    String? image,
    required String fallback,
  }) async {
    try {
      final res = await _dio.post(endpoint, data: {
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
        'image': image,
      });
      return (res.data['message'] as String?) ?? fallback;
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}

final attendanceRepositoryProvider = Provider<AttendanceRepository>(
  (ref) => AttendanceRepository(ref.watch(apiClientProvider)),
);
