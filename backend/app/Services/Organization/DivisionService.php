<?php

namespace App\Services\Organization;

use App\Models\Division;
use App\Services\Core\BaseService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Division Service
 *
 * Handles all business logic for division/department management.
 */
class DivisionService extends BaseService
{
    protected string $modelClass = Division::class;

protected array $defaultRelations = [
    'officeLocation',
];

  protected array $searchableFields = [
    'title',
];

    protected array $filterableFields = [
        'office_location_id' => 'office_location_id',
    ];

    /**
     * Get all divisions with filtering and pagination.
     */
public function getAll(array $params = []): LengthAwarePaginator|Collection
{
    $query = $this->query()->with('officeLocation');

    // Filter by office location
    if (!empty($params['office_location_id'])) {
        $query->where('office_location_id', $params['office_location_id']);
    }

    // Search by Division title OR Office Location title
    if (!empty($params['search'])) {

        $search = trim($params['search']);

        $query->where(function ($q) use ($search) {

            $q->where('title', 'LIKE', "%{$search}%")
              ->orWhereHas('officeLocation', function ($location) use ($search) {

                  $location->where('title', 'LIKE', "%{$search}%");

              });

        });
    }

    // Ordering
    if (!empty($params['order_by'])) {

        $query->orderBy(
            $params['order_by'],
            $params['order'] ?? 'asc'
        );

    } else {

        $query->orderBy('title');

    }

    // Pagination
    $paginate = ($params['paginate'] ?? 'true') !== 'false';
    $perPage = $params['per_page'] ?? $this->perPage;

    return $paginate
        ? $query->paginate($perPage)
        : $query->get();
}

    /**
     * Create a division.
     */
    public function create(array $data): Division
    {
        $division = Division::create($data);

        return $division->load($this->defaultRelations);
    }

    /**
     * Update a division.
     */
    public function update($division, array $data): Division
    {
        if (is_int($division)) {
            $division = $this->findOrFail($division);
        }

        $division->update($data);

        return $division->fresh($this->defaultRelations);
    }

    /**
     * Delete a division.
     */
    public function delete($division): bool
    {
        if (is_int($division)) {
            $division = $this->findOrFail($division);
        }

        return $division->delete();
    }

    /**
     * Get divisions by office location.
     */
    public function getByOfficeLocation(int $officeLocationId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('office_location_id', $officeLocationId)
            ->orderBy('title')
            ->get();
    }

    /**
     * Get divisions for dropdown.
     */
    // Keep signature compatible with BaseService::getForDropdown
    public function getForDropdown($companyId = null, $officeLocationId = null): Collection
    {
        $query = $this->query()->select(['id', 'title', 'office_location_id']);

        if ($officeLocationId) {
            $query->where('office_location_id', $officeLocationId);
        }

        return $query->orderBy('title')->get();
    }
}
