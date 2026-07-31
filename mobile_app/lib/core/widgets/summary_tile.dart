import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_dimensions.dart';
import '../theme/app_spacing.dart';
import '../theme/app_text_styles.dart';

/// A centred summary tile (icon over a label and value) on a tinted
/// background — mirrors the React "Today's Summary" tiles
/// (`bg-solarized-base3 rounded-lg`, coloured icon).
class SummaryTile extends StatelessWidget {
  const SummaryTile({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.lg,
        horizontal: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.tileBackground,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
      ),
      child: Column(
        children: [
          Icon(icon, size: AppDimensions.iconXl, color: iconColor),
          const SizedBox(height: AppSpacing.sm),
          Text(label, style: AppTextStyles.tileLabel),
          const SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: AppTextStyles.tileValue,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
