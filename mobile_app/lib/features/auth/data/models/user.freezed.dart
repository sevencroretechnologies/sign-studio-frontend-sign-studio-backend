// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$User {

 int get id; String get name; String get email; String get role;@JsonKey(name: 'role_display') String get roleDisplay; List<String> get roles; List<String> get permissions;@JsonKey(name: 'staff_member_id') int? get staffMemberId;@JsonKey(name: 'organization_name') String? get organizationName;@JsonKey(name: 'company_name') String? get companyName;
/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UserCopyWith<User> get copyWith => _$UserCopyWithImpl<User>(this as User, _$identity);

  /// Serializes this User to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is User&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.email, email) || other.email == email)&&(identical(other.role, role) || other.role == role)&&(identical(other.roleDisplay, roleDisplay) || other.roleDisplay == roleDisplay)&&const DeepCollectionEquality().equals(other.roles, roles)&&const DeepCollectionEquality().equals(other.permissions, permissions)&&(identical(other.staffMemberId, staffMemberId) || other.staffMemberId == staffMemberId)&&(identical(other.organizationName, organizationName) || other.organizationName == organizationName)&&(identical(other.companyName, companyName) || other.companyName == companyName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,email,role,roleDisplay,const DeepCollectionEquality().hash(roles),const DeepCollectionEquality().hash(permissions),staffMemberId,organizationName,companyName);

@override
String toString() {
  return 'User(id: $id, name: $name, email: $email, role: $role, roleDisplay: $roleDisplay, roles: $roles, permissions: $permissions, staffMemberId: $staffMemberId, organizationName: $organizationName, companyName: $companyName)';
}


}

/// @nodoc
abstract mixin class $UserCopyWith<$Res>  {
  factory $UserCopyWith(User value, $Res Function(User) _then) = _$UserCopyWithImpl;
@useResult
$Res call({
 int id, String name, String email, String role,@JsonKey(name: 'role_display') String roleDisplay, List<String> roles, List<String> permissions,@JsonKey(name: 'staff_member_id') int? staffMemberId,@JsonKey(name: 'organization_name') String? organizationName,@JsonKey(name: 'company_name') String? companyName
});




}
/// @nodoc
class _$UserCopyWithImpl<$Res>
    implements $UserCopyWith<$Res> {
  _$UserCopyWithImpl(this._self, this._then);

  final User _self;
  final $Res Function(User) _then;

/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? email = null,Object? role = null,Object? roleDisplay = null,Object? roles = null,Object? permissions = null,Object? staffMemberId = freezed,Object? organizationName = freezed,Object? companyName = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,roleDisplay: null == roleDisplay ? _self.roleDisplay : roleDisplay // ignore: cast_nullable_to_non_nullable
as String,roles: null == roles ? _self.roles : roles // ignore: cast_nullable_to_non_nullable
as List<String>,permissions: null == permissions ? _self.permissions : permissions // ignore: cast_nullable_to_non_nullable
as List<String>,staffMemberId: freezed == staffMemberId ? _self.staffMemberId : staffMemberId // ignore: cast_nullable_to_non_nullable
as int?,organizationName: freezed == organizationName ? _self.organizationName : organizationName // ignore: cast_nullable_to_non_nullable
as String?,companyName: freezed == companyName ? _self.companyName : companyName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [User].
extension UserPatterns on User {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _User value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _User() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _User value)  $default,){
final _that = this;
switch (_that) {
case _User():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _User value)?  $default,){
final _that = this;
switch (_that) {
case _User() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String name,  String email,  String role, @JsonKey(name: 'role_display')  String roleDisplay,  List<String> roles,  List<String> permissions, @JsonKey(name: 'staff_member_id')  int? staffMemberId, @JsonKey(name: 'organization_name')  String? organizationName, @JsonKey(name: 'company_name')  String? companyName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _User() when $default != null:
return $default(_that.id,_that.name,_that.email,_that.role,_that.roleDisplay,_that.roles,_that.permissions,_that.staffMemberId,_that.organizationName,_that.companyName);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String name,  String email,  String role, @JsonKey(name: 'role_display')  String roleDisplay,  List<String> roles,  List<String> permissions, @JsonKey(name: 'staff_member_id')  int? staffMemberId, @JsonKey(name: 'organization_name')  String? organizationName, @JsonKey(name: 'company_name')  String? companyName)  $default,) {final _that = this;
switch (_that) {
case _User():
return $default(_that.id,_that.name,_that.email,_that.role,_that.roleDisplay,_that.roles,_that.permissions,_that.staffMemberId,_that.organizationName,_that.companyName);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String name,  String email,  String role, @JsonKey(name: 'role_display')  String roleDisplay,  List<String> roles,  List<String> permissions, @JsonKey(name: 'staff_member_id')  int? staffMemberId, @JsonKey(name: 'organization_name')  String? organizationName, @JsonKey(name: 'company_name')  String? companyName)?  $default,) {final _that = this;
switch (_that) {
case _User() when $default != null:
return $default(_that.id,_that.name,_that.email,_that.role,_that.roleDisplay,_that.roles,_that.permissions,_that.staffMemberId,_that.organizationName,_that.companyName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _User extends User {
  const _User({required this.id, required this.name, required this.email, this.role = 'user', @JsonKey(name: 'role_display') this.roleDisplay = 'User', final  List<String> roles = const <String>[], final  List<String> permissions = const <String>[], @JsonKey(name: 'staff_member_id') this.staffMemberId, @JsonKey(name: 'organization_name') this.organizationName, @JsonKey(name: 'company_name') this.companyName}): _roles = roles,_permissions = permissions,super._();
  factory _User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

@override final  int id;
@override final  String name;
@override final  String email;
@override@JsonKey() final  String role;
@override@JsonKey(name: 'role_display') final  String roleDisplay;
 final  List<String> _roles;
@override@JsonKey() List<String> get roles {
  if (_roles is EqualUnmodifiableListView) return _roles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_roles);
}

 final  List<String> _permissions;
@override@JsonKey() List<String> get permissions {
  if (_permissions is EqualUnmodifiableListView) return _permissions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_permissions);
}

@override@JsonKey(name: 'staff_member_id') final  int? staffMemberId;
@override@JsonKey(name: 'organization_name') final  String? organizationName;
@override@JsonKey(name: 'company_name') final  String? companyName;

/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UserCopyWith<_User> get copyWith => __$UserCopyWithImpl<_User>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UserToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _User&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.email, email) || other.email == email)&&(identical(other.role, role) || other.role == role)&&(identical(other.roleDisplay, roleDisplay) || other.roleDisplay == roleDisplay)&&const DeepCollectionEquality().equals(other._roles, _roles)&&const DeepCollectionEquality().equals(other._permissions, _permissions)&&(identical(other.staffMemberId, staffMemberId) || other.staffMemberId == staffMemberId)&&(identical(other.organizationName, organizationName) || other.organizationName == organizationName)&&(identical(other.companyName, companyName) || other.companyName == companyName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,email,role,roleDisplay,const DeepCollectionEquality().hash(_roles),const DeepCollectionEquality().hash(_permissions),staffMemberId,organizationName,companyName);

