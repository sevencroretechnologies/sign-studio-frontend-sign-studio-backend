import 'package:freezed_annotation/freezed_annotation.dart';

part 'shift.freezed.dart';
part 'shift.g.dart';

/// Minimal shift info attached to attendance status/logs.
@freezed
abstract class Shift with _$Shift {
  const factory Shift({
    int? id,
    String? name,
    @JsonKey(name: 'start_time') String? startTime,
    @JsonKey(name: 'end_time') String? endTime,
    @JsonKey(name: 'is_night_shift') bool? isNightShift,
  }) = _Shift;

  factory Shift.fromJson(Map<String, dynamic> json) => _$ShiftFromJson(json);
}
