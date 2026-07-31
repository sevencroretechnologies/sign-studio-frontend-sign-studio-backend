<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::table('staff_members', function (Blueprint $table) {
    $columns = ['nationality', 'passport_number', 'country_code', 'region', 'biometric_id', 'bank_account_name', 'bank_account_number', 'bank_name', 'bank_branch', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'];
    
    foreach ($columns as $column) {
        if (Schema::hasColumn('staff_members', $column)) {
            $table->dropColumn($column);
        }
    }
});

echo "Columns dropped.\n";
