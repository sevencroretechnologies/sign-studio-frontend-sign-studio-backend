import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_dimensions.dart';
import 'app_spacing.dart';
import 'app_text_styles.dart';

/// Reusable card matching the React module's `<Card className="border-0
/// shadow-md">`: white surface, `rounded-xl` corners and a soft shadow.
///
/// Use [AppCard] (and [AppCard.section] for a titled card) instead of styling
/// [Container]s inline.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.card),
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  /// A card with a React-style header (`CardTitle` + optional
  /// `CardDescription`) above [child].
  factory AppCard.section({
    Key? key,
    required String title,
    String? description,
    Widget? trailing,
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(AppSpacing.card),
  }) {
    return AppCard(
      key: key,
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTextStyles.cardTitle),
                    if (description != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(description, style: AppTextStyles.cardDescription),
                    ],
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          child,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final card = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppDimensions.radiusLg),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(padding: padding, child: child),
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppDimensions.radiusLg),
        onTap: onTap,
        child: card,
      ),
    );
  }
}
