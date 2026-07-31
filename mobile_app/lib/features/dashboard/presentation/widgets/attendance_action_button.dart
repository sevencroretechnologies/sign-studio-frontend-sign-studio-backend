import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../../core/api/api_exception.dart';
import '../../../../core/services/location_service.dart';
import '../../../attendance/application/current_status_controller.dart';
import '../../../attendance/data/attendance_repository.dart';
import '../../../attendance/data/models/current_status.dart';
import '../../../attendance/presentation/pages/selfie_capture_page.dart';

/// Primary attendance action for the dashboard.
///
/// Clock In runs the full flow: fresh GPS → front-camera selfie → base64 →
/// submit → refresh status. Clock Out is wired in Phase 6.
class AttendanceActionButton extends ConsumerStatefulWidget {
  const AttendanceActionButton({super.key, required this.status});

  final CurrentStatus status;

  @override
  ConsumerState<AttendanceActionButton> createState() =>
      _AttendanceActionButtonState();
}

class _AttendanceActionButtonState
    extends ConsumerState<AttendanceActionButton> {
  bool _busy = false;

  Future<void> _clockIn() {
    return _runFlow(
      title: 'Clock In',
      submit: (repo, pos, image) => repo.clockInSelf(
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        image: image,
      ),
    );
  }

  Future<void> _runFlow({
    required String title,
    required Future<String> Function(
      AttendanceRepository repo,
      Position pos,
      String image,
    ) submit,
  }) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _busy = true);
    try {
      final position = await _showBlocking(
        'Getting your location…',
        () => ref.read(locationServiceProvider).getCurrentPosition(),
      );

      final cameraStatus = await Permission.camera.request();
      if (!cameraStatus.isGranted) {
        _showMessage(
          messenger,
          'Camera permission is required to record attendance.',
        );
        return;
      }

      if (!mounted) return;
      final bytes = await Navigator.of(context).push<Uint8List>(
        MaterialPageRoute(builder: (_) => SelfieCapturePage(title: title)),
      );
      if (bytes == null) return; // user cancelled

      final image = base64Encode(bytes);
      final message = await _showBlocking(
        'Submitting…',
        () => submit(ref.read(attendanceRepositoryProvider), position, image),
      );

      await ref.read(currentStatusControllerProvider.notifier).refresh();
      _showMessage(messenger, message, success: true);
    } on LocationException catch (e) {
      _showMessage(messenger, e.message);
    } on ApiException catch (e) {
      _showMessage(messenger, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Runs [action] behind a non-dismissible progress dialog.
  Future<T> _showBlocking<T>(String label, Future<T> Function() action) async {
    final navigator = Navigator.of(context, rootNavigator: true);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      useRootNavigator: true,
      builder: (_) => _ProgressDialog(label: label),
    );
    try {
      return await action();
    } finally {
      if (mounted) navigator.pop();
    }
  }

  void _showMessage(
    ScaffoldMessengerState messenger,
    String message, {
    bool success = false,
  }) {
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: success ? Colors.green.shade700 : null,
      ),
    );
  }

  void _notImplemented(String phase) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('This action is implemented in $phase.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.status;

    if (status.canClockIn) {
      return _BigButton(
        label: 'Clock In',
        icon: Icons.login_rounded,
        color: Colors.green.shade600,
        busy: _busy,
        onPressed: _clockIn,
      );
    }
    if (status.canClockOut) {
      return _BigButton(
        label: 'Clock Out',
        icon: Icons.logout_rounded,
        color: Theme.of(context).colorScheme.primary,
        busy: _busy,
        onPressed: () => _notImplemented('Phase 6'),
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
    required this.busy,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool busy;
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
        onPressed: busy ? null : onPressed,
        icon: busy
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Icon(icon, size: 26),
        label: Text(busy ? 'Please wait…' : label),
      ),
    );
  }
}

class _ProgressDialog extends StatelessWidget {
  const _ProgressDialog({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Row(
        children: [
          const SizedBox(
            height: 24,
            width: 24,
            child: CircularProgressIndicator(strokeWidth: 2.5),
          ),
          const SizedBox(width: 20),
          Expanded(child: Text(label)),
        ],
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
