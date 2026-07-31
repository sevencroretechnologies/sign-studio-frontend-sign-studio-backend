import 'package:flutter_test/flutter_test.dart';
import 'package:signstudio_attendance/core/models/pagination_meta.dart';
import 'package:signstudio_attendance/features/attendance/data/models/work_log.dart';

void main() {
  group('WorkLog', () {
    test('prefers formatted/time fields for labels', () {
      final log = WorkLog.fromJson({
        'id': 3,
        'log_date': '2026-07-30',
        'log_date_formatted': '30 Jul 2026',
        'clock_in': '2026-07-30 09:01:00',
        'clock_in_time': '09:01',
        'clock_out_time': '18:00',
        'status': 'clocked_out',
        'late_minutes': 1,
        'total_hours': '8.98',
      });

      expect(log.dateLabel, '30 Jul 2026');
      expect(log.clockInLabel, '09:01');
      expect(log.clockOutLabel, '18:00');
      expect(log.totalHours, 8.98);
    });

    test('falls back to placeholders when times missing', () {
      final log = WorkLog.fromJson({'id': 1, 'status': 'absent'});
      expect(log.clockInLabel, '--:--');
      expect(log.clockOutLabel, '--:--');
      expect(log.dateLabel, '—');
    });
  });

  group('PaginatedResponse<WorkLog>', () {
    test('parses flat data list + top-level meta', () {
      final page = PaginatedResponse<WorkLog>.fromJson(
        {
          'success': true,
          'message': 'OK',
          'data': [
            {'id': 1, 'status': 'clocked_out'},
            {'id': 2, 'status': 'clocked_out'},
          ],
          'meta': {
            'current_page': 1,
            'per_page': 15,
            'total': 2,
            'total_pages': 1,
            'has_more_pages': false,
          },
        },
        WorkLog.fromJson,
      );

      expect(page.items, hasLength(2));
      expect(page.items.first.id, 1);
      expect(page.meta.hasMorePages, isFalse);
    });

    test('handles a non-paginated list (no meta)', () {
      final page = PaginatedResponse<WorkLog>.fromJson(
        {
          'success': true,
          'data': [
            {'id': 9, 'status': 'clocked_out'},
          ],
        },
        WorkLog.fromJson,
      );
      expect(page.items, hasLength(1));
      expect(page.meta.hasMorePages, isFalse);
      expect(page.meta.total, 1);
    });
  });
}
