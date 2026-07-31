import 'package:flutter_test/flutter_test.dart';
import 'package:signstudio_attendance/core/models/api_response.dart';
import 'package:signstudio_attendance/core/models/pagination_meta.dart';

void main() {
  group('ApiResponse', () {
    test('parses a success envelope with object data', () {
      final res = ApiResponse<Map<String, dynamic>>.fromJson(
        {
          'success': true,
          'message': 'OK',
          'data': {'a': 1},
        },
        (data) => (data as Map).cast<String, dynamic>(),
      );

      expect(res.success, isTrue);
      expect(res.message, 'OK');
      expect(res.data, {'a': 1});
      expect(res.errors, isNull);
    });

    test('handles null data without calling fromData', () {
      var called = false;
      final res = ApiResponse<Object>.fromJson(
        {'success': false, 'message': 'nope', 'data': null},
        (data) {
          called = true;
          return data!;
        },
      );

      expect(called, isFalse);
      expect(res.data, isNull);
      expect(res.success, isFalse);
    });

    test('parses validation errors', () {
      final res = ApiResponse<Object>.fromJson(
        {
          'success': false,
          'message': 'The given data was invalid.',
          'errors': {
            'email': ['The email field is required.'],
          },
        },
        (data) => data!,
      );

      expect(res.errors, isNotNull);
      expect(res.errors!['email'], ['The email field is required.']);
    });
  });

  group('PaginationMeta', () {
    test('reads total_pages / has_more_pages', () {
      final meta = PaginationMeta.fromJson({
        'current_page': 1,
        'per_page': 10,
        'total': 42,
        'total_pages': 5,
        'has_more_pages': true,
        'from': 1,
        'to': 10,
      });

      expect(meta.currentPage, 1);
      expect(meta.totalPages, 5);
      expect(meta.hasMorePages, isTrue);
    });

    test('falls back to last_page and derives has_more_pages', () {
      final meta = PaginationMeta.fromJson({
        'current_page': 2,
        'per_page': 10,
        'total': 25,
        'last_page': 3,
      });

      expect(meta.totalPages, 3);
      expect(meta.hasMorePages, isTrue); // 2 < 3
    });
  });
}
