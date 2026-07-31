<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\RoleAuditLog;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasOrgAndCompany, Notifiable;
    use HasRoles {
        assignRole as protected traitAssignRole;
        syncRoles as protected traitSyncRoles;
        removeRole as protected traitRemoveRole;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'is_active',
        'org_id',
        'company_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the staff member profile associated with this user.
     */
    public function staffMember()
    {
        return $this->hasOne(StaffMember::class);
    }

    /**
     * Override assignRole to automatically log assignments
     */
    public function assignRole(...$roles)
    {
        $oldRoles = $this->roles->pluck('name')->toArray();
        $result = $this->traitAssignRole(...$roles);
        $newRoles = $this->fresh()->roles->pluck('name')->toArray();

        RoleAuditLog::log(
            auth()->id() ?? $this->id,
            'user_roles_assigned',
            self::class,
            $this->id,
            ['roles' => $oldRoles],
            ['roles' => $newRoles]
        );

        return $result;
    }

    /**
     * Override syncRoles to automatically log assignments
     */
    public function syncRoles(...$roles)
    {
        $oldRoles = $this->roles->pluck('name')->toArray();
        $result = $this->traitSyncRoles(...$roles);
        $newRoles = $this->fresh()->roles->pluck('name')->toArray();

        RoleAuditLog::log(
            auth()->id() ?? $this->id,
            'user_roles_assigned',
            self::class,
            $this->id,
            ['roles' => $oldRoles],
            ['roles' => $newRoles]
        );

        return $result;
    }

    /**
     * Override removeRole to automatically log removal
     */
    public function removeRole($role)
    {
        $oldRoles = $this->roles->pluck('name')->toArray();
        $result = $this->traitRemoveRole($role);
        $newRoles = $this->fresh()->roles->pluck('name')->toArray();

        RoleAuditLog::log(
            auth()->id() ?? $this->id,
            'user_role_removed',
            self::class,
            $this->id,
            ['roles' => $oldRoles],
            ['roles' => $newRoles]
        );

        return $result;
    }

    /**
     * Get the organization associated with this user.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }

    /**
     * Get the company associated with this user.
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
