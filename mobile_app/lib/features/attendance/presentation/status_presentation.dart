import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../data/models/current_status.dart';

/// Maps backend attendance status codes to display label / color / icon.
///
/// Colours mirror the React module: clocked-in → green, clocked-out → blue,
/// holiday → indigo, leave → blue, everything else → muted. History statuses
/// (present/absent/late/half_day/leave) follow `MyWorkLogs.getStatusBadge`.
class StatusPresentation {
  const StatusPresentation._();

  static String label(String status) {
    switch (status) {
      case AttendanceStatusCode.notClockedIn:
        return 'Not Clocked In';
      case AttendanceStatusCode.clockedIn:
        return 'Clocked In';
      case AttendanceStatusCode.clockedOut:
        return 'Clocked Out';
      case AttendanceStatusCode.onLeave:
        return 'On Leave';
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

  static Color color(String status) {
    switch (status) {
      case AttendanceStatusCode.clockedIn:
      case 'present':
        return AppColors.success;
      case AttendanceStatusCode.clockedOut:
      case AttendanceStatusCode.onLeave:
      case 'leave':
        return AppColors.primary;
      case AttendanceStatusCode.holiday:
        return AppColors.indigo;
      case 'late':
        return AppColors.warning;
      case 'half_day':
        return AppColors.orange;
      case 'absent':
        return AppColors.danger;
      default:
        return AppColors.muted;
    }
  }
}
