import 'package:flutter/material.dart';

import '../../../../core/theme/app_cards.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/status_badge.dart';

/// A single attendance-history record card: date + status badge, clock in/out
/// and optional total hours / late minutes. Mirrors a React work-log row
/// adapted to a mobile card.
class WorkLogTile extends StatelessWidget {
  const WorkLogTile({
    super.key,
    required this.dateLabel,
    required this.clockIn,
    required this.clockOut,
    required this.statusLabel,
    required this.statusColor,
    required this.lateMinutes,
    required this.totalHours,
  });

  final String dateLabel;
  final String clockIn;
  final String clockOut;
  final String statusLabel;
  final Color statusColor;
  final int lateMinutes;
  final double? totalHours;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.calendar_today_rounded,
                size: 16,
                color: AppColors.muted,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(dateLabel, style: AppTextStyles.tileValue),
              ),
              StatusBadge(label: statusLabel, color: statusColor),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(height: 1),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _TimeCell(
                  icon: Icons.login_rounded,
                  iconColor: AppColors.success,
                  label: 'Clock In',
                  value: clockIn,
                ),
              ),
              Expanded(
                child: _TimeCell(
                  icon: Icons.logout_rounded,
                  iconColor: AppColors.danger,
                  label: 'Clock Out',
                  value: clockOut,
                ),
              ),
              if (totalHours != null)
                Expanded(
                  child: _TimeCell(
                    icon: Icons.hourglass_bottom_rounded,
                    iconColor: AppColors.primary,
                    label: 'Hours',
                    value: totalHours!.toStringAsFixed(2),
                  ),
                ),
            ],
          ),
          if (lateMinutes > 0) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              '$lateMinutes min late',
              style: AppTextStyles.tileLabel.copyWith(color: AppColors.warning),
            ),
          ],
        ],
      ),
    );
  }
}

class _TimeCell extends StatelessWidget {
  const _TimeCell({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 15, color: iconColor),
            const SizedBox(width: AppSpacing.xs),
            Text(label, style: AppTextStyles.tileLabel),
          ],
        ),
        const SizedBox(height: 2),
        Text(value, style: AppTextStyles.tileValue.copyWith(fontSize: 15)),
      ],
    );
  }
}
