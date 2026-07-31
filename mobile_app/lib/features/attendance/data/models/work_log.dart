import 'package:freezed_annotation/freezed_annotation.dart';

part 'work_log.freezed.dart';
part 'work_log.g.dart';

double? _doubleFromJson(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

/// A single attendance record from `GET /my-logs`.
@freezed
abstract class WorkLog with _$WorkLog {
  const factory WorkLog({
    required int id,
    @JsonKey(name: 'log_date') String? logDate,
    @JsonKey(name: 'log_date_formatted') String? logDateFormatted,
    @JsonKey(name: 'clock_in') String? clockIn,
    @JsonKey(name: 'clock_out') String? clockOut,
    @JsonKey(name: 'clock_in_time') String? clockInTime,
    @JsonKey(name: 'clock_out_time') String? clockOutTime,
    @Default('') String status,
    @JsonKey(name: 'late_minutes') @Default(0) int lateMinutes,
    @JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? totalHours,
    String? notes,
  }) = _WorkLog;

  const WorkLog._();

  factory WorkLog.fromJson(Map<String, dynamic> json) =>
      _$WorkLogFromJson(json);

  String get dateLabel => logDateFormatted ?? logDate ?? '—';
  String get clockInLabel => clockInTime ?? clockIn ?? '--:--';
  String get clockOutLabel => clockOutTime ?? clockOut ?? '--:--';
}
