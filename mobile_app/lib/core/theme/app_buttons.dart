import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_dimensions.dart';
import 'app_spacing.dart';
import 'app_text_styles.dart';

/// Visual variants mirroring the React module's button usage.
enum AppButtonVariant {
  /// Filled blue — primary actions & login (`bg-solarized-blue`).
  primary,

  /// Filled green — Clock In (`bg-solarized-green`).
  success,

  /// Outlined red — Clock Out (`border-solarized-red text-solarized-red`).
  dangerOutline,

  /// Neutral outlined button.
  outline,
}

enum AppButtonSize { normal, large }

/// Reusable button matching the React design (colours, radius, font, padding,
/// icon placement). Use this instead of raw [FilledButton]/[OutlinedButton] so
/// styling stays centralised.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.normal,
    this.icon,
    this.loading = false,
    this.loadingLabel,
    this.expanded = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool loading;
  final String? loadingLabel;
  final bool expanded;

  bool get _isOutline =>
      variant == AppButtonVariant.dangerOutline ||
      variant == AppButtonVariant.outline;

  Color get _accent {
    switch (variant) {
      case AppButtonVariant.primary:
        return AppColors.primary;
      case AppButtonVariant.success:
        return AppColors.success;
      case AppButtonVariant.dangerOutline:
        return AppColors.danger;
      case AppButtonVariant.outline:
        return AppColors.base01;
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = size == AppButtonSize.large
        ? AppDimensions.actionButtonHeight
        : AppDimensions.buttonHeight;
    final textStyle = AppTextStyles.button.copyWith(
      fontSize: size == AppButtonSize.large ? 18 : 16,
    );
    final iconSize = size == AppButtonSize.large
        ? AppDimensions.iconLg
        : AppDimensions.iconMd;
    final disabled = loading || onPressed == null;

    final foreground = _isOutline ? _accent : AppColors.white;

    final content = loading
        ? Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: iconSize,
                width: iconSize,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(foreground),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(loadingLabel ?? label, style: textStyle),
            ],
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: iconSize),
                const SizedBox(width: AppSpacing.sm),
              ],
              Flexible(
                child: Text(
                  label,
                  style: textStyle,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          );

    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
    );

    final Widget button = _isOutline
        ? OutlinedButton(
            onPressed: disabled ? null : onPressed,
            style: OutlinedButton.styleFrom(
              foregroundColor: _accent,
              side: BorderSide(color: _accent, width: 1.4),
              shape: shape,
              minimumSize: Size(0, height),
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
            ).copyWith(
              overlayColor: WidgetStatePropertyAll(AppColors.tint(_accent)),
            ),
            child: content,
          )
        : FilledButton(
            onPressed: disabled ? null : onPressed,
            style: FilledButton.styleFrom(
              backgroundColor: _accent,
              foregroundColor: AppColors.white,
              disabledBackgroundColor: _accent.withValues(alpha: 0.5),
              disabledForegroundColor: AppColors.white,
              shape: shape,
              minimumSize: Size(0, height),
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
            ),
            child: content,
          );

    if (!expanded) return SizedBox(height: height, child: button);
    return SizedBox(width: double.infinity, height: height, child: button);
  }
}