@override
String toString() {
  return 'User(id: $id, name: $name, email: $email, role: $role, roleDisplay: $roleDisplay, roles: $roles, permissions: $permissions, staffMemberId: $staffMemberId, organizationName: $organizationName, companyName: $companyName)';
}


}

/// @nodoc
abstract mixin class _$UserCopyWith<$Res> implements $UserCopyWith<$Res> {
  factory _$UserCopyWith(_User value, $Res Function(_User) _then) = __$UserCopyWithImpl;
@override @useResult
$Res call({
 int id, String name, String email, String role,@JsonKey(name: 'role_display') String roleDisplay, List<String> roles, List<String> permissions,@JsonKey(name: 'staff_member_id') int? staffMemberId,@JsonKey(name: 'organization_name') String? organizationName,@JsonKey(name: 'company_name') String? companyName
});




}
/// @nodoc
class __$UserCopyWithImpl<$Res>
    implements _$UserCopyWith<$Res> {
  __$UserCopyWithImpl(this._self, this._then);

  final _User _self;
  final $Res Function(_User) _then;

/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? email = null,Object? role = null,Object? roleDisplay = null,Object? roles = null,Object? permissions = null,Object? staffMemberId = freezed,Object? organizationName = freezed,Object? companyName = freezed,}) {
  return _then(_User(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,roleDisplay: null == roleDisplay ? _self.roleDisplay : roleDisplay // ignore: cast_nullable_to_non_nullable
as String,roles: null == roles ? _self._roles : roles // ignore: cast_nullable_to_non_nullable
as List<String>,permissions: null == permissions ? _self._permissions : permissions // ignore: cast_nullable_to_non_nullable
as List<String>,staffMemberId: freezed == staffMemberId ? _self.staffMemberId : staffMemberId // ignore: cast_nullable_to_non_nullable
as int?,organizationName: freezed == organizationName ? _self.organizationName : organizationName // ignore: cast_nullable_to_non_nullable
as String?,companyName: freezed == companyName ? _self.companyName : companyName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
