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
            if (!Schema::hasColumn('staff_members', 'employment_type')) {
                $table->string('employment_type')->default('full_time')->nullable()->after('employment_status');
            }
            if (!Schema::hasColumn('staff_members', 'author_id')) {
                $table->unsignedBigInteger('author_id')->nullable()->after('user_id');
                $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_members', function (Blueprint $table) {
            if (Schema::hasColumn('staff_members', 'author_id')) {
                $table->dropForeign(['author_id']);
                $table->dropColumn('author_id');
            }
            if (Schema::hasColumn('staff_members', 'employment_type')) {
                $table->dropColumn('employment_type');
            }
        });
    }
};
