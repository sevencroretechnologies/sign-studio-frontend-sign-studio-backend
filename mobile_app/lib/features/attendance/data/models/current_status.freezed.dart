// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'current_status.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CurrentStatus {

 String get status; String? get notes;@JsonKey(name: 'clock_in') String? get clockIn;@JsonKey(name: 'clock_out') String? get clockOut;@JsonKey(name: 'clock_in_time') String? get clockInTime;@JsonKey(name: 'clock_out_time') String? get clockOutTime;@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? get totalHours;@JsonKey(name: 'late_minutes') int get lateMinutes;@JsonKey(name: 'on_leave') bool get onLeave;@JsonKey(name: 'leave_details') Map<String, dynamic>? get leaveDetails; Shift? get shift;@JsonKey(name: 'current_time') String? get currentTime;
/// Create a copy of CurrentStatus
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CurrentStatusCopyWith<CurrentStatus> get copyWith => _$CurrentStatusCopyWithImpl<CurrentStatus>(this as CurrentStatus, _$identity);

  /// Serializes this CurrentStatus to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CurrentStatus&&(identical(other.status, status) || other.status == status)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.clockIn, clockIn) || other.clockIn == clockIn)&&(identical(other.clockOut, clockOut) || other.clockOut == clockOut)&&(identical(other.clockInTime, clockInTime) || other.clockInTime == clockInTime)&&(identical(other.clockOutTime, clockOutTime) || other.clockOutTime == clockOutTime)&&(identical(other.totalHours, totalHours) || other.totalHours == totalHours)&&(identical(other.lateMinutes, lateMinutes) || other.lateMinutes == lateMinutes)&&(identical(other.onLeave, onLeave) || other.onLeave == onLeave)&&const DeepCollectionEquality().equals(other.leaveDetails, leaveDetails)&&(identical(other.shift, shift) || other.shift == shift)&&(identical(other.currentTime, currentTime) || other.currentTime == currentTime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,status,notes,clockIn,clockOut,clockInTime,clockOutTime,totalHours,lateMinutes,onLeave,const DeepCollectionEquality().hash(leaveDetails),shift,currentTime);

@override
String toString() {
  return 'CurrentStatus(status: $status, notes: $notes, clockIn: $clockIn, clockOut: $clockOut, clockInTime: $clockInTime, clockOutTime: $clockOutTime, totalHours: $totalHours, lateMinutes: $lateMinutes, onLeave: $onLeave, leaveDetails: $leaveDetails, shift: $shift, currentTime: $currentTime)';
}


}

