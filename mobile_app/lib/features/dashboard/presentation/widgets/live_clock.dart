import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';

/// The "Current Time" content: a large blue ticking clock over the date with a
/// calendar icon — mirrors the React `Current Time` card.
class LiveClock extends StatefulWidget {
  const LiveClock({super.key});

  @override
  State<LiveClock> createState() => _LiveClockState();
}

class _LiveClockState extends State<LiveClock> {
  late Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  static const _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  static const _weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    'Sunday',
  ];

  String _two(int v) => v.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final time = '${_two(_now.hour)}:${_two(_now.minute)}:${_two(_now.second)}';
    final date =
        '${_weekdays[_now.weekday - 1]}, ${_now.day} ${_months[_now.month - 1]} '
        '${_now.year}';

    return Column(
      children: [
        Text(time, style: AppTextStyles.clock),
        const SizedBox(height: AppSpacing.sm),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.calendar_today_rounded,
              size: 16,
              color: AppColors.muted,
            ),
            const SizedBox(width: AppSpacing.sm),
            Text(date, style: AppTextStyles.pageSubtitle),
          ],
        ),
      ],
    );
  }
}
