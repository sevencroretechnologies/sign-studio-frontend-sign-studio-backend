import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_exception.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../application/work_logs_controller.dart';
import '../../data/models/work_log.dart';
import '../status_presentation.dart';
import '../widgets/work_log_tile.dart';

/// Attendance history: paginated list of the user's work logs with
/// pull-to-refresh and infinite scroll. Mirrors the React "My Work Logs" page.
class AttendanceHistoryPage extends ConsumerStatefulWidget {
  const AttendanceHistoryPage({super.key});

  @override
  ConsumerState<AttendanceHistoryPage> createState() =>
      _AttendanceHistoryPageState();
}

class _AttendanceHistoryPageState
    extends ConsumerState<AttendanceHistoryPage> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 300) {
      ref.read(workLogsControllerProvider.notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(workLogsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Work Logs')),
      body: logsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _ErrorView(
          message: error is ApiException
              ? error.message
              : 'Unable to load your attendance history.',
          onRetry: () =>
              ref.read(workLogsControllerProvider.notifier).refresh(),
        ),
        data: (state) => RefreshIndicator(
          onRefresh: () =>
              ref.read(workLogsControllerProvider.notifier).refresh(),
          child: _LogsList(
            state: state,
            controller: _scrollController,
            onRetryMore: () =>
                ref.read(workLogsControllerProvider.notifier).loadMore(),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('My Work Logs', style: AppTextStyles.pageTitle),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'View your attendance records and work history',
          style: AppTextStyles.pageSubtitle,
        ),
        const SizedBox(height: AppSpacing.section),
      ],
    );
  }
}

class _LogsList extends StatelessWidget {
  const _LogsList({
    required this.state,
    required this.controller,
    required this.onRetryMore,
  });

  final WorkLogsState state;
  final ScrollController controller;
  final VoidCallback onRetryMore;

  @override
  Widget build(BuildContext context) {
    final items = state.items;

    if (items.isEmpty) {
      return ListView(
        controller: controller,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.page),
        children: const [_Header(), _EmptyView()],
      );
    }

    return ListView.separated(
      controller: controller,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.page),
      itemCount: items.length + 2,
      separatorBuilder: (_, index) =>
          SizedBox(height: index == 0 ? 0 : AppSpacing.md),
      itemBuilder: (context, index) {
        if (index == 0) return const _Header();
        final itemIndex = index - 1;
        if (itemIndex < items.length) {
          final WorkLog log = items[itemIndex];
          return WorkLogTile(
            dateLabel: log.dateLabel,
            clockIn: log.clockInLabel,
            clockOut: log.clockOutLabel,
            statusLabel: StatusPresentation.label(log.status),
            statusColor: StatusPresentation.color(log.status),
            lateMinutes: log.lateMinutes,
            totalHours: log.totalHours,
          );
        }
        return _ListFooter(state: state, onRetryMore: onRetryMore);
      },
    );
  }
}

class _ListFooter extends StatelessWidget {
  const _ListFooter({required this.state, required this.onRetryMore});

  final WorkLogsState state;
  final VoidCallback onRetryMore;

  @override
  Widget build(BuildContext context) {
    if (state.isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (state.loadMoreError != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: Center(
          child: TextButton.icon(
            onPressed: onRetryMore,
            icon: const Icon(Icons.refresh_rounded),
            label: Text(state.loadMoreError!),
          ),
        ),
      );
    }
    if (!state.hasMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: Center(
          child: Text('No more records', style: AppTextStyles.tileLabel),
        ),
      );
    }
    return const SizedBox(height: AppSpacing.xxl);
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 80),
      child: Column(
        children: [
          const Icon(
            Icons.event_busy_rounded,
            size: AppDimensions.iconHero,
            color: AppColors.muted,
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('No work logs found', style: AppTextStyles.cardTitle),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Your attendance records will appear here.',
            style: AppTextStyles.pageSubtitle,
          ),
        ],
      ),
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
