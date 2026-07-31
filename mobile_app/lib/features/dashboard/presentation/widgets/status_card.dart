import 'package:flutter/material.dart';

import '../../../../core/theme/app_cards.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../../../core/widgets/summary_tile.dart';
import '../../../attendance/data/models/current_status.dart';
import '../../../attendance/presentation/status_presentation.dart';

/// "Your Status" card — a centred status badge, mirroring the React status
/// card in `ClockInOutSelf`.
class StatusCard extends StatelessWidget {
  const StatusCard({super.key, required this.status});

  final CurrentStatus status;

  @override
  Widget build(BuildContext context) {
    final color = StatusPresentation.color(status.status);
    return AppCard(
      child: Column(
        children: [
          Text(
            'Your Status',
            textAlign: TextAlign.center,
            style: AppTextStyles.cardTitle,
          ),
          const SizedBox(height: AppSpacing.lg),
          Center(
            child: StatusBadge(
              label: StatusPresentation.label(status.status),
              color: color,
              large: true,
            ),
          ),
          if (status.isOnLeave && status.leaveTitle != null) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              'Leave: ${status.leaveTitle}',
              textAlign: TextAlign.center,
              style: AppTextStyles.cardDescription,
            ),
          ],
        ],
      ),
    );
  }
}

/// "Today's Summary" card — three tiles (Clock In, Clock Out, Total Hours),
/// mirroring the React summary grid.
class TodaySummaryCard extends StatelessWidget {
  const TodaySummaryCard({super.key, required this.status});

  final CurrentStatus status;

  @override
  Widget build(BuildContext context) {
    return AppCard.section(
      title: "Today's Summary",
      child: Row(
        children: [
          Expanded(
            child: SummaryTile(
              icon: Icons.login_rounded,
              iconColor: AppColors.success,
              label: 'Clock In',
              value: status.clockInTime ?? status.clockIn ?? '--:--',
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: SummaryTile(
              icon: Icons.logout_rounded,
              iconColor: AppColors.danger,
              label: 'Clock Out',
              value: status.clockOutTime ?? status.clockOut ?? '--:--',
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: SummaryTile(
              icon: Icons.hourglass_bottom_rounded,
              iconColor: AppColors.primary,
              label: 'Total Hours',
              value: status.totalHours != null
                  ? status.totalHours!.toStringAsFixed(2)
                  : '--',
            ),
          ),
        ],
      ),
    );
  }
}
