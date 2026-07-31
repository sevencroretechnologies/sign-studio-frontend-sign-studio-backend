<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds distance-from-office tracking columns to work_logs table.
     */
    public function up(): void
    {
        Schema::table('work_logs', function (Blueprint $table) {
            $table->decimal('clock_in_distance_from_office', 10, 2)->nullable()
                ->after('clock_in_accuracy')
                ->comment('Distance from office in meters at clock-in');
            $table->decimal('clock_out_distance_from_office', 10, 2)->nullable()
                ->after('clock_out_accuracy')
                ->comment('Distance from office in meters at clock-out');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_logs', function (Blueprint $table) {
            $table->dropColumn([
                'clock_in_distance_from_office',
                'clock_out_distance_from_office',
            ]);
        });
    }
};
