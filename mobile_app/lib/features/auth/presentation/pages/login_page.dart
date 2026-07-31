import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_exception.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_buttons.dart';
import '../../../../core/theme/app_cards.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/app_notice.dart';
import '../../application/auth_service.dart';

/// Login screen. Submits credentials to `POST /auth/sign-in`; on success the
/// session becomes authenticated and the router redirects to the dashboard.
///
/// Mirrors the React `Login.tsx`: a centred "Welcome back" card with a blue
/// primary submit button and a top error alert showing the backend message.
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await ref.read(authServiceProvider).signIn(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
      // On success the router redirects; nothing else to do here.
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _errorMessage = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xxl,
              vertical: AppSpacing.xxxl,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _Brand(),
                  const SizedBox(height: AppSpacing.xxl),
                  AppCard(
                    padding: const EdgeInsets.all(AppSpacing.xxl),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Welcome back',
                            textAlign: TextAlign.center,
                            style: AppTextStyles.pageTitle,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            'Enter your credentials to access your account',
                            textAlign: TextAlign.center,
                            style: AppTextStyles.cardDescription,
                          ),
                          const SizedBox(height: AppSpacing.xxl),
                          if (_errorMessage != null) ...[
                            AppNotice(
                              message: _errorMessage!,
                              variant: AppNoticeVariant.error,
                            ),
                            const SizedBox(height: AppSpacing.lg),
                          ],
                          const _FieldLabel('Email, Username, or Phone'),
                          const SizedBox(height: AppSpacing.sm),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            enabled: !_isSubmitting,
                            autofillHints: const [AutofillHints.username],
                            decoration: const InputDecoration(
                              hintText: 'username, email, or phone number',
                              prefixIcon: Icon(Icons.person_outline_rounded),
                            ),
                            validator: (value) =>
                                (value == null || value.trim().isEmpty)
                                    ? 'Email, Username, or Phone Number is '
                                        'required'
                                    : null,
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          const _FieldLabel('Password'),
                          const SizedBox(height: AppSpacing.sm),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            textInputAction: TextInputAction.done,
                            enabled: !_isSubmitting,
                            autofillHints: const [AutofillHints.password],
                            onFieldSubmitted: (_) => _submit(),
                            decoration: InputDecoration(
                              hintText: 'Enter your password',
                              prefixIcon:
                                  const Icon(Icons.lock_outline_rounded),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                  color: AppColors.base1,
                                ),
                                onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                              ),
                            ),
                            validator: (value) =>
                                (value == null || value.isEmpty)
                                    ? 'Password is required'
                                    : null,
                          ),
                          const SizedBox(height: AppSpacing.xxl),
                          AppButton(
                            label: 'Sign in',
                            loadingLabel: 'Signing in…',
                            loading: _isSubmitting,
                            onPressed: _submit,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 64,
          width: 64,
          decoration: BoxDecoration(
            color: AppColors.tint(AppColors.primary),
            borderRadius: BorderRadius.circular(AppDimensions.radiusXl),
          ),
          child: const Icon(
            Icons.access_time_filled_rounded,
            size: AppDimensions.iconXl,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          AppConstants.appName,
          textAlign: TextAlign.center,
          style: AppTextStyles.cardTitle,
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.base02,
      ),
    );
  }
}
