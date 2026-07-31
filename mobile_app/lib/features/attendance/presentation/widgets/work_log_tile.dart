import 'package:flutter/material.dart';

/// A single attendance-history row: date, clock in/out, status badge and
/// optional total hours / late minutes.
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
    final theme = Theme.of(context);
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    dateLabel,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _StatusBadge(label: statusLabel, color: statusColor),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _TimeCell(
                    icon: Icons.login_rounded,
                    label: 'In',
                    value: clockIn,
                  ),
                ),
                Expanded(
                  child: _TimeCell(
                    icon: Icons.logout_rounded,
                    label: 'Out',
                    value: clockOut,
                  ),
                ),
                if (totalHours != null)
                  Expanded(
                    child: _TimeCell(
                      icon: Icons.hourglass_bottom_rounded,
                      label: 'Hours',
                      value: totalHours!.toStringAsFixed(2),
                    ),
                  ),
              ],
            ),
            if (lateMinutes > 0) ...[
              const SizedBox(height: 8),
              Text(
                '$lateMinutes min late',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _TimeCell extends StatelessWidget {
  const _TimeCell({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 15, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 4),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(value, style: theme.textTheme.titleSmall),
      ],
    );
  }
}
