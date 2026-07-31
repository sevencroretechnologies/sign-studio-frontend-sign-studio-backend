import 'package:flutter/material.dart';

import '../../../attendance/data/models/current_status.dart';

/// Primary attendance action for the dashboard.
///
/// Phase 4 renders the correct Clock In / Clock Out / completed / leave state.
/// The camera + GPS handlers are wired in Phases 5–6.
class AttendanceActionButton extends StatelessWidget {
  const AttendanceActionButton({super.key, required this.status});

  final CurrentStatus status;

  void _notImplemented(BuildContext context, String phase) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('This action is implemented in $phase.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (status.canClockIn) {
      return _BigButton(
        label: 'Clock In',
        icon: Icons.login_rounded,
        color: Colors.green.shade600,
        onPressed: () => _notImplemented(context, 'Phase 5'),
      );
    }
    if (status.canClockOut) {
      return _BigButton(
        label: 'Clock Out',
        icon: Icons.logout_rounded,
        color: Theme.of(context).colorScheme.primary,
        onPressed: () => _notImplemented(context, 'Phase 6'),
      );
    }
    if (status.isClockedOut) {
      return const _StateMessage(
        icon: Icons.check_circle_rounded,
        message: 'You have completed today\'s attendance.',
      );
    }
    if (status.isOnLeave) {
      return _StateMessage(
        icon: Icons.beach_access_rounded,
        message: status.leaveTitle != null
            ? 'You are on leave today (${status.leaveTitle}).'
            : 'You are on leave today.',
      );
    }
    return const SizedBox.shrink();
  }
}

class _BigButton extends StatelessWidget {
  const _BigButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: FilledButton.icon(
        style: FilledButton.styleFrom(
          backgroundColor: color,
          textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        onPressed: onPressed,
        icon: Icon(icon, size: 26),
        label: Text(label),
      ),
    );
  }
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: scheme.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}
