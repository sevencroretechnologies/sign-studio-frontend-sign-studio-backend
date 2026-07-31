// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'work_log.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$WorkLog {

 int get id;@JsonKey(name: 'log_date') String? get logDate;@JsonKey(name: 'log_date_formatted') String? get logDateFormatted;@JsonKey(name: 'clock_in') String? get clockIn;@JsonKey(name: 'clock_out') String? get clockOut;@JsonKey(name: 'clock_in_time') String? get clockInTime;@JsonKey(name: 'clock_out_time') String? get clockOutTime; String get status;@JsonKey(name: 'late_minutes') int get lateMinutes;@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? get totalHours; String? get notes;
/// Create a copy of WorkLog
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WorkLogCopyWith<WorkLog> get copyWith => _$WorkLogCopyWithImpl<WorkLog>(this as WorkLog, _$identity);

  /// Serializes this WorkLog to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WorkLog&&(identical(other.id, id) || other.id == id)&&(identical(other.logDate, logDate) || other.logDate == logDate)&&(identical(other.logDateFormatted, logDateFormatted) || other.logDateFormatted == logDateFormatted)&&(identical(other.clockIn, clockIn) || other.clockIn == clockIn)&&(identical(other.clockOut, clockOut) || other.clockOut == clockOut)&&(identical(other.clockInTime, clockInTime) || other.clockInTime == clockInTime)&&(identical(other.clockOutTime, clockOutTime) || other.clockOutTime == clockOutTime)&&(identical(other.status, status) || other.status == status)&&(identical(other.lateMinutes, lateMinutes) || other.lateMinutes == lateMinutes)&&(identical(other.totalHours, totalHours) || other.totalHours == totalHours)&&(identical(other.notes, notes) || other.notes == notes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,logDate,logDateFormatted,clockIn,clockOut,clockInTime,clockOutTime,status,lateMinutes,totalHours,notes);

@override
String toString() {
  return 'WorkLog(id: $id, logDate: $logDate, logDateFormatted: $logDateFormatted, clockIn: $clockIn, clockOut: $clockOut, clockInTime: $clockInTime, clockOutTime: $clockOutTime, status: $status, lateMinutes: $lateMinutes, totalHours: $totalHours, notes: $notes)';
}


}

