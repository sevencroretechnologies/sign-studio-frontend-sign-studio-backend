import 'package:flutter/material.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_logo.dart';

/// Shown while the session status is being restored from secure storage.
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppLogo(height: 72),
            SizedBox(height: AppSpacing.xxl),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
