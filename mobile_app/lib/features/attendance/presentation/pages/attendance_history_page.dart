import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_exception.dart';
import '../../application/work_logs_controller.dart';
import '../../data/models/work_log.dart';
import '../status_presentation.dart';
import '../widgets/work_log_tile.dart';

/// Attendance history: paginated list of the user's work logs with
/// pull-to-refresh and infinite scroll.
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
      appBar: AppBar(title: const Text('Attendance History')),
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
          child: state.items.isEmpty
              ? const _EmptyView()
              : _LogsList(
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
    return ListView.separated(
      controller: controller,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: items.length + 1,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        if (index < items.length) {
          final WorkLog log = items[index];
          return WorkLogTile(
            dateLabel: log.dateLabel,
            clockIn: log.clockInLabel,
            clockOut: log.clockOutLabel,
            statusLabel: StatusPresentation.label(log.status),
            statusColor: StatusPresentation.color(context, log.status),
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
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (state.loadMoreError != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
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
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: Text(
            'No more records',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }
    return const SizedBox(height: 24);
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 120),
        Icon(
          Icons.event_busy_rounded,
          size: 56,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(height: 16),
        const Center(child: Text('No attendance records yet.')),
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
