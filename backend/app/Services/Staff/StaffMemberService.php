<?php

namespace App\Services\Staff;

use App\Models\StaffMember;
use App\Models\User;
use App\Services\Core\BaseService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Staff Member Service
 *
 * Handles all business logic related to staff members/employees.
 */
class StaffMemberService extends BaseService
{
    protected string $modelClass = StaffMember::class;

    protected array $defaultRelations = [
        'user',
        'officeLocation',
        'division',
        'jobTitle',
    ];

    protected array $searchableFields = [
        'full_name',
        'staff_code',
        'personal_email',
        'mobile_number',
    ];

    protected array $filterableFields = [
        'office_location_id' => 'office_location_id',
        'division_id' => 'division_id',
        'job_title_id' => 'job_title_id',
        'employment_status' => 'status',
        'gender' => 'gender',
        'org_id' => 'org_id',
        'company_id' => 'company_id',
    ];

    /**
     * Get all records with optional filtering and pagination.
     */
    public function getAll(array $params = []): \Illuminate\Pagination\LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        // Apply filters
        $query = $this->applyFilters($query, $params);

        // Apply name filter (partial match, case-insensitive)
        $query->when(!empty($params['name']), function ($q) use ($params) {
            $q->where('full_name', 'like', "%{$params['name']}%");
        });

        // Apply branch filter (office_location_id)
        $query->when(!empty($params['branch_id']), function ($q) use ($params) {
            $q->where('office_location_id', $params['branch_id']);
        });

        // Apply department filter (division_id)
        $query->when(!empty($params['department_id']), function ($q) use ($params) {
            $q->where('division_id', $params['department_id']);
        });

