import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/api/api_exception.dart';
import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_cards.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/app_notice.dart';
import '../../../attendance/application/current_status_controller.dart';
import '../../../attendance/data/models/current_status.dart';
import '../../../auth/application/auth_service.dart';
import '../../../auth/application/current_user_controller.dart';
import '../widgets/attendance_action_card.dart';
import '../widgets/live_clock.dart';
import '../widgets/status_card.dart';

/// Dashboard: greeting, current time, attendance status, the primary Clock In /
/// Clock Out action card and today's summary. Mirrors the React
/// `ClockInOutSelf` module layout, adapted for mobile (stacked cards).
class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authServiceProvider).signOut();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(currentStatusControllerProvider);
    final user = ref.watch(currentUserControllerProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Attendance'),
        actions: [
          IconButton(
            tooltip: 'History',
            icon: const Icon(Icons.history_rounded),
            onPressed: () => context.push(AppRoutes.history),
          ),
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => _logout(context, ref),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(currentStatusControllerProvider.notifier).refresh(),
        child: statusAsync.when(
          loading: () => const _LoadingView(),
          error: (error, _) => _ErrorView(
            message: error is ApiException
                ? error.message
                : 'Unable to load your attendance status.',
            onRetry: () =>
                ref.read(currentStatusControllerProvider.notifier).refresh(),
          ),
          data: (status) => _DashboardBody(
            status: status,
            userName: user?.name,
            hasStaffMember: user?.hasStaffMember ?? false,
          ),
        ),
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({
    required this.status,
    required this.userName,
    required this.hasStaffMember,
  });

  final CurrentStatus status;
  final String? userName;
  final bool hasStaffMember;

  bool get _showSummary =>
      status.isClockedIn ||
      status.isClockedOut ||
      status.clockIn != null ||
      status.clockInTime != null;

  @override
  Widget build(BuildContext context) {
    return _FadeInList(
      children: [
        Text(
          userName != null ? 'Welcome back, $userName!' : 'My Attendance',
          style: AppTextStyles.pageTitle,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          hasStaffMember
              ? 'Record your attendance for today'
              : 'View attendance information',
          style: AppTextStyles.pageSubtitle,
        ),
        const SizedBox(height: AppSpacing.section),
        AppCard(
          child: Column(
            children: [
              Text(
                'Current Time',
                textAlign: TextAlign.center,
                style: AppTextStyles.cardTitle,
              ),
              const SizedBox(height: AppSpacing.lg),
              const LiveClock(),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.section),
        StatusCard(status: status),
        const SizedBox(height: AppSpacing.section),
        if (!hasStaffMember)
          const AppNotice(
            message:
                'Your account is not linked to a staff profile, so attendance '
                'is unavailable. Please contact your administrator.',
          )
        else ...[
          AttendanceActionCard(status: status),
          if (_showSummary) ...[
            const SizedBox(height: AppSpacing.section),
            TodaySummaryCard(status: status),
          ],
        ],
        const SizedBox(height: AppSpacing.section),
      ],
    );
  }
}

/// Fades and slides children in as the dashboard first appears (subtle).
class _FadeInList extends StatelessWidget {
  const _FadeInList({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOut,
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, (1 - t) * 12), child: child),
      ),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.page),
        children: children,
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SizedBox(height: 240),
        Center(child: CircularProgressIndicator()),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      children: [
        const SizedBox(height: 100),
        const Icon(
          Icons.cloud_off_rounded,
          size: AppDimensions.iconHero,
          color: AppColors.danger,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(message, textAlign: TextAlign.center, style: AppTextStyles.body),
        const SizedBox(height: AppSpacing.xl),
        Center(
          child: OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ),
      ],
    );
  }
}
