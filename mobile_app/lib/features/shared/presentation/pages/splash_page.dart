import 'package:flutter/material.dart';

import '../../../../core/constants/app_constants.dart';

/// Shown while the session status is being restored from secure storage.
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.access_time_filled_rounded,
              size: 72,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              AppConstants.appName,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
