<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds GPS coordinates and geofence radius to office_locations table.
     */
    public function up(): void
    {
        Schema::table('office_locations', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('contact_email')
                ->comment('Office GPS latitude (-90 to 90)');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude')
                ->comment('Office GPS longitude (-180 to 180)');
            $table->unsignedInteger('allowed_radius')->default(100)->after('longitude')
                ->comment('Geofence radius in meters (default: 100m)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_locations', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'allowed_radius']);
        });
    }
};
