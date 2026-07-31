import 'user.dart';

/// Parsed `data` object from `POST /auth/sign-in`:
/// `{ user: {...}, token, access_token, token_type }`.
class AuthSession {
  const AuthSession({required this.token, required this.user});

  final String token;
  final User user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final token = (json['token'] ?? json['access_token']) as String?;
    if (token == null || token.isEmpty) {
      throw const FormatException('Sign-in response missing token');
    }
    return AuthSession(
      token: token,
      user: User.fromJson((json['user'] as Map).cast<String, dynamic>()),
    );
  }
}
