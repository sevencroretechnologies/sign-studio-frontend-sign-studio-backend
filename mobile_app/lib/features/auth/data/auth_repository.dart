import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/core_providers.dart';
import 'models/auth_session.dart';
import 'models/user.dart';

/// Handles all authentication network calls against the Laravel API.
///
/// Errors are normalized to [ApiException] so the UI can display the backend
/// `message` verbatim.
class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;
  Dio get _dio => _client.dio;

  Future<AuthSession> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post(
        ApiEndpoints.signIn,
        data: {'email': email, 'password': password},
      );
      final data = (res.data['data'] as Map).cast<String, dynamic>();
      return AuthSession.fromJson(data);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<User> getProfile() async {
    try {
      final res = await _dio.get(ApiEndpoints.profile);
      final data = (res.data['data'] as Map).cast<String, dynamic>();
      return User.fromJson((data['user'] as Map).cast<String, dynamic>());
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Revokes the token server-side. Local state is cleared by the caller
  /// regardless of the outcome.
  Future<void> signOut() async {
    try {
      await _dio.post(ApiEndpoints.signOut);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);
