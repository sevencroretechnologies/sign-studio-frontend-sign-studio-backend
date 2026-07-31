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
        Schema::table('late_coming_policies', function (Blueprint $table) {
            $table->foreignId('org_id')->nullable()->change();
            $table->foreignId('company_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('late_coming_policies', function (Blueprint $table) {
            $table->foreignId('org_id')->nullable(false)->change();
            $table->foreignId('company_id')->nullable(false)->change();
        });
    }
};