/// @nodoc
abstract mixin class $WorkLogCopyWith<$Res>  {
  factory $WorkLogCopyWith(WorkLog value, $Res Function(WorkLog) _then) = _$WorkLogCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'log_date') String? logDate,@JsonKey(name: 'log_date_formatted') String? logDateFormatted,@JsonKey(name: 'clock_in') String? clockIn,@JsonKey(name: 'clock_out') String? clockOut,@JsonKey(name: 'clock_in_time') String? clockInTime,@JsonKey(name: 'clock_out_time') String? clockOutTime, String status,@JsonKey(name: 'late_minutes') int lateMinutes,@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? totalHours, String? notes
});




}
/// @nodoc
class _$WorkLogCopyWithImpl<$Res>
    implements $WorkLogCopyWith<$Res> {
  _$WorkLogCopyWithImpl(this._self, this._then);

  final WorkLog _self;
  final $Res Function(WorkLog) _then;

/// Create a copy of WorkLog
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? logDate = freezed,Object? logDateFormatted = freezed,Object? clockIn = freezed,Object? clockOut = freezed,Object? clockInTime = freezed,Object? clockOutTime = freezed,Object? status = null,Object? lateMinutes = null,Object? totalHours = freezed,Object? notes = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,logDate: freezed == logDate ? _self.logDate : logDate // ignore: cast_nullable_to_non_nullable
as String?,logDateFormatted: freezed == logDateFormatted ? _self.logDateFormatted : logDateFormatted // ignore: cast_nullable_to_non_nullable
as String?,clockIn: freezed == clockIn ? _self.clockIn : clockIn // ignore: cast_nullable_to_non_nullable
as String?,clockOut: freezed == clockOut ? _self.clockOut : clockOut // ignore: cast_nullable_to_non_nullable
as String?,clockInTime: freezed == clockInTime ? _self.clockInTime : clockInTime // ignore: cast_nullable_to_non_nullable
as String?,clockOutTime: freezed == clockOutTime ? _self.clockOutTime : clockOutTime // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,lateMinutes: null == lateMinutes ? _self.lateMinutes : lateMinutes // ignore: cast_nullable_to_non_nullable
as int,totalHours: freezed == totalHours ? _self.totalHours : totalHours // ignore: cast_nullable_to_non_nullable
as double?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [WorkLog].
extension WorkLogPatterns on WorkLog {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WorkLog value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WorkLog() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WorkLog value)  $default,){
final _that = this;
switch (_that) {
case _WorkLog():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WorkLog value)?  $default,){
final _that = this;
switch (_that) {
case _WorkLog() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'log_date')  String? logDate, @JsonKey(name: 'log_date_formatted')  String? logDateFormatted, @JsonKey(name: 'clock_in')  String? clockIn, @JsonKey(name: 'clock_out')  String? clockOut, @JsonKey(name: 'clock_in_time')  String? clockInTime, @JsonKey(name: 'clock_out_time')  String? clockOutTime,  String status, @JsonKey(name: 'late_minutes')  int lateMinutes, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson)  double? totalHours,  String? notes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WorkLog() when $default != null:
return $default(_that.id,_that.logDate,_that.logDateFormatted,_that.clockIn,_that.clockOut,_that.clockInTime,_that.clockOutTime,_that.status,_that.lateMinutes,_that.totalHours,_that.notes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'log_date')  String? logDate, @JsonKey(name: 'log_date_formatted')  String? logDateFormatted, @JsonKey(name: 'clock_in')  String? clockIn, @JsonKey(name: 'clock_out')  String? clockOut, @JsonKey(name: 'clock_in_time')  String? clockInTime, @JsonKey(name: 'clock_out_time')  String? clockOutTime,  String status, @JsonKey(name: 'late_minutes')  int lateMinutes, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson)  double? totalHours,  String? notes)  $default,) {final _that = this;
switch (_that) {
case _WorkLog():
return $default(_that.id,_that.logDate,_that.logDateFormatted,_that.clockIn,_that.clockOut,_that.clockInTime,_that.clockOutTime,_that.status,_that.lateMinutes,_that.totalHours,_that.notes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'log_date')  String? logDate, @JsonKey(name: 'log_date_formatted')  String? logDateFormatted, @JsonKey(name: 'clock_in')  String? clockIn, @JsonKey(name: 'clock_out')  String? clockOut, @JsonKey(name: 'clock_in_time')  String? clockInTime, @JsonKey(name: 'clock_out_time')  String? clockOutTime,  String status, @JsonKey(name: 'late_minutes')  int lateMinutes, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson)  double? totalHours,  String? notes)?  $default,) {final _that = this;
switch (_that) {
case _WorkLog() when $default != null:
return $default(_that.id,_that.logDate,_that.logDateFormatted,_that.clockIn,_that.clockOut,_that.clockInTime,_that.clockOutTime,_that.status,_that.lateMinutes,_that.totalHours,_that.notes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WorkLog extends WorkLog {
  const _WorkLog({required this.id, @JsonKey(name: 'log_date') this.logDate, @JsonKey(name: 'log_date_formatted') this.logDateFormatted, @JsonKey(name: 'clock_in') this.clockIn, @JsonKey(name: 'clock_out') this.clockOut, @JsonKey(name: 'clock_in_time') this.clockInTime, @JsonKey(name: 'clock_out_time') this.clockOutTime, this.status = '', @JsonKey(name: 'late_minutes') this.lateMinutes = 0, @JsonKey(name: 'total_hours', fromJson: _doubleFromJson) this.totalHours, this.notes}): super._();
  factory _WorkLog.fromJson(Map<String, dynamic> json) => _$WorkLogFromJson(json);

@override final  int id;
@override@JsonKey(name: 'log_date') final  String? logDate;
@override@JsonKey(name: 'log_date_formatted') final  String? logDateFormatted;
@override@JsonKey(name: 'clock_in') final  String? clockIn;
@override@JsonKey(name: 'clock_out') final  String? clockOut;
@override@JsonKey(name: 'clock_in_time') final  String? clockInTime;
@override@JsonKey(name: 'clock_out_time') final  String? clockOutTime;
@override@JsonKey() final  String status;
@override@JsonKey(name: 'late_minutes') final  int lateMinutes;
@override@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) final  double? totalHours;
@override final  String? notes;

/// Create a copy of WorkLog
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WorkLogCopyWith<_WorkLog> get copyWith => __$WorkLogCopyWithImpl<_WorkLog>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WorkLogToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _WorkLog&&(identical(other.id, id) || other.id == id)&&(identical(other.logDate, logDate) || other.logDate == logDate)&&(identical(other.logDateFormatted, logDateFormatted) || other.logDateFormatted == logDateFormatted)&&(identical(other.clockIn, clockIn) || other.clockIn == clockIn)&&(identical(other.clockOut, clockOut) || other.clockOut == clockOut)&&(identical(other.clockInTime, clockInTime) || other.clockInTime == clockInTime)&&(identical(other.clockOutTime, clockOutTime) || other.clockOutTime == clockOutTime)&&(identical(other.status, status) || other.status == status)&&(identical(other.lateMinutes, lateMinutes) || other.lateMinutes == lateMinutes)&&(identical(other.totalHours, totalHours) || other.totalHours == totalHours)&&(identical(other.notes, notes) || other.notes == notes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,logDate,logDateFormatted,clockIn,clockOut,clockInTime,clockOutTime,status,lateMinutes,totalHours,notes);

@override
String toString() {
  return 'WorkLog(id: $id, logDate: $logDate, logDateFormatted: $logDateFormatted, clockIn: $clockIn, clockOut: $clockOut, clockInTime: $clockInTime, clockOutTime: $clockOutTime, status: $status, lateMinutes: $lateMinutes, totalHours: $totalHours, notes: $notes)';
}


}

/// @nodoc
abstract mixin class _$WorkLogCopyWith<$Res> implements $WorkLogCopyWith<$Res> {
  factory _$WorkLogCopyWith(_WorkLog value, $Res Function(_WorkLog) _then) = __$WorkLogCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'log_date') String? logDate,@JsonKey(name: 'log_date_formatted') String? logDateFormatted,@JsonKey(name: 'clock_in') String? clockIn,@JsonKey(name: 'clock_out') String? clockOut,@JsonKey(name: 'clock_in_time') String? clockInTime,@JsonKey(name: 'clock_out_time') String? clockOutTime, String status,@JsonKey(name: 'late_minutes') int lateMinutes,@JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? totalHours, String? notes
});




}
/// @nodoc
class __$WorkLogCopyWithImpl<$Res>
    implements _$WorkLogCopyWith<$Res> {
  __$WorkLogCopyWithImpl(this._self, this._then);

  final _WorkLog _self;
  final $Res Function(_WorkLog) _then;

/// Create a copy of WorkLog
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? logDate = freezed,Object? logDateFormatted = freezed,Object? clockIn = freezed,Object? clockOut = freezed,Object? clockInTime = freezed,Object? clockOutTime = freezed,Object? status = null,Object? lateMinutes = null,Object? totalHours = freezed,Object? notes = freezed,}) {
  return _then(_WorkLog(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,logDate: freezed == logDate ? _self.logDate : logDate // ignore: cast_nullable_to_non_nullable
as String?,logDateFormatted: freezed == logDateFormatted ? _self.logDateFormatted : logDateFormatted // ignore: cast_nullable_to_non_nullable
as String?,clockIn: freezed == clockIn ? _self.clockIn : clockIn // ignore: cast_nullable_to_non_nullable
as String?,clockOut: freezed == clockOut ? _self.clockOut : clockOut // ignore: cast_nullable_to_non_nullable
as String?,clockInTime: freezed == clockInTime ? _self.clockInTime : clockInTime // ignore: cast_nullable_to_non_nullable
as String?,clockOutTime: freezed == clockOutTime ? _self.clockOutTime : clockOutTime // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,lateMinutes: null == lateMinutes ? _self.lateMinutes : lateMinutes // ignore: cast_nullable_to_non_nullable
as int,totalHours: freezed == totalHours ? _self.totalHours : totalHours // ignore: cast_nullable_to_non_nullable
as double?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
