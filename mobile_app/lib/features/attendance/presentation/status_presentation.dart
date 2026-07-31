import 'package:flutter/material.dart';

import '../data/models/current_status.dart';

/// Maps backend attendance status codes to display label / color / icon.
class StatusPresentation {
  const StatusPresentation._();

  static String label(String status) {
    switch (status) {
      case AttendanceStatusCode.notClockedIn:
        return 'Not clocked in';
      case AttendanceStatusCode.clockedIn:
        return 'Clocked in';
      case AttendanceStatusCode.clockedOut:
        return 'Clocked out';
      case AttendanceStatusCode.onLeave:
        return 'On leave';
      case AttendanceStatusCode.holiday:
        return 'Holiday';
      default:
        return status
            .replaceAll('_', ' ')
            .replaceFirstMapped(RegExp('^.'), (m) => m.group(0)!.toUpperCase());
    }
  }

  static IconData icon(String status) {
    switch (status) {
      case AttendanceStatusCode.clockedIn:
        return Icons.login_rounded;
      case AttendanceStatusCode.clockedOut:
        return Icons.logout_rounded;
      case AttendanceStatusCode.onLeave:
        return Icons.beach_access_rounded;
      case AttendanceStatusCode.holiday:
        return Icons.celebration_rounded;
      default:
        return Icons.schedule_rounded;
    }
  }

  static Color color(BuildContext context, String status) {
    final scheme = Theme.of(context).colorScheme;
    switch (status) {
      case AttendanceStatusCode.clockedIn:
        return Colors.green.shade600;
      case AttendanceStatusCode.clockedOut:
        return scheme.primary;
      case AttendanceStatusCode.onLeave:
        return Colors.orange.shade700;
      case AttendanceStatusCode.holiday:
        return Colors.purple.shade400;
      default:
        return scheme.onSurfaceVariant;
    }
  }
}
