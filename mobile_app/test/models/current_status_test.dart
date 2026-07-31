import 'package:flutter_test/flutter_test.dart';
import 'package:signstudio_attendance/features/attendance/data/models/current_status.dart';

void main() {
  group('CurrentStatus', () {
    test('not_clocked_in → can clock in, not out', () {
      const status = CurrentStatus(status: 'not_clocked_in');
      expect(status.canClockIn, isTrue);
      expect(status.canClockOut, isFalse);
    });

    test('clocked_in → can clock out, not in', () {
      const status = CurrentStatus(status: 'clocked_in');
      expect(status.isClockedIn, isTrue);
      expect(status.canClockIn, isFalse);
      expect(status.canClockOut, isTrue);
    });

    test('clocked_out → neither action', () {
      const status = CurrentStatus(status: 'clocked_out');
      expect(status.isClockedOut, isTrue);
      expect(status.canClockIn, isFalse);
      expect(status.canClockOut, isFalse);
    });

    test('on_leave blocks both actions and exposes leave title', () {
      final status = CurrentStatus.fromJson({
        'status': 'clocked_in',
        'on_leave': true,
        'leave_details': {
          'category': {'title': 'Sick Leave'},
        },
      });
      expect(status.isOnLeave, isTrue);
      expect(status.canClockIn, isFalse);
      expect(status.canClockOut, isFalse);
      expect(status.leaveTitle, 'Sick Leave');
    });

    test('parses total_hours from string or num', () {
      final fromString = CurrentStatus.fromJson({
        'status': 'clocked_out',
        'total_hours': '8.50',
      });
      final fromNum = CurrentStatus.fromJson({
        'status': 'clocked_out',
        'total_hours': 8.5,
      });
      expect(fromString.totalHours, 8.5);
      expect(fromNum.totalHours, 8.5);
    });
  });
}
