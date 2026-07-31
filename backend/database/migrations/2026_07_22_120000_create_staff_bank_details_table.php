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
        Schema::create('staff_bank_details', function (Blueprint $table) {
            $table->id();

          

            // Staff
            $table->foreignId('staff_id')->unique()->constrained('staff_members')->cascadeOnDelete();

            // Bank Details
            $table->string('bank_name');
            $table->string('account_holder_name');
            $table->string('account_number', 50);
            $table->string('ifsc_code', 20);

            // Verification
            $table->enum('verification_status', ['verified', 'unverified'])->default('unverified');

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

              // Organization & Company
            $table->foreignId('org_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_bank_details');
    }
};