/// Sizing tokens: radii, elevations, control heights and icon sizes.
///
/// Reflects the React module's shadcn primitives — cards `rounded-xl` (12),
/// buttons/badges `rounded-md`, `shadow-md`, `h-11` inputs, `h-16` action
/// buttons.
class AppDimensions {
  const AppDimensions._();

  // Radii
  static const double radiusSm = 8;
  static const double radiusMd = 10;
  static const double radiusLg = 12; // cards (rounded-xl)
  static const double radiusXl = 16;
  static const double radiusPill = 999;

  // Elevation (soft card shadow ≈ Tailwind shadow-md)
  static const double cardElevation = 3;

  // Control heights
  static const double inputHeight = 52; // h-11 + comfortable touch target
  static const double buttonHeight = 48;
  static const double buttonHeightLg = 56;
  static const double actionButtonHeight = 60;

  // Icon sizes
  static const double iconSm = 16;
  static const double iconMd = 20;
  static const double iconLg = 24;
  static const double iconXl = 32;
  static const double iconHero = 56;
}