/// @nodoc
abstract mixin class $CurrentStatusCopyWith<$Res>  {
  factory $CurrentStatusCopyWith(CurrentStatus value, $Res Function(CurrentStatus) _then) = _$CurrentStatusCopyWithImpl;
@useResult
$Res call({
 String status, String? notes,@JsonKey(name: 'clock_in') String? clockIn,@JsonKey(name: 'clock_out') String? clockOut,@JsonKey(name: 'clock_in_time') String? clockInTime,@JsonKey(name: 'clock_out_time') String? clockOutTime,@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? totalHours,@JsonKey(name: 'late_minutes') int lateMinutes,@JsonKey(name: 'on_leave') bool onLeave,@JsonKey(name: 'leave_details') Map<String, dynamic>? leaveDetails, Shift? shift,@JsonKey(name: 'current_time') String? currentTime
});


$ShiftCopyWith<$Res>? get shift;

}
/// @nodoc
class _$CurrentStatusCopyWithImpl<$Res>
    implements $CurrentStatusCopyWith<$Res> {
  _$CurrentStatusCopyWithImpl(this._self, this._then);

  final CurrentStatus _self;
  final $Res Function(CurrentStatus) _then;

/// Create a copy of CurrentStatus
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = null,Object? notes = freezed,Object? clockIn = freezed,Object? clockOut = freezed,Object? clockInTime = freezed,Object? clockOutTime = freezed,Object? totalHours = freezed,Object? lateMinutes = null,Object? onLeave = null,Object? leaveDetails = freezed,Object? shift = freezed,Object? currentTime = freezed,}) {
  return _then(_self.copyWith(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,clockIn: freezed == clockIn ? _self.clockIn : clockIn // ignore: cast_nullable_to_non_nullable
as String?,clockOut: freezed == clockOut ? _self.clockOut : clockOut // ignore: cast_nullable_to_non_nullable
as String?,clockInTime: freezed == clockInTime ? _self.clockInTime : clockInTime // ignore: cast_nullable_to_non_nullable
as String?,clockOutTime: freezed == clockOutTime ? _self.clockOutTime : clockOutTime // ignore: cast_nullable_to_non_nullable
as String?,totalHours: freezed == totalHours ? _self.totalHours : totalHours // ignore: cast_nullable_to_non_nullable
as double?,lateMinutes: null == lateMinutes ? _self.lateMinutes : lateMinutes // ignore: cast_nullable_to_non_nullable
as int,onLeave: null == onLeave ? _self.onLeave : onLeave // ignore: cast_nullable_to_non_nullable
as bool,leaveDetails: freezed == leaveDetails ? _self.leaveDetails : leaveDetails // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,shift: freezed == shift ? _self.shift : shift // ignore: cast_nullable_to_non_nullable
as Shift?,currentTime: freezed == currentTime ? _self.currentTime : currentTime // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of CurrentStatus
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShiftCopyWith<$Res>? get shift {
    if (_self.shift == null) {
    return null;
  }

  return $ShiftCopyWith<$Res>(_self.shift!, (value) {
    return _then(_self.copyWith(shift: value));
  });
}
}


/// Adds pattern-matching-related methods to [CurrentStatus].
extension CurrentStatusPatterns on CurrentStatus {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CurrentStatus value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CurrentStatus() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CurrentStatus value)  $default,){
final _that = this;
switch (_that) {
case _CurrentStatus():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CurrentStatus value)?  $default,){
final _that = this;
switch (_that) {
case _CurrentStatus() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String status,  String? notes, @JsonKey(name: 'clock_in')  String? clockIn, @JsonKey(name: 'clock_out')  String? clockOut, @JsonKey(name: 'clock_in_time')  String? clockInTime, @JsonKey(name: 'clock_out_time')  String? clockOutTime, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson)  double? totalHours, @JsonKey(name: 'late_minutes')  int lateMinutes, @JsonKey(name: 'on_leave')  bool onLeave, @JsonKey(name: 'leave_details')  Map<String, dynamic>? leaveDetails,  Shift? shift, @JsonKey(name: 'current_time')  String? currentTime)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CurrentStatus() when $default != null:
return $default(_that.status,_that.notes,_that.clockIn,_that.clockOut,_that.clockInTime,_that.clockOutTime,_that.totalHours,_that.lateMinutes,_that.onLeave,_that.leaveDetails,_that.shift,_that.currentTime);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String status,  String? notes, @JsonKey(name: 'clock_in')  String? clockIn, @JsonKey(name: 'clock_out')  String? clockOut, @JsonKey(name: 'clock_in_time')  String? clockInTime, @JsonKey(name: 'clock_out_time')  String? clockOutTime, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson)  double? totalHours, @JsonKey(name: 'late_minutes')  int lateMinutes, @JsonKey(name: 'on_leave')  bool onLeave, @JsonKey(name: 'leave_details')  Map<String, dynamic>? leaveDetails,  Shift? shift, @JsonKey(name: 'current_time')  String? currentTime)  $default,) {final _that = this;
switch (_that) {
case _CurrentStatus():
return $default(_that.status,_that.notes,_that.clockIn,_that.clockOut,_that.clockInTime,_that.clockOutTime,_that.totalHours,_that.lateMinutes,_that.onLeave,_that.leaveDetails,_that.shift,_that.currentTime);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String status,  String? notes, @JsonKey(name: 'clock_in')  String? clockIn, @JsonKey(name: 'clock_out')  String? clockOut, @JsonKey(name: 'clock_in_time')  String? clockInTime, @JsonKey(name: 'clock_out_time')  String? clockOutTime, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson)  double? totalHours, @JsonKey(name: 'late_minutes')  int lateMinutes, @JsonKey(name: 'on_leave')  bool onLeave, @JsonKey(name: 'leave_details')  Map<String, dynamic>? leaveDetails,  Shift? shift, @JsonKey(name: 'current_time')  String? currentTime)?  $default,) {final _that = this;
switch (_that) {
case _CurrentStatus() when $default != null:
return $default(_that.status,_that.notes,_that.clockIn,_that.clockOut,_that.clockInTime,_that.clockOutTime,_that.totalHours,_that.lateMinutes,_that.onLeave,_that.leaveDetails,_that.shift,_that.currentTime);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CurrentStatus extends CurrentStatus {
  const _CurrentStatus({this.status = AttendanceStatusCode.notClockedIn, this.notes, @JsonKey(name: 'clock_in') this.clockIn, @JsonKey(name: 'clock_out') this.clockOut, @JsonKey(name: 'clock_in_time') this.clockInTime, @JsonKey(name: 'clock_out_time') this.clockOutTime, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson) this.totalHours, @JsonKey(name: 'late_minutes') this.lateMinutes = 0, @JsonKey(name: 'on_leave') this.onLeave = false, @JsonKey(name: 'leave_details') final  Map<String, dynamic>? leaveDetails, this.shift, @JsonKey(name: 'current_time') this.currentTime}): _leaveDetails = leaveDetails,super._();
  factory _CurrentStatus.fromJson(Map<String, dynamic> json) => _$CurrentStatusFromJson(json);

@override@JsonKey() final  String status;
@override final  String? notes;
@override@JsonKey(name: 'clock_in') final  String? clockIn;
@override@JsonKey(name: 'clock_out') final  String? clockOut;
@override@JsonKey(name: 'clock_in_time') final  String? clockInTime;
@override@JsonKey(name: 'clock_out_time') final  String? clockOutTime;
@override@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) final  double? totalHours;
@override@JsonKey(name: 'late_minutes') final  int lateMinutes;
@override@JsonKey(name: 'on_leave') final  bool onLeave;
 final  Map<String, dynamic>? _leaveDetails;
@override@JsonKey(name: 'leave_details') Map<String, dynamic>? get leaveDetails {
  final value = _leaveDetails;
  if (value == null) return null;
  if (_leaveDetails is EqualUnmodifiableMapView) return _leaveDetails;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  Shift? shift;
@override@JsonKey(name: 'current_time') final  String? currentTime;

/// Create a copy of CurrentStatus
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CurrentStatusCopyWith<_CurrentStatus> get copyWith => __$CurrentStatusCopyWithImpl<_CurrentStatus>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CurrentStatusToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CurrentStatus&&(identical(other.status, status) || other.status == status)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.clockIn, clockIn) || other.clockIn == clockIn)&&(identical(other.clockOut, clockOut) || other.clockOut == clockOut)&&(identical(other.clockInTime, clockInTime) || other.clockInTime == clockInTime)&&(identical(other.clockOutTime, clockOutTime) || other.clockOutTime == clockOutTime)&&(identical(other.totalHours, totalHours) || other.totalHours == totalHours)&&(identical(other.lateMinutes, lateMinutes) || other.lateMinutes == lateMinutes)&&(identical(other.onLeave, onLeave) || other.onLeave == onLeave)&&const DeepCollectionEquality().equals(other._leaveDetails, _leaveDetails)&&(identical(other.shift, shift) || other.shift == shift)&&(identical(other.currentTime, currentTime) || other.currentTime == currentTime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,status,notes,clockIn,clockOut,clockInTime,clockOutTime,totalHours,lateMinutes,onLeave,const DeepCollectionEquality().hash(_leaveDetails),shift,currentTime);

