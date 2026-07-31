import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_dimensions.dart';
import '../theme/app_text_styles.dart';

/// Pill badge matching the React status badges (`bg-<color>/10 text-<color>`,
/// `rounded-md`). Colour comes from the caller so it can reflect attendance
/// status.
class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.large = false,
  });

  final String label;
  final Color color;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? 16 : 10,
        vertical: large ? 8 : 4,
      ),
      decoration: BoxDecoration(
        color: AppColors.tint(color),
        borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
      ),
      child: Text(
        label,
        style: (large ? AppTextStyles.statusBadge : AppTextStyles.badge)
            .copyWith(color: color),
      ),
    );
  }
}
