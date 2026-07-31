<?php

namespace App\Services\Auth;

use App\Exceptions\AccountDeactivatedException;
use App\Exceptions\InvalidCredentialsException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        $user->assignRole('user');

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $this->formatUserData($user),
            'token' => $token,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function login(array $credentials): array
    {
         $loginId = $credentials['email'];

        $user = User::where('email', $loginId)
            ->orWhere('username', $loginId)
            ->orWhereHas('staffMember', function ($query) use ($loginId) {
                $query->where('mobile_number', $loginId);
            })
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new InvalidCredentialsException;
        }

        if (! $user->is_active) {
            throw new AccountDeactivatedException;
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $this->formatUserData($user),
            'token' => $token,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Revoke current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Get user profile with roles and permissions.
     */
    public function getProfile(User $user): array
    {
        $userData = $this->formatUserData($user);

        // Add full staff member details if user has a staff member record
        if ($user->staffMember) {
            $staffMember = $user->staffMember;
            $staffMember->load(['officeLocation', 'division', 'jobTitle', 'user']);

            $userData['staff_member'] = [
                'id' => $staffMember->id,
                'full_name' => $staffMember->full_name,
                'profile_image' => $staffMember->profile_image,
                'staff_code' => $staffMember->staff_code,
                'personal_email' => $staffMember->personal_email,
                'mobile_number' => $staffMember->mobile_number,
                'birth_date' => $staffMember->birth_date,
                'gender' => $staffMember->gender,
                'home_address' => $staffMember->home_address,
                'nationality' => $staffMember->nationality,
                'passport_number' => $staffMember->passport_number,
                'country_code' => $staffMember->country_code,
                'region' => $staffMember->region,
                'city_name' => $staffMember->city_name,
                'postal_code' => $staffMember->postal_code,
                'office_location_id' => $staffMember->office_location_id,
                'office_location' => $staffMember->officeLocation?->title,
                'division_id' => $staffMember->division_id,
                'division' => $staffMember->division?->title,
                'job_title_id' => $staffMember->job_title_id,
                'job_title' => $staffMember->jobTitle?->title,
                'date_of_joining' => $staffMember->date_of_joining,
                'employment_status' => $staffMember->employment_status,
                'employment_type' => $staffMember->employment_type,
                'compensation_type' => $staffMember->compensation_type,
                'base_salary' => $staffMember->base_salary,
                'biometric_id' => $staffMember->biometric_id,
                'bank_account_name' => $staffMember->bank_account_name,
                'bank_account_number' => $staffMember->bank_account_number,
                'bank_name' => $staffMember->bank_name,
                'bank_branch' => $staffMember->bank_branch,
                'emergency_contact_name' => $staffMember->emergency_contact_name,
                'emergency_contact_phone' => $staffMember->emergency_contact_phone,
                'emergency_contact_relationship' => $staffMember->emergency_contact_relationship,
                'org_id' => $staffMember->org_id,
                'company_id' => $staffMember->company_id,
            ];
        }

        return [
            'user' => $userData,
        ];
    }

    /**
     * Send password reset link.
     */
    public function sendPasswordResetLink(string $email): string
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $status;
    }

    /**
     * Reset password with token.
     */
    public function resetPassword(array $data): string
    {
        $status = Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $status;
    }

    /**
     * Format user data for response.
     */
    protected function formatUserData(User $user): array
    {
        $user->load(['roles' => function ($query) {
            $query->orderBy('hierarchy_level');
        }, 'roles.permissions', 'staffMember', 'organization', 'company']);

        $roles = $user->roles;
        $primaryRole = $roles->sortBy('hierarchy_level')->first();
        $permissions = $user->getAllPermissions()->pluck('name')->unique()->values()->toArray();

        return [
            'id'                    => $user->id,
            'name'                  => $user->name,
            'email'                 => $user->email,
            'role'                  => $primaryRole ? $primaryRole->name : 'user',
            'role_display'          => $primaryRole ? ucwords(str_replace('_', ' ', $primaryRole->name)) : 'User',
            'roles'                 => $roles->pluck('name')->toArray(),
            'permissions'           => $permissions,
            'primary_role'          => $primaryRole ? $primaryRole->name : 'user',
            'primary_role_icon'     => $primaryRole ? $primaryRole->icon : 'User',
            'primary_role_hierarchy' => $primaryRole ? $primaryRole->hierarchy_level : 5,
            'primary_role_dashboard' => $this->computeDashboardConfig($primaryRole), // kept for backward compat
            'dashboard'              => $this->computeDashboardConfig($primaryRole),
            'staff_member_id'       => $user->staffMember?->id,
            'org_id'                => $user->org_id,
            'company_id'            => $user->company_id,
            'organization_name'     => $user->organization?->name,
            'company_name'          => $user->company?->company_name,
        ];
    }

    /**
     * Compute the complete dashboard configuration for the authenticated user.
     *
     * ── Architecture ────────────────────────────────────────────────────────
     * The frontend is a pure renderer. It contains zero business logic.
     * This method is the single source of truth for every dashboard decision.
     *
     * The frontend simply reads:
     *   user.dashboard.show_my_dashboard    → render My Dashboard tab?
     *   user.dashboard.show_admin_dashboard → render Admin Dashboard tab?
     *   user.dashboard.default_dashboard    → which tab opens first?
     *
     * ── Zero hardcoding ─────────────────────────────────────────────────────
     * All decisions are driven by DB permissions (no role names, no hierarchy
     * levels, no threshold constants):
     *
     *   view_admin_dashboard         → show_admin_dashboard = true
     *   view_admin_dashboard_default → default_dashboard = 'admin'
     *
     * To change who sees what, update permission assignments in the database.
     * No code changes are required.
     */
    private function computeDashboardConfig(?Role $primaryRole): array
    {
        if ($primaryRole === null) {
            return [
                'show_my_dashboard'    => true,
                'show_admin_dashboard' => false,
                'default_dashboard'    => 'staff',
            ];
        }

        // Permissions are already eager-loaded via 'roles.permissions' in
        // formatUserData() — no extra DB query is triggered here.
        $rolePermissions = $primaryRole->permissions->pluck('name');

        // show_admin_dashboard: true when the role holds the 'view_admin_dashboard'
        // permission. Revoke the permission in the DB to hide the tab instantly.
        $showAdminDashboard = $rolePermissions->contains('view_admin_dashboard');

        // default_dashboard: 'admin' when the role holds 'view_admin_dashboard_default'.
        // Otherwise the user always lands on 'staff' (My Dashboard) first.
        $defaultDashboard = $rolePermissions->contains('view_admin_dashboard_default')
            ? 'admin'
            : 'staff';

        return [
            'show_my_dashboard'    => true,          // My Dashboard is always available
            'show_admin_dashboard' => $showAdminDashboard,
            'default_dashboard'    => $defaultDashboard,
        ];
    }
}
