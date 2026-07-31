import 'package:flutter/material.dart';

/// Application colour palette.
///
/// Extracted from the React web app (Tailwind `solarized.*` tokens in
/// `frontend/tailwind.config.js`) so the Flutter client shares the same design
/// language. Never hard-code colours in widgets — reference [AppColors].
class AppColors {
  const AppColors._();

  // ── Solarized palette (source of truth in the React app) ────────────────
  static const Color base03 = Color(0xFF002B36);
  static const Color base02 = Color(0xFF073642);
  static const Color base01 = Color(0xFF586E75);
  static const Color base00 = Color(0xFF657B83);
  static const Color base0 = Color(0xFF839496);
  static const Color base1 = Color(0xFF93A1A1);
  static const Color base2 = Color(0xFFEEE8D5);
  static const Color base3 = Color(0xFFFDF6E3);

  static const Color yellow = Color(0xFFB58900);
  static const Color orange = Color(0xFFCB4B16);
  static const Color red = Color(0xFFDC322F);
  static const Color magenta = Color(0xFFD33682);
  static const Color violet = Color(0xFF6C71C4);
  static const Color blue = Color(0xFF268BD2);
  static const Color cyan = Color(0xFF2AA198);
  static const Color green = Color(0xFF859900);
  static const Color indigo = Color(0xFF6366F1);

  // ── Semantic roles (mirrors how the React module uses the palette) ───────
  /// Primary accent — buttons, links, current time, "clocked out" status.
  static const Color primary = blue;

  /// Success — Clock In, "clocked in", present days.
  static const Color success = green;

  /// Danger — Clock Out button, absent days, clock-out time.
  static const Color danger = red;

  /// Warning — late days.
  static const Color warning = yellow;

  /// Heading / high-emphasis text.
  static const Color heading = base02;

  /// Muted / secondary text.
  static const Color muted = base01;

  // ── Surfaces ─────────────────────────────────────────────────────────────
  /// App scaffold background (light neutral so white cards lift with shadow).
  static const Color background = Color(0xFFF4F5F7);

  /// Card / sheet background.
  static const Color surface = Colors.white;

  /// Subtle tinted tile background (React `bg-solarized-base3`).
  static const Color tileBackground = base3;

  /// Hairline borders / dividers (React `solarized.base2`).
  static const Color border = Color(0xFFE3E6EB);

  static const Color white = Colors.white;

  /// Returns a soft tinted background for a status colour (React `<color>/10`).
  static Color tint(Color color, [double opacity = 0.10]) =>
      color.withValues(alpha: opacity);
}
