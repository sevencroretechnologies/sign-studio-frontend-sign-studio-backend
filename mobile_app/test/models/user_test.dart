import 'package:flutter_test/flutter_test.dart';
import 'package:signstudio_attendance/features/auth/data/models/auth_session.dart';
import 'package:signstudio_attendance/features/auth/data/models/user.dart';

void main() {
  group('User', () {
    test('maps snake_case fields and staff_member_id', () {
      final user = User.fromJson({
        'id': 7,
        'name': 'Asha',
        'email': 'asha@example.com',
        'role': 'employee',
        'role_display': 'Employee',
        'staff_member_id': 12,
        'organization_name': 'Acme',
        'company_name': 'Acme Co',
        'roles': ['employee'],
        'permissions': ['attendance.self'],
      });

      expect(user.id, 7);
      expect(user.roleDisplay, 'Employee');
      expect(user.staffMemberId, 12);
      expect(user.hasStaffMember, isTrue);
      expect(user.organizationName, 'Acme');
    });

    test('hasStaffMember is false when staff_member_id is missing', () {
      final user = User.fromJson({
        'id': 1,
        'name': 'Admin',
        'email': 'admin@example.com',
      });
      expect(user.staffMemberId, isNull);
      expect(user.hasStaffMember, isFalse);
    });
  });

  group('AuthSession', () {
    test('reads token then falls back to access_token', () {
      final session = AuthSession.fromJson({
        'access_token': 'abc123',
        'token_type': 'Bearer',
        'user': {'id': 1, 'name': 'A', 'email': 'a@b.c'},
      });
      expect(session.token, 'abc123');
      expect(session.user.name, 'A');
    });

    test('throws when token is missing', () {
      expect(
        () => AuthSession.fromJson({
          'user': {'id': 1, 'name': 'A', 'email': 'a@b.c'},
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
