<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create the permission
        $permission = Permission::firstOrCreate(
            ['name' => 'bypass_geofence', 'guard_name' => 'web'],
            [
                'resource' => 'attendance',
                'action' => 'bypass_geofence',
                'description' => 'Bypass GPS geofence restrictions when clocking in/out',
                'sort_order' => 10,
            ]
        );

        // Assign it to admin role by default so admins always bypass
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permission);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permission = Permission::where('name', 'bypass_geofence')->first();
        if ($permission) {
            $permission->delete();
        }
    }
};
