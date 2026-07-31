<?php

namespace App\Models;

use App\Traits\StandardDateSerialization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffBankDetail extends Model
{
    use HasFactory, SoftDeletes, StandardDateSerialization;

    protected $table = 'staff_bank_details';

    protected $fillable = [
        'staff_id',
        'bank_name',
        'account_holder_name',
        'account_number',
        'ifsc_code',
        'verification_status',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the staff member that owns the bank details.
     */
    public function staff()
    {
        return $this->belongsTo(StaffMember::class, 'staff_id');
    }

    /**
     * Get the user who created the record.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the record.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
