import 'package:freezed_annotation/freezed_annotation.dart';

import 'shift.dart';

part 'current_status.freezed.dart';
part 'current_status.g.dart';

/// Attendance status codes returned by `GET /current-status-self`.
class AttendanceStatusCode {
  const AttendanceStatusCode._();

  static const String notClockedIn = 'not_clocked_in';
  static const String clockedIn = 'clocked_in';
  static const String clockedOut = 'clocked_out';
  static const String onLeave = 'on_leave';
  static const String holiday = 'holiday';
}

double? _doubleFromJson(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

/// Current attendance state for the logged-in user, mapped from
/// `GET /current-status-self` and returned by clock in/out.
@freezed
abstract class CurrentStatus with _$CurrentStatus {
  const factory CurrentStatus({
    @Default(AttendanceStatusCode.notClockedIn) String status,
    String? notes,
    @JsonKey(name: 'clock_in') String? clockIn,
    @JsonKey(name: 'clock_out') String? clockOut,
    @JsonKey(name: 'clock_in_time') String? clockInTime,
    @JsonKey(name: 'clock_out_time') String? clockOutTime,
    @JsonKey(name: 'total_hours', fromJson: _doubleFromJson) double? totalHours,
    @JsonKey(name: 'late_minutes') @Default(0) int lateMinutes,
    @JsonKey(name: 'on_leave') @Default(false) bool onLeave,
    @JsonKey(name: 'leave_details') Map<String, dynamic>? leaveDetails,
    Shift? shift,
    @JsonKey(name: 'current_time') String? currentTime,
  }) = _CurrentStatus;

  const CurrentStatus._();

  factory CurrentStatus.fromJson(Map<String, dynamic> json) =>
      _$CurrentStatusFromJson(json);

  bool get isClockedIn => status == AttendanceStatusCode.clockedIn;
  bool get isClockedOut => status == AttendanceStatusCode.clockedOut;
  bool get isHoliday => status == AttendanceStatusCode.holiday;
  bool get isOnLeave => onLeave || status == AttendanceStatusCode.onLeave;
  bool get isNotClockedIn =>
      !isClockedIn && !isClockedOut && !isOnLeave;

  /// Whether the Clock In button should be shown/enabled.
  bool get canClockIn => !isClockedIn && !isClockedOut && !isOnLeave;

  /// Whether the Clock Out button should be shown/enabled.
  bool get canClockOut => isClockedIn && !isOnLeave;

  String? get leaveTitle {
    final category = leaveDetails?['category'];
    if (category is Map && category['title'] is String) {
      return category['title'] as String;
    }
    return null;
  }
}