@override
String toString() {
  return 'CurrentStatus(status: $status, notes: $notes, clockIn: $clockIn, clockOut: $clockOut, clockInTime: $clockInTime, clockOutTime: $clockOutTime, totalHours: $totalHours, lateMinutes: $lateMinutes, onLeave: $onLeave, leaveDetails: $leaveDetails, shift: $shift, currentTime: $currentTime)';
}


}

/// @nodoc
abstract mixin class _$CurrentStatusCopyWith<$Res> implements $CurrentStatusCopyWith<$Res> {
  factory _$CurrentStatusCopyWith(_CurrentStatus value, $Res Function(_CurrentStatus) _then) = __$CurrentStatusCopyWithImpl;
@override @useResult
$Res call({
 String status, String? notes,@JsonKey(name: 'clock_in') String? clockIn,@JsonKey(name: 'clock_out') String? clockOut,@JsonKey(name: 'clock_in_time') String? clockInTime,@JsonKey(name: 'clock_out_time') String? clockOutTime,@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? totalHours,@JsonKey(name: 'late_minutes') int lateMinutes,@JsonKey(name: 'on_leave') bool onLeave,@JsonKey(name: 'leave_details') Map<String, dynamic>? leaveDetails, Shift? shift,@JsonKey(name: 'current_time') String? currentTime
});


@override $ShiftCopyWith<$Res>? get shift;

}
/// @nodoc
class __$CurrentStatusCopyWithImpl<$Res>
    implements _$CurrentStatusCopyWith<$Res> {
  __$CurrentStatusCopyWithImpl(this._self, this._then);

  final _CurrentStatus _self;
  final $Res Function(_CurrentStatus) _then;

/// Create a copy of CurrentStatus
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = null,Object? notes = freezed,Object? clockIn = freezed,Object? clockOut = freezed,Object? clockInTime = freezed,Object? clockOutTime = freezed,Object? totalHours = freezed,Object? lateMinutes = null,Object? onLeave = null,Object? leaveDetails = freezed,Object? shift = freezed,Object? currentTime = freezed,}) {
  return _then(_CurrentStatus(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,clockIn: freezed == clockIn ? _self.clockIn : clockIn // ignore: cast_nullable_to_non_nullable
as String?,clockOut: freezed == clockOut ? _self.clockOut : clockOut // ignore: cast_nullable_to_non_nullable
as String?,clockInTime: freezed == clockInTime ? _self.clockInTime : clockInTime // ignore: cast_nullable_to_non_nullable
as String?,clockOutTime: freezed == clockOutTime ? _self.clockOutTime : clockOutTime // ignore: cast_nullable_to_non_nullable
as String?,totalHours: freezed == totalHours ? _self.totalHours : totalHours // ignore: cast_nullable_to_non_nullable
as double?,lateMinutes: null == lateMinutes ? _self.lateMinutes : lateMinutes // ignore: cast_nullable_to_non_nullable
as int,onLeave: null == onLeave ? _self.onLeave : onLeave // ignore: cast_nullable_to_non_nullable
as bool,leaveDetails: freezed == leaveDetails ? _self._leaveDetails : leaveDetails // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,shift: freezed == shift ? _self.shift : shift // ignore: cast_nullable_to_non_nullable
as Shift?,currentTime: freezed == currentTime ? _self.currentTime : currentTime // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of CurrentStatus
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShiftCopyWith<$Res>? get shift {
    if (_self.shift == null) {
    return null;
  }

  return $ShiftCopyWith<$Res>(_self.shift!, (value) {
    return _then(_self.copyWith(shift: value));
  });
}
}

// dart format on
