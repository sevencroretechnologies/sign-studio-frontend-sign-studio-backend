import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/attendance_repository.dart';
import '../data/models/current_status.dart';

/// Loads and exposes the user's current attendance status. Clock in/out flows
/// (Phases 5–6) refresh it via [refresh].
class CurrentStatusController extends AsyncNotifier<CurrentStatus> {
  @override
  Future<CurrentStatus> build() {
    return ref.read(attendanceRepositoryProvider).getCurrentStatusSelf();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<CurrentStatus>().copyWithPrevious(state);
    state = await AsyncValue.guard(
      () => ref.read(attendanceRepositoryProvider).getCurrentStatusSelf(),
    );
  }
}

final currentStatusControllerProvider =
    AsyncNotifierProvider<CurrentStatusController, CurrentStatus>(
  CurrentStatusController.new,
);
