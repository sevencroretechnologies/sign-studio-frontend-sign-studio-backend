<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('time_off_categories', function (Blueprint $table) {
            $table->unsignedBigInteger('office_location_id')->nullable()->after('id');
            $table->integer('max_per_month')->nullable()->after('annual_quota');
            
            $table->foreign('office_location_id')->references('id')->on('office_locations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('time_off_categories', function (Blueprint $table) {
            $table->dropForeign(['office_location_id']);
            $table->dropColumn(['office_location_id', 'max_per_month']);
        });
    }
};
