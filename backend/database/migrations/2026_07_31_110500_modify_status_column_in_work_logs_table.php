<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE work_logs MODIFY COLUMN status ENUM('in', 'present', 'absent', 'half_day', 'on_leave', 'holiday', 'week_off', 'not_punched_out', 'late') DEFAULT 'present'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE work_logs MODIFY COLUMN status ENUM('present', 'absent', 'half_day', 'on_leave', 'holiday') DEFAULT 'null'");
    }
};
