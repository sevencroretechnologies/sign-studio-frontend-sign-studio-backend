// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'work_log.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_WorkLog _$WorkLogFromJson(Map<String, dynamic> json) => _WorkLog(
  id: (json['id'] as num).toInt(),
  logDate: json['log_date'] as String?,
  logDateFormatted: json['log_date_formatted'] as String?,
  clockIn: json['clock_in'] as String?,
  clockOut: json['clock_out'] as String?,
  clockInTime: json['clock_in_time'] as String?,
  clockOutTime: json['clock_out_time'] as String?,
  status: json['status'] as String? ?? '',
  lateMinutes: (json['late_minutes'] as num?)?.toInt() ?? 0,
  totalHours: _doubleFromJson(json['total_hours']),
  notes: json['notes'] as String?,
);

Map<String, dynamic> _$WorkLogToJson(_WorkLog instance) => <String, dynamic>{
  'id': instance.id,
  'log_date': instance.logDate,
  'log_date_formatted': instance.logDateFormatted,
  'clock_in': instance.clockIn,
  'clock_out': instance.clockOut,
  'clock_in_time': instance.clockInTime,
  'clock_out_time': instance.clockOutTime,
  'status': instance.status,
  'late_minutes': instance.lateMinutes,
  'total_hours': instance.totalHours,
  'notes': instance.notes,
};
