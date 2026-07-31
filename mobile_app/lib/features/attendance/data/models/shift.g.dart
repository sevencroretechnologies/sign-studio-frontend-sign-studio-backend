// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shift.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Shift _$ShiftFromJson(Map<String, dynamic> json) => _Shift(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String?,
  startTime: json['start_time'] as String?,
  endTime: json['end_time'] as String?,
  isNightShift: json['is_night_shift'] as bool?,
);

Map<String, dynamic> _$ShiftToJson(_Shift instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'start_time': instance.startTime,
  'end_time': instance.endTime,
  'is_night_shift': instance.isNightShift,
};
