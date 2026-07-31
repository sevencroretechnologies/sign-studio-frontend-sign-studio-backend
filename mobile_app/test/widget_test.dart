import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:signstudio_attendance/app.dart';
import 'package:signstudio_attendance/core/widgets/app_logo.dart';

void main() {
  testWidgets('App builds and shows the splash screen', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: SignStudioApp()),
    );

    // The splash screen is shown while the session status is restored.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.byType(AppLogo), findsOneWidget);
  });
}
