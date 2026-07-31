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
        Schema::table('staff_members', function (Blueprint $table) {
            if (!Schema::hasColumn('staff_members', 'employment_status')) {
                $table->enum('employment_status', ['active', 'exit'])->default('active')->after('ctc');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_members', function (Blueprint $table) {
            if (Schema::hasColumn('staff_members', 'employment_status')) {
                $table->dropColumn('employment_status');
            }
        });
    }
};