        // Apply search
        if (!empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        // Apply ordering
        $query = $this->applyOrdering($query, $params);

        // Paginate or get all
        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Get all records for attendance view with admin exclusion.
     */
    public function getAllForAttendance(array $params = []): \Illuminate\Pagination\LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        // Apply filters
        $query = $this->applyFilters($query, $params);

        // Apply name filter (partial match, case-insensitive)
        $query->when(! empty($params['name']), function ($q) use ($params) {
            $q->where('full_name', 'like', "%{$params['name']}%");
        });

        // Apply branch filter (office_location_id)
        $query->when(! empty($params['branch_id']), function ($q) use ($params) {
            $q->where('office_location_id', $params['branch_id']);
        });

        // Apply department filter (division_id)
        $query->when(! empty($params['department_id']), function ($q) use ($params) {
            $q->where('division_id', $params['department_id']);
        });

        // Apply search
        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        // Apply ordering
        $query = $this->applyOrdering($query, $params);
        
        // Hide admin's own data from the staff list
        $user = auth()->user();
        if ($user && $user->hasPermissionTo('view_admin_dashboard')) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('user_id')
                    ->orWhere('user_id', '!=', $user->id);
            });
        }

        // Paginate or get all
        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Get all staff members with extended relations.
     */
    public function getAllWithDetails(array $params = [])
    {
        $query = $this->query()->with([
            'user',
            'officeLocation',
            'division',
            'jobTitle',
            'files.fileCategory',
        ]);

        $query = $this->applyFilters($query, $params);

        // Hide admin's own data from the staff list
        $user = auth()->user();
        if ($user && $user->hasPermissionTo('view_admin_dashboard')) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('user_id')
                    ->orWhere('user_id', '!=', $user->id);
            });
        }

        if (!empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new staff member with associated user account.
     */
    public function createWithUser(array $data, ?int $authorId = null): StaffMember
    {
        return DB::transaction(function () use ($data, $authorId) {
            // Get the authenticated user to inherit org_id and company_id
            $authenticatedUser = auth()->user();

            // Extract org_id and company_id from data or authenticated user
            $orgId = $data['org_id'] ?? $authenticatedUser->org_id ?? null;
            $companyId = $data['company_id'] ?? $authenticatedUser->company_id ?? null;

            // Set email to null if missing instead of auto-generating
            $email = !empty($data['email']) ? $data['email'] : null;

            // Create user account with org_id and company_id
            $user = User::create([
                'name' => $data['full_name'],
                'username' => $data['username'] ?? null,
                'email' => $email,
                'password' => Hash::make($data['password'] ?? 'password123'),
                'org_id' => $orgId,
                'company_id' => $companyId,
                'is_active' => true,
            ]);
            $user->assignRole('user');

            // Prepare staff member data
            $staffData = collect($data)->except(['email', 'username', 'password'])->toArray();
            $staffData['user_id'] = $user->id;
            // Ensure org_id and company_id are stored in staff_members table
            $staffData['org_id'] = $orgId;
            $staffData['company_id'] = $companyId;

            if ($authorId) {
                $staffData['author_id'] = $authorId;
            }

            return StaffMember::create($staffData);
        });
    }

    /**
     * Update staff member and associated user.
     */
    public function updateWithUser(int|StaffMember $staffMember, array $data): StaffMember
    {
        if (is_int($staffMember)) {
            $staffMember = $this->findOrFail($staffMember);
        }

        return DB::transaction(function () use ($staffMember, $data) {
            // Extract user fields for user update and keep staff member fields only
            $staffData = collect($data)->except(['email', 'username', 'password'])->toArray();

            // Auto-sync active_exit based on employment_status
            if (isset($staffData['employment_status'])) {
                $staffData['active_exit'] = in_array($staffData['employment_status'], ['terminated', 'resigned']) ? 'exit' : 'active';
            }

            $staffMember->update($staffData);

            // Update linked user name/email/status if they are changed
            if ($staffMember->user) {
                $userUpdates = [];
                if (isset($data['full_name'])) {
                    $userUpdates['name'] = $data['full_name'];
                }
                if (isset($data['email']) && trim($data['email']) !== '') {
                    $userUpdates['email'] = trim($data['email']);
                }
                if (array_key_exists('username', $data)) {
                    $userUpdates['username'] = $data['username'];
                }
                if (!empty($data['password'])) {
                    $userUpdates['password'] = Hash::make($data['password']);
                }
                if (isset($data['employment_status'])) {
                    if (in_array($data['employment_status'], ['terminated', 'resigned'])) {
                        $userUpdates['is_active'] = false;
                    } else {
                        $userUpdates['is_active'] = true;
                    }
                }
                if (!empty($userUpdates)) {
                    $staffMember->user->update($userUpdates);
                }
            }

            return $staffMember->fresh($this->defaultRelations);
        });
    }

    /**
     * Deactivate a staff member (soft delete).
     */
    public function deactivate(int|StaffMember $staffMember): bool
    {
        if (is_int($staffMember)) {
            $staffMember = $this->findOrFail($staffMember);
        }

        return DB::transaction(function () use ($staffMember) {
            if ($staffMember->user) {
                $staffMember->user->update(['is_active' => false]);
            }
            $staffMember->update(['employment_status' => 'terminated']);

            return $staffMember->delete();
        });
    }

    /**
     * Get staff member with full details for profile view.
     */
    public function getFullProfile(int $id): StaffMember
    {
        return $this->findOrFail($id, [
            'user',
            'officeLocation',
            'division',
            'jobTitle',
            'files.fileCategory',
            'recognitionRecords.category',
            'roleUpgrades.newJobTitle',
            'disciplineNotes',
            'businessTrips',
            'voluntaryExits',
        ]);
    }

    /**
     * Get staff members for dropdown/select.
     */
    public function getForDropdown(array $params = [], array $fields = ['id', 'full_name']): Collection
    {
        $query = StaffMember::active()->select(['id', 'full_name', 'staff_code']);

        if (!empty($params['office_location_id'])) {
            $query->forLocation($params['office_location_id']);
        }
        if (!empty($params['division_id'])) {
            $query->forDivision($params['division_id']);
        }

        return $query->orderBy('full_name')->get();
    }

    /**
     * Get active staff count.
     */
    public function getActiveCount(): int
    {
        return StaffMember::active()->count();
    }

    /**
     * Get staff by employment status.
     */
    public function getByStatus(string $status)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('employment_status', $status)
            ->latest()
            ->get();
    }

    /**
     * Get staff members by office location.
     */
    public function getByLocation(int $locationId)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->forLocation($locationId)
            ->latest()
            ->get();
    }

    /**
     * Get staff members by division.
     */
    public function getByDivision(int $divisionId)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->forDivision($divisionId)
            ->latest()
            ->get();
    }

    /**
     * Update employment status.
     */
    public function updateStatus(int|StaffMember $staffMember, string $status): StaffMember
    {
        if (is_int($staffMember)) {
            $staffMember = $this->findOrFail($staffMember);
        }

        $staffMember->update(['employment_status' => $status]);

        return $staffMember->fresh();
    }

    /**
     * Get recently hired employees.
     */
    public function getRecentHires(int $days = 30)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('date_of_joining', '>=', now()->subDays($days))
            ->latest('date_of_joining')
            ->get();
    }

    /**
     * Get employees with upcoming birthdays.
     */
    public function getUpcomingBirthdays(int $days = 30)
    {
        $today = now();
        $futureDate = now()->addDays($days);

        return $this->query()
            ->whereNotNull('birth_date')
            ->whereRaw("DATE_FORMAT(birth_date, '%m-%d') >= ?", [$today->format('m-d')])
            ->whereRaw("DATE_FORMAT(birth_date, '%m-%d') <= ?", [$futureDate->format('m-d')])
            ->orderByRaw("DATE_FORMAT(birth_date, '%m-%d')")
            ->get();
    }

    /**
     * Get staff statistics.
     */
    public function getStatistics(array $params = []): array
    {
        $query = StaffMember::query();

        if (!empty($params['org_id'])) {
            $query->where('org_id', $params['org_id']);
        }
        if (!empty($params['company_id'])) {
            $query->where('company_id', $params['company_id']);
        }

        $total = (clone $query)->count();
        $active = (clone $query)->active()->count();
        $onLeave = (clone $query)->where('employment_status', 'on_leave')->count();

        $newThisMonth = (clone $query)->whereMonth('date_of_joining', now()->month)
            ->whereYear('date_of_joining', now()->year)
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'on_leave' => $onLeave,
            'inactive' => $total - $active,
            'new_this_month' => $newThisMonth,
        ];
    }

    /**
     * Search staff members.
     */
    public function search(string $term, int $limit = 10)
    {
        return $this->query()
            ->with(['division', 'jobTitle'])
            ->where(function ($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                    ->orWhere('staff_code', 'like', "%{$term}%")
                    ->orWhere('personal_email', 'like', "%{$term}%");
            })
            ->active()
            ->limit($limit)
            ->get();
    }
}
