import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/attendance/presentation/pages/attendance_history_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/shared/presentation/pages/splash_page.dart';
import '../providers/session_controller.dart';
import 'app_routes.dart';

/// Provides the app's [GoRouter]. Route access is gated by [SessionStatus];
/// the router refreshes whenever the session changes.
final goRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<SessionStatus>(
    ref.read(sessionControllerProvider),
  );
  ref.listen<SessionStatus>(sessionControllerProvider, (_, next) {
    refresh.value = next;
  });
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(sessionControllerProvider);
      final location = state.matchedLocation;

      switch (status) {
        case SessionStatus.unknown:
          return location == AppRoutes.splash ? null : AppRoutes.splash;
        case SessionStatus.unauthenticated:
          return location == AppRoutes.login ? null : AppRoutes.login;
        case SessionStatus.authenticated:
          if (location == AppRoutes.login || location == AppRoutes.splash) {
            return AppRoutes.dashboard;
          }
          return null;
      }
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, _) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, _) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        builder: (_, _) => const DashboardPage(),
      ),
      GoRoute(
        path: AppRoutes.history,
        builder: (_, _) => const AttendanceHistoryPage(),
      ),
    ],
  );
});
