import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/pagination_meta.dart';
import '../data/attendance_repository.dart';
import '../data/models/work_log.dart';

/// Immutable state for the paginated attendance history list.
@immutable
class WorkLogsState {
  const WorkLogsState({
    required this.items,
    required this.meta,
    this.isLoadingMore = false,
    this.loadMoreError,
  });

  final List<WorkLog> items;
  final PaginationMeta meta;
  final bool isLoadingMore;
  final String? loadMoreError;

  bool get hasMore => meta.hasMorePages;

  WorkLogsState copyWith({
    List<WorkLog>? items,
    PaginationMeta? meta,
    bool? isLoadingMore,
    String? loadMoreError,
  }) {
    return WorkLogsState(
      items: items ?? this.items,
      meta: meta ?? this.meta,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      loadMoreError: loadMoreError,
    );
  }
}

/// Loads attendance history with pagination: initial page, load-more (append)
/// and pull-to-refresh.
class WorkLogsController extends AsyncNotifier<WorkLogsState> {
  static const int _perPage = 15;

  @override
  Future<WorkLogsState> build() => _loadFirstPage();

  Future<WorkLogsState> _loadFirstPage() async {
    final page = await ref
        .read(attendanceRepositoryProvider)
        .getMyLogs(page: 1, perPage: _perPage);
    return WorkLogsState(items: page.items, meta: page.meta);
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(_loadFirstPage);
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || !current.hasMore || current.isLoadingMore) return;

    state = AsyncData(current.copyWith(isLoadingMore: true));
    try {
      final next = await ref.read(attendanceRepositoryProvider).getMyLogs(
            page: current.meta.currentPage + 1,
            perPage: _perPage,
          );
      state = AsyncData(
        current.copyWith(
          items: [...current.items, ...next.items],
          meta: next.meta,
          isLoadingMore: false,
        ),
      );
    } catch (_) {
      state = AsyncData(
        current.copyWith(
          isLoadingMore: false,
          loadMoreError: 'Could not load more. Tap to retry.',
        ),
      );
    }
  }
}

final workLogsControllerProvider =
    AsyncNotifierProvider<WorkLogsController, WorkLogsState>(
  WorkLogsController.new,
);
