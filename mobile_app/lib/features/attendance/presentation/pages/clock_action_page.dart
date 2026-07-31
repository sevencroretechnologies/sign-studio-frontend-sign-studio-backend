import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../../core/api/api_exception.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/theme/app_buttons.dart';
import '../../../../core/theme/app_cards.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/app_notice.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../../../core/widgets/summary_tile.dart';
import '../../application/current_status_controller.dart';
import '../../data/attendance_repository.dart';
import '../../data/models/current_status.dart';
import '../status_presentation.dart';
import 'selfie_capture_page.dart';

/// Which attendance action this screen performs.
enum ClockAction { clockIn, clockOut }

extension on ClockAction {
  String get title =>
      this == ClockAction.clockIn ? 'Clock In' : 'Clock Out';
  IconData get icon =>
      this == ClockAction.clockIn ? Icons.login_rounded : Icons.logout_rounded;
  AppButtonVariant get variant => this == ClockAction.clockIn
      ? AppButtonVariant.success
      : AppButtonVariant.dangerOutline;
}

/// Clock In / Clock Out screen.
///
/// Redesigned per the requested flow: the camera never opens automatically.
/// The user first sees the current status, then acquires GPS and taps
/// "Capture Selfie" to open the front camera, reviews (and can retake) the
/// captured selfie, and only then can submit. The backend `message` is shown
/// verbatim; no client-side geofence/accuracy validation is performed.
class ClockActionPage extends ConsumerStatefulWidget {
  const ClockActionPage({
    super.key,
    required this.action,
    required this.status,
  });

  final ClockAction action;
  final CurrentStatus status;

  @override
  ConsumerState<ClockActionPage> createState() => _ClockActionPageState();
}

class _ClockActionPageState extends ConsumerState<ClockActionPage> {
  Position? _position;
  bool _gpsLoading = false;
  String? _gpsError;

  Uint8List? _selfie;
  bool _submitting = false;

  bool get _ready => _position != null && _selfie != null && !_submitting;

  @override
  void initState() {
    super.initState();
    _acquireLocation();
  }

  Future<void> _acquireLocation() async {
    setState(() {
      _gpsLoading = true;
      _gpsError = null;
    });
    try {
      final position =
          await ref.read(locationServiceProvider).getCurrentPosition();
      if (!mounted) return;
      setState(() => _position = position);
    } on LocationException catch (e) {
      if (!mounted) return;
      setState(() => _gpsError = e.message);
    } finally {
      if (mounted) setState(() => _gpsLoading = false);
    }
  }

  Future<void> _captureSelfie() async {
    final messenger = ScaffoldMessenger.of(context);
    final cameraStatus = await Permission.camera.request();
    if (!cameraStatus.isGranted) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text(
            'Camera permission is required to record attendance.',
          ),
        ),
      );
      return;
    }
    if (!mounted) return;
    final bytes = await Navigator.of(context).push<Uint8List>(
      MaterialPageRoute(
        builder: (_) => SelfieCapturePage(title: widget.action.title),
      ),
    );
    if (bytes == null || !mounted) return;
    setState(() => _selfie = bytes);
  }

  Future<void> _submit() async {
    final position = _position;
    final selfie = _selfie;
    if (position == null || selfie == null) return;

    setState(() => _submitting = true);
    final repo = ref.read(attendanceRepositoryProvider);
    final image = base64Encode(selfie);
    try {
      final message = widget.action == ClockAction.clockIn
          ? await repo.clockInSelf(
              latitude: position.latitude,
              longitude: position.longitude,
              accuracy: position.accuracy,
              image: image,
            )
          : await repo.clockOutSelf(
              latitude: position.latitude,
              longitude: position.longitude,
              accuracy: position.accuracy,
              image: image,
            );
      await ref.read(currentStatusControllerProvider.notifier).refresh();
      if (!mounted) return;
      Navigator.of(context).pop(ClockResult(success: true, message: message));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      Navigator.of(context)
          .pop(ClockResult(success: false, message: e.message));
    }
  }

  @override
  Widget build(BuildContext context) {
    final action = widget.action;
    final status = widget.status;

    return Scaffold(
      appBar: AppBar(title: Text(action.title)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.page),
        children: [
          Text(action.title, style: AppTextStyles.pageTitle),
          const SizedBox(height: AppSpacing.xs),
          Text(
            action == ClockAction.clockIn
                ? 'Verify your location and take a selfie to clock in.'
                : 'Verify your location and take a selfie to clock out.',
            style: AppTextStyles.pageSubtitle,
          ),
          const SizedBox(height: AppSpacing.section),
          _StatusSummaryCard(status: status),
          const SizedBox(height: AppSpacing.section),
          AppCard.section(
            title: 'Attendance Action',
            description:
                'Complete both steps below to enable the ${action.title} '
                'button.',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AppNotice(
                  message:
                      'Your GPS location will be verified before clocking in '
                      'or out. Please ensure location access is enabled.',
                  icon: Icons.location_on_outlined,
                ),
                const SizedBox(height: AppSpacing.lg),
                _GpsStatus(
                  loading: _gpsLoading,
                  error: _gpsError,
                  position: _position,
                  onRetry: _acquireLocation,
                ),
                const Divider(height: AppSpacing.xxl),
                _SelfieVerification(
                  selfie: _selfie,
                  onCapture: _captureSelfie,
                ),
                const SizedBox(height: AppSpacing.xxl),
                AppButton(
                  label: action.title,
                  icon: action.icon,
                  variant: action.variant,
                  size: AppButtonSize.large,
                  loading: _submitting,
                  loadingLabel: 'Submitting…',
                  onPressed: _ready ? _submit : null,
                ),
                if (!_ready && !_submitting) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Acquire your location and capture a selfie to continue.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.tileLabel,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Result passed back to the dashboard so it can show the backend message.
class ClockResult {
  const ClockResult({required this.success, required this.message});
  final bool success;
  final String message;
}

class _StatusSummaryCard extends StatelessWidget {
  const _StatusSummaryCard({required this.status});

  final CurrentStatus status;

  @override
  Widget build(BuildContext context) {
    final color = StatusPresentation.color(status.status);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Current Status', style: AppTextStyles.cardTitle),
              const Spacer(),
              StatusBadge(
                label: StatusPresentation.label(status.status),
                color: color,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
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
            ],
          ),
        ],
      ),
    );
  }
}

