import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/api/api_exception.dart';
import '../../../../core/router/app_routes.dart';
import '../../../attendance/application/current_status_controller.dart';
import '../../../attendance/data/models/current_status.dart';
import '../../../auth/application/auth_service.dart';
import '../../../auth/application/current_user_controller.dart';
import '../widgets/attendance_action_button.dart';
import '../widgets/live_clock.dart';
import '../widgets/status_card.dart';

/// Dashboard: shows current attendance status and the primary Clock In / Clock
/// Out action. Clock in/out handlers are wired in Phases 5–6.
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
        title: const Text('Attendance'),
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      children: [
        if (userName != null)
          Text(
            'Hello, $userName',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        const SizedBox(height: 16),
        const Center(child: LiveClock()),
        const SizedBox(height: 20),
        StatusCard(status: status),
        const SizedBox(height: 24),
        if (!hasStaffMember)
          const _InfoBanner(
            message:
                'Your account is not linked to a staff profile, so attendance '
                'is unavailable. Please contact your administrator.',
          )
        else
          AttendanceActionButton(status: status),
      ],
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
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 120),
        Icon(
          Icons.cloud_off_rounded,
          size: 56,
          color: Theme.of(context).colorScheme.error,
        ),
        const SizedBox(height: 16),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 20),
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

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, color: scheme.onSecondaryContainer),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: scheme.onSecondaryContainer),
            ),
          ),
        ],
      ),
    );
  }
}
