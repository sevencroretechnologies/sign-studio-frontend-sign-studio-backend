import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

/// Authenticated user, mapped from the backend `formatUserData` payload.
///
/// [staffMemberId] gates attendance: when it is null the user is not linked to a
/// staff profile and clock in/out is unavailable (mirrors the React app).
@freezed
abstract class User with _$User {
  const factory User({
    required int id,
    required String name,
    required String email,
    @Default('user') String role,
    @JsonKey(name: 'role_display') @Default('User') String roleDisplay,
    @Default(<String>[]) List<String> roles,
    @Default(<String>[]) List<String> permissions,
    @JsonKey(name: 'staff_member_id') int? staffMemberId,
    @JsonKey(name: 'organization_name') String? organizationName,
    @JsonKey(name: 'company_name') String? companyName,
  }) = _User;

  const User._();

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  /// Whether attendance features are available for this user.
  bool get hasStaffMember => staffMemberId != null;
}
