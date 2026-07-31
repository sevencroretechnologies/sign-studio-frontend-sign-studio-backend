<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeOffCategory extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'office_location_id',
        'annual_quota',
        'max_per_month',
        'notes',
        'is_paid',
        'is_active',
        'tenant_id',
        'author_id',
        'is_carry_forward_allowed',
        'max_carry_forward_days',
    ];

    protected $casts = [
        'annual_quota' => 'integer',
        'max_per_month' => 'integer',
        'is_paid' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function officeLocation()
    {
        return $this->belongsTo(OfficeLocation::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function requests()
    {
        return $this->hasMany(TimeOffRequest::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