class _GpsStatus extends StatelessWidget {
  const _GpsStatus({
    required this.loading,
    required this.error,
    required this.position,
    required this.onRetry,
  });

  final bool loading;
  final String? error;
  final Position? position;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const _StepRow(
        label: 'GPS Status',
        value: 'Getting your location…',
        spinner: true,
      );
    }
    if (error != null) {
      return _StepRow(
        label: 'GPS Status',
        value: error!,
        color: AppColors.danger,
        icon: Icons.location_off_outlined,
        trailing: TextButton(
          onPressed: onRetry,
          child: const Text('Retry'),
        ),
      );
    }
    if (position != null) {
      return _StepRow(
        label: 'GPS Status',
        value:
            'Location acquired (±${position!.accuracy.toStringAsFixed(0)} m)',
        color: AppColors.success,
        icon: Icons.check_circle_rounded,
        trailing: TextButton(
          onPressed: onRetry,
          child: const Text('Refresh'),
        ),
      );
    }
    return _StepRow(
      label: 'GPS Status',
      value: 'Not acquired yet',
      color: AppColors.muted,
      icon: Icons.location_searching_rounded,
      trailing: TextButton(onPressed: onRetry, child: const Text('Retry')),
    );
  }
}

class _SelfieVerification extends StatelessWidget {
  const _SelfieVerification({required this.selfie, required this.onCapture});

  final Uint8List? selfie;
  final VoidCallback onCapture;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _StepRow(
          label: 'Selfie Status',
          value: selfie == null ? 'Not captured yet' : 'Selfie captured',
          color: selfie == null ? AppColors.muted : AppColors.success,
          icon: selfie == null
              ? Icons.photo_camera_outlined
              : Icons.check_circle_rounded,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text('Selfie Verification', style: AppTextStyles.cardTitle),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Take a clear front-camera selfie to verify your attendance.',
          style: AppTextStyles.cardDescription,
        ),
        const SizedBox(height: AppSpacing.md),
        if (selfie == null)
          AppButton(
            label: 'Capture Selfie',
            icon: Icons.photo_camera_rounded,
            variant: AppButtonVariant.outline,
            size: AppButtonSize.large,
            onPressed: onCapture,
          )
        else ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            child: Image.memory(
              selfie!,
              height: 220,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: 'Retake Selfie',
            icon: Icons.refresh_rounded,
            variant: AppButtonVariant.outline,
            onPressed: onCapture,
          ),
        ],
      ],
    );
  }
}

/// One labelled status row (icon + label + value + optional trailing action).
class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.label,
    required this.value,
    this.color,
    this.icon,
    this.spinner = false,
    this.trailing,
  });

  final String label;
  final String value;
  final Color? color;
  final IconData? icon;
  final bool spinner;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.primary;
    return Row(
      children: [
        spinner
            ? SizedBox(
                height: AppDimensions.iconMd,
                width: AppDimensions.iconMd,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  valueColor: AlwaysStoppedAnimation<Color>(c),
                ),
              )
            : Icon(icon ?? Icons.info_outline_rounded,
                size: AppDimensions.iconMd, color: c),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTextStyles.tileLabel),
              const SizedBox(height: 2),
              Text(
                value,
                style: AppTextStyles.tileValue.copyWith(
                  color: color ?? AppColors.heading,
                ),
              ),
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}
