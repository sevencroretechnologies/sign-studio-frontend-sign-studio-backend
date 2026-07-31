import 'package:flutter/material.dart';

/// Official SignStudio logo, shown consistently across the app (login, splash,
/// branding/header areas). Use this widget instead of referencing the asset
/// directly so the logo is defined in exactly one place.
///
/// The image keeps its aspect ratio ([BoxFit.contain]) so it is never
/// stretched or distorted.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.height = 56, this.semanticLabel = 'SignStudio'});

  /// Rendered height in logical pixels; width scales to keep the aspect ratio.
  final double height;
  final String semanticLabel;

  /// Full SignStudio wordmark asset.
  static const String asset = 'assets/images/signstudio_logo.png';

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      asset,
      height: height,
      fit: BoxFit.contain,
      semanticLabel: semanticLabel,
    );
  }
}
