/// Spacing scale used across the app.
///
/// Mirrors the Tailwind spacing the React module relies on: `gap-2` (8),
/// `gap-4` (16), `p-6` (24), `space-y-6` (24). Use these instead of ad-hoc
/// numbers so screens stay visually consistent.
class AppSpacing {
  const AppSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;

  /// Vertical gap between page sections (React `space-y-6`).
  static const double section = 24;

  /// Default inner padding for cards (React `p-6`).
  static const double card = 20;

  /// Horizontal page padding.
  static const double page = 16;
}
