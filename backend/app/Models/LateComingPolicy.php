<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LateComingPolicy extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'org_id',
        'company_id',
        'allowed_late_days',
        'grace_period_mins',
        'deduction_type',
        'third_day_penalty_percentage',
    ];
}
