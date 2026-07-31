import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_dimensions.dart';
import '../theme/app_spacing.dart';
import '../theme/app_text_styles.dart';

enum AppNoticeVariant { info, success, error, warning }

/// Inline notice/alert matching the React `<Alert>` component: a tinted
/// rounded panel with a leading icon and a message. Used for the geofence
/// notice, GPS-loading hint, error and info banners.
class AppNotice extends StatelessWidget {
  const AppNotice({
    super.key,
    required this.message,
    this.variant = AppNoticeVariant.info,
    this.icon,
    this.showSpinner = false,
  });

  final String message;
  final AppNoticeVariant variant;
  final IconData? icon;
  final bool showSpinner;

  Color get _color {
    switch (variant) {
      case AppNoticeVariant.info:
        return AppColors.primary;
      case AppNoticeVariant.success:
        return AppColors.success;
      case AppNoticeVariant.error:
        return AppColors.danger;
      case AppNoticeVariant.warning:
        return AppColors.warning;
    }
  }

  IconData get _icon {
    if (icon != null) return icon!;
    switch (variant) {
      case AppNoticeVariant.info:
        return Icons.info_outline_rounded;
      case AppNoticeVariant.success:
        return Icons.check_circle_outline_rounded;
      case AppNoticeVariant.error:
        return Icons.error_outline_rounded;
      case AppNoticeVariant.warning:
        return Icons.warning_amber_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.tint(_color),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        border: Border.all(color: AppColors.tint(_color, 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          showSpinner
              ? SizedBox(
                  height: AppDimensions.iconMd,
                  width: AppDimensions.iconMd,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    valueColor: AlwaysStoppedAnimation<Color>(_color),
                  ),
                )
              : Icon(_icon, size: AppDimensions.iconMd, color: _color),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              message,
              style: AppTextStyles.body.copyWith(color: AppColors.base02),
            ),
          ),
        ],
      ),
    );
  }
}
