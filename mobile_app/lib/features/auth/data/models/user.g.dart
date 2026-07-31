// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_User _$UserFromJson(Map<String, dynamic> json) => _User(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  email: json['email'] as String,
  role: json['role'] as String? ?? 'user',
  roleDisplay: json['role_display'] as String? ?? 'User',
  roles:
      (json['roles'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  permissions:
      (json['permissions'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const <String>[],
  staffMemberId: (json['staff_member_id'] as num?)?.toInt(),
  organizationName: json['organization_name'] as String?,
  companyName: json['company_name'] as String?,
);

Map<String, dynamic> _$UserToJson(_User instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'role': instance.role,
  'role_display': instance.roleDisplay,
  'roles': instance.roles,
  'permissions': instance.permissions,
  'staff_member_id': instance.staffMemberId,
  'organization_name': instance.organizationName,
  'company_name': instance.companyName,
};
