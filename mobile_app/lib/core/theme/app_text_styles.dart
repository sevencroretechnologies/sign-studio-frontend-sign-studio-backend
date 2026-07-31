import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Typography scale extracted from the React module.
///
/// React maps to Tailwind: page title `text-2xl font-bold` (24/700), card
/// title `text-lg font-semibold` (18/600), muted body `text-sm` (14), the big
/// clock `text-5xl font-bold` (≈48/700). Reuse these everywhere rather than
/// styling `Text` inline.
class AppTextStyles {
  const AppTextStyles._();

  /// Page heading — `text-2xl font-bold text-solarized-base02`.
  static const TextStyle pageTitle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.heading,
    height: 1.2,
  );

  /// Page subtitle under the heading — `text-solarized-base01`.
  static const TextStyle pageSubtitle = TextStyle(
    fontSize: 14,
    color: AppColors.muted,
  );

  /// Card title — `text-lg font-semibold`.
  static const TextStyle cardTitle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.heading,
  );

  /// Card description — `text-sm text-solarized-base01`.
  static const TextStyle cardDescription = TextStyle(
    fontSize: 14,
    color: AppColors.muted,
    height: 1.35,
  );

  /// The large ticking clock — `text-5xl font-bold text-solarized-blue`.
  static const TextStyle clock = TextStyle(
    fontSize: 44,
    fontWeight: FontWeight.bold,
    color: AppColors.primary,
    fontFeatures: [FontFeature.tabularFigures()],
    height: 1.05,
  );

  /// Status badge label — `text-lg` inside the status badge.
  static const TextStyle statusBadge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );

  /// Small badge label (history rows).
  static const TextStyle badge = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
  );

  /// Summary-tile caption — `text-sm text-solarized-base01`.
  static const TextStyle tileLabel = TextStyle(
    fontSize: 13,
    color: AppColors.muted,
  );

  /// Summary-tile value — `font-semibold`.
  static const TextStyle tileValue = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.heading,
  );

  /// Large metric number — `text-2xl font-bold`.
  static const TextStyle metric = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );

  /// Default body text.
  static const TextStyle body = TextStyle(
    fontSize: 14,
    color: AppColors.base00,
    height: 1.4,
  );

  /// Button label — `text-sm font-medium` (scaled up for large buttons).
  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );
}
