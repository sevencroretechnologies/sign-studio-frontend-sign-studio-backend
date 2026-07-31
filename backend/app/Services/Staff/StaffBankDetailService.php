<?php

namespace App\Services\Staff;

use App\Models\StaffBankDetail;
use App\Services\Core\BaseService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class StaffBankDetailService extends BaseService
{
    protected string $modelClass = StaffBankDetail::class;

    protected array $defaultRelations = [
        'staff.jobTitle'
    ];

    protected array $filterableFields = [
        'staff_id' => 'staff_id',
        'verification_status' => 'verification_status',
    ];

    /**
     * Get all records with optional filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        // Apply filters
        $query = $this->applyFilters($query, $params);

        // Multi-tenancy filter
        $user = auth()->user();
        if ($user) {
            $query->whereHas('staff', function ($q) use ($user) {
                if ($user->org_id) {
                    $q->where('org_id', $user->org_id);
                }
                if ($user->company_id) {
                    $q->where('company_id', $user->company_id);
                }
            });
        }

        // Apply search
        if (! empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('bank_name', 'like', "%{$search}%")
                  ->orWhere('account_holder_name', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%")
                  ->orWhere('ifsc_code', 'like', "%{$search}%")
                  ->orWhereHas('staff', function ($sq) use ($search) {
                      $sq->where('full_name', 'like', "%{$search}%");
                  });
            });
        }

        // Apply ordering
        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }
}
