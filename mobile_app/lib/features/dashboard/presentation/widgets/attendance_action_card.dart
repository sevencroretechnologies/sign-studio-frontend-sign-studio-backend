import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_buttons.dart';
import '../../../../core/theme/app_cards.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/app_notice.dart';
import '../../../attendance/data/models/current_status.dart';
import '../../../attendance/presentation/pages/clock_action_page.dart';

/// "Quick Actions" card on the dashboard.
///
/// Mirrors the React `ClockInOutSelf` Quick Actions card: a geofence notice and
/// a large Clock In / Clock Out action, or a completed / on-leave state. The
/// button opens [ClockActionPage] (which owns the GPS + manual selfie flow)
/// rather than opening the camera directly.
class AttendanceActionCard extends ConsumerWidget {
  const AttendanceActionCard({super.key, required this.status});

  final CurrentStatus status;

  Future<void> _openAction(
    BuildContext context,
    WidgetRef ref,
    ClockAction action,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final result = await Navigator.of(context).push<ClockResult>(
      MaterialPageRoute(
        builder: (_) => ClockActionPage(action: action, status: status),
      ),
    );
    if (result == null) return;
    messenger.showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor:
            result.success ? AppColors.success : AppColors.danger,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (status.isClockedOut) {
      return const _CompletedState();
    }
    if (status.isOnLeave) {
      return _LeaveState(leaveTitle: status.leaveTitle);
    }

    final canClockIn = status.canClockIn;
    final action = canClockIn ? ClockAction.clockIn : ClockAction.clockOut;

    return AppCard.section(
      title: 'Quick Actions',
      description: canClockIn
          ? 'Use the button below to record your attendance for today.'
          : 'You are clocked in. Clock out when you finish for the day.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AppNotice(
            message:
                'Your GPS location will be verified before clocking in or '
                'out. Please ensure location access is enabled.',
            icon: Icons.location_on_outlined,
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: action.title,
            icon: canClockIn ? Icons.login_rounded : Icons.logout_rounded,
            variant: canClockIn
                ? AppButtonVariant.success
                : AppButtonVariant.dangerOutline,
            size: AppButtonSize.large,
            onPressed: () => _openAction(context, ref, action),
          ),
        ],
      ),
    );
  }
}

extension on ClockAction {
  String get title =>
      this == ClockAction.clockIn ? 'Clock In' : 'Clock Out';
}

class _CompletedState extends StatelessWidget {
  const _CompletedState();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          const Icon(
            Icons.check_circle_rounded,
            size: AppDimensions.iconHero,
            color: AppColors.success,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Attendance Completed for Today',
            textAlign: TextAlign.center,
            style: AppTextStyles.cardTitle,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'You have successfully recorded your clock in and clock out for '
            'today.',
            textAlign: TextAlign.center,
            style: AppTextStyles.cardDescription,
          ),
        ],
      ),
    );
  }
}

class _LeaveState extends StatelessWidget {
  const _LeaveState({required this.leaveTitle});

  final String? leaveTitle;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          const Icon(
            Icons.event_available_rounded,
            size: AppDimensions.iconHero,
            color: AppColors.primary,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'On Approved Leave',
            textAlign: TextAlign.center,
            style: AppTextStyles.cardTitle,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            leaveTitle != null
                ? 'You are on "$leaveTitle" leave today. Clock in/out is '
                    'disabled for today.'
                : 'You are on approved leave today. Clock in/out is disabled '
                    'for today.',
            textAlign: TextAlign.center,
            style: AppTextStyles.cardDescription,
          ),
        ],
      ),
    );
  }
}
