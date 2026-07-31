<?php

namespace App\Services\Leave;

use App\Models\TimeOffCategory;
use App\Models\TimeOffRequest;
use App\Services\Core\BaseService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Leave Service
 *
 * Handles all business logic for leave/time-off management.
 */
class LeaveService extends BaseService
{
    protected string $modelClass = TimeOffRequest::class;

    protected array $defaultRelations = [
        'staffMember',
        'category',
        'approver',
    ];

    protected array $searchableFields = [
        'reason',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'time_off_category_id' => 'category_id',
    ];

    /**
     * Get all leave requests with filters.
     */
    public function getAllRequests(array $params = [])
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['status'])) {
            $query->where('approval_status', $params['status']);
        }

        // Date range filter
        if (! empty($params['start_date'])) {
            $query->where('start_date', '>=', $params['start_date']);
        }
        if (! empty($params['end_date'])) {
            $query->where('end_date', '<=', $params['end_date']);
        }

        // Month/Year filter
        if (! empty($params['month']) && ! empty($params['year'])) {
            $query->whereMonth('start_date', $params['month'])
                ->whereYear('start_date', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new leave request.
     */
    public function createRequest(array $data): TimeOffRequest
    {
        return DB::transaction(function () use ($data) {
            // Calculate total days
            $startDate = Carbon::parse($data['start_date']);
            $endDate = Carbon::parse($data['end_date']);
            $data['total_days'] = $startDate->diffInDays($endDate) + 1;

            $category = TimeOffCategory::find($data['time_off_category_id']);
            
            if ($category) {
                // Restrict sick leave to today or past dates
                $isSickLeave = stripos($category->title, 'sick') !== false || stripos($category->name, 'sick') !== false;
                if ($isSickLeave && $startDate->copy()->startOfDay()->isAfter(Carbon::today())) {
                    throw new \Exception("Sick leave cannot be applied for future dates. You can only apply for today or past dates.");
                }
            }

            if ($category && $category->max_per_month !== null) {
                $startMonth = $startDate->month;
                $startYear = $startDate->year;
                
                // Check how many days are already taken or pending this month
                $usedDays = TimeOffRequest::where('staff_member_id', $data['staff_member_id'])
                    ->where('time_off_category_id', $category->id)
                    ->whereIn('approval_status', ['pending', 'approved'])
                    ->whereMonth('start_date', $startMonth)
                    ->whereYear('start_date', $startYear)
                    ->sum('total_days');
                
                if (($usedDays + $data['total_days']) > $category->max_per_month) {
                    throw new \Exception("Cannot exceed the monthly limit of {$category->max_per_month} days for this leave category.");
                }
            }

            $data['approval_status'] = 'pending';

            return TimeOffRequest::create($data);
        });
    }

    /**
     * Approve a leave request.
     */
    public function approve(int|TimeOffRequest $request, int $approverId, ?string $notes = null): TimeOffRequest
    {
        if (is_int($request)) {
            $request = $this->findOrFail($request);
        }

        return DB::transaction(function () use ($request, $approverId, $notes) {
            $request->update([
                'approval_status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
                'approval_remarks' => $notes,
            ]);

            // Deduct leave balance if tracking is enabled
            $this->deductLeaveBalance($request);

            // Sync approved leave dates to work logs
            $this->syncApprovedLeaveToWorkLogs($request);

            return $request->fresh($this->defaultRelations);
        });
    }

    /**
     * Sync approved leave request days to work logs.
     */
    public function syncApprovedLeaveToWorkLogs(TimeOffRequest $request): void
    {
        if ($request->approval_status !== 'approved') {
            return;
        }

        $start = Carbon::parse($request->start_date);
        $end = Carbon::parse($request->end_date);
        $current = $start->copy();

        $request->loadMissing('category');
        $isPaid = \App\Services\Attendance\AttendanceService::isPaidLeaveRequest($request);
        $leaveLabel = $isPaid ? 'Approved Paid Leave' : 'Approved Unpaid Leave';
        $noteText = $leaveLabel . ($request->reason ? ": {$request->reason}" : '');

        while ($current <= $end) {
            $dateStr = $current->toDateString();
            $log = \App\Models\WorkLog::where('staff_member_id', $request->staff_member_id)
                ->whereDate('log_date', $dateStr)
                ->first();

            if (!$log) {
                \App\Models\WorkLog::create([
                    'staff_member_id' => $request->staff_member_id,
                    'log_date' => $dateStr,
                    'status' => 'on_leave',
                    'notes' => $noteText,
                ]);
            } elseif (!in_array($log->status, ['present', 'late', 'half_day'])) {
                $log->update([
                    'status' => 'on_leave',
                    'notes' => $noteText,
                ]);
            }

            $current->addDay();
        }
    }

    /**
     * Reject a leave request.
     */
    public function reject(int|TimeOffRequest $request, int $approverId, ?string $reason = null): TimeOffRequest
    {
        if (is_int($request)) {
            $request = $this->findOrFail($request);
        }

        $request->update([
            'approval_status' => 'declined',
            'approved_by' => $approverId,
            'approved_at' => now(),
            'approval_remarks' => $reason,
        ]);

        return $request->fresh($this->defaultRelations);
    }

    /**
     * Cancel a leave request.
     */
    public function cancel(int|TimeOffRequest $request): TimeOffRequest
    {
        if (is_int($request)) {
            $request = $this->findOrFail($request);
        }

        // Restore balance if it was deducted
        if ($request->approval_status === 'approved') {
            $this->restoreLeaveBalance($request);
        }

        $request->update(['approval_status' => 'declined']);

        return $request->fresh($this->defaultRelations);
    }

    /**
     * Get pending requests.
     */
    public function getPendingRequests(array $params = [])
    {
        $params['status'] = 'pending';

        return $this->getAllRequests($params);
    }

    /**
     * Get requests for a specific employee.
     */
    public function getEmployeeRequests(int $staffMemberId, array $params = [])
    {
        $params['staff_member_id'] = $staffMemberId;

        return $this->getAllRequests($params);
    }

    /**
     * Get leave balance for an employee.
     */
    public function getLeaveBalance(int $staffMemberId, ?int $year = null): array
    {
        $year = $year ?? now()->year;

        $staffMember = \App\Models\StaffMember::find($staffMemberId);
        
        $categoriesQuery = TimeOffCategory::active();
        if ($staffMember && $staffMember->office_location_id) {
            $categoriesQuery->where(function ($query) use ($staffMember) {
                $query->whereNull('office_location_id')
                      ->orWhere('office_location_id', $staffMember->office_location_id);
            });
        }
        
        $categories = $categoriesQuery->get();
        $balances = [];

        foreach ($categories as $category) {
            $used = TimeOffRequest::where('staff_member_id', $staffMemberId)
                ->where('time_off_category_id', $category->id)
                ->where('approval_status', 'approved')
                ->whereYear('start_date', $year)
                ->sum('total_days');

            $balances[] = [
                'category_id' => $category->id,
                'category_name' => $category->title,
                'allocated' => $category->annual_quota  ?? 0,
                'used' => $used,
                'remaining' => ($category->annual_quota  ?? 0) - $used,
            ];
        }

        return $balances;
    }

    /**
     * Get leave statistics.
     */
    public function getStatistics(?int $staffMemberId = null): array
    {
        $query = TimeOffRequest::query();

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('approval_status', 'pending')->count(),
            'approved' => (clone $query)->where('approval_status', 'approved')->count(),
            'declined' => (clone $query)->where('approval_status', 'declined')->count(),
            'approved_today' => (clone $query)->where('approval_status', 'approved')->whereDate('approved_at', now())->count(),
            'declined_today' => (clone $query)->where('approval_status', 'declined')->whereDate('approved_at', now())->count(),
        ];
    }

    /**
     * Get employees on leave for a specific date.
     */
    public function getOnLeave(?string $date = null): Collection
    {
        $date = $date ?? now()->toDateString();

        return TimeOffRequest::with('staffMember', 'category')
            ->where('approval_status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->get();
    }

    /**
     * Check if employee has pending request for date range.
     */
    public function hasOverlappingRequest(int $staffMemberId, string $startDate, string $endDate, ?int $excludeId = null): bool
    {
        $query = TimeOffRequest::where('staff_member_id', $staffMemberId)
            ->whereIn('approval_status', ['pending', 'approved'])
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                    });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Deduct leave balance (for approved requests).
     */
    protected function deductLeaveBalance(TimeOffRequest $request): void
    {
        // This can be extended to track balances in a separate table
        // For now, balance is calculated dynamically
    }

    /**
     * Restore leave balance (for cancelled approved requests).
     */
    protected function restoreLeaveBalance(TimeOffRequest $request): void
    {
        // This can be extended to track balances in a separate table
    }

    // ========================================
    // LEAVE CATEGORIES
    // ========================================

    /**
     * Get all leave categories.
     */
    public function getAllCategories(array $params = [])
    {
        $query = TimeOffCategory::query();

        if (! empty($params['active_only'])) {
            $query->where('is_active', true);
        }

        if (isset($params['office_location_id'])) {
            $query->where(function($q) use ($params) {
                $q->whereNull('office_location_id')
                  ->orWhere('office_location_id', $params['office_location_id']);
            });
        }

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->latest()->paginate($perPage)
            : $query->latest()->get();
    }

    /**
     * Create leave category.
     */
    public function createCategory(array $data): TimeOffCategory
    {
        return TimeOffCategory::create($data);
    }

    /**
     * Update leave category.
     */
    public function updateCategory(int $id, array $data): TimeOffCategory
    {
        $category = TimeOffCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete leave category.
     */
    public function deleteCategory(int $id): bool
    {
        return TimeOffCategory::findOrFail($id)->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getCategoriesForDropdown(?int $officeLocationId = null): Collection
    {
        $query = TimeOffCategory::where('is_active', true);
        
        if ($officeLocationId) {
            $query->where(function($q) use ($officeLocationId) {
                $q->whereNull('office_location_id')
                  ->orWhere('office_location_id', $officeLocationId);
            });
        }
        
        return $query->select('id', 'title')
            ->orderBy('title')
            ->get();
    }
}
