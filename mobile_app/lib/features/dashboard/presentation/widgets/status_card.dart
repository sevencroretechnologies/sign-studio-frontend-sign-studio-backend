import 'package:flutter/material.dart';

import '../../../attendance/data/models/current_status.dart';
import '../../../attendance/presentation/status_presentation.dart';

/// Card summarizing the current attendance status: badge, clock in/out times,
/// total hours, late minutes and leave info.
class StatusCard extends StatelessWidget {
  const StatusCard({super.key, required this.status});

  final CurrentStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = StatusPresentation.color(context, status.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: color.withValues(alpha: 0.15),
                  child: Icon(
                    StatusPresentation.icon(status.status),
                    color: color,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Today\'s status',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        StatusPresentation.label(status.status),
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: color,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (status.isOnLeave && status.leaveTitle != null) ...[
              const SizedBox(height: 12),
              Text('Leave: ${status.leaveTitle}'),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _TimeTile(
                    label: 'Clock In',
                    value: status.clockInTime ?? status.clockIn ?? '--:--',
                    icon: Icons.login_rounded,
                  ),
                ),
                Expanded(
                  child: _TimeTile(
                    label: 'Clock Out',
                    value: status.clockOutTime ?? status.clockOut ?? '--:--',
                    icon: Icons.logout_rounded,
                  ),
                ),
              ],
            ),
            if (status.totalHours != null || status.lateMinutes > 0) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (status.totalHours != null)
                    _Chip(
                      icon: Icons.hourglass_bottom_rounded,
                      label:
                          '${status.totalHours!.toStringAsFixed(2)} hrs',
                    ),
                  if (status.lateMinutes > 0)
                    _Chip(
                      icon: Icons.timer_off_rounded,
                      label: '${status.lateMinutes} min late',
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TimeTile extends StatelessWidget {
  const _TimeTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 6),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 6),
        Text(label, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}
