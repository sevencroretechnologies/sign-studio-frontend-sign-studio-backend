// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'current_status.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CurrentStatus _$CurrentStatusFromJson(Map<String, dynamic> json) =>
    _CurrentStatus(
      status: json['status'] as String? ?? AttendanceStatusCode.notClockedIn,
      notes: json['notes'] as String?,
      clockIn: json['clock_in'] as String?,
      clockOut: json['clock_out'] as String?,
      clockInTime: json['clock_in_time'] as String?,
      clockOutTime: json['clock_out_time'] as String?,
      totalHours: _doubleFromJson(json['total_hours']),
      lateMinutes: (json['late_minutes'] as num?)?.toInt() ?? 0,
      onLeave: json['on_leave'] as bool? ?? false,
      leaveDetails: json['leave_details'] as Map<String, dynamic>?,
      shift: json['shift'] == null
          ? null
          : Shift.fromJson(json['shift'] as Map<String, dynamic>),
      currentTime: json['current_time'] as String?,
    );

Map<String, dynamic> _$CurrentStatusToJson(_CurrentStatus instance) =>
    <String, dynamic>{
      'status': instance.status,
      'notes': instance.notes,
      'clock_in': instance.clockIn,
      'clock_out': instance.clockOut,
      'clock_in_time': instance.clockInTime,
      'clock_out_time': instance.clockOutTime,
      'total_hours': instance.totalHours,
      'late_minutes': instance.lateMinutes,
      'on_leave': instance.onLeave,
      'leave_details': instance.leaveDetails,
      'shift': instance.shift,
      'current_time': instance.currentTime,
    };
