<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffBankDetailResource;
use App\Services\Staff\StaffBankDetailService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Staff Bank Detail Controller
 *
 * Handles HTTP requests for staff bank detail management.
 */
class StaffBankDetailController extends Controller
{
    use ApiResponse;

    protected StaffBankDetailService $service;

    public function __construct(StaffBankDetailService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of staff bank details.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'search',
                'staff_id',
                'verification_status',
                'paginate',
                'per_page',
                'page',
                'order_by',
                'order',
            ]);

            $result = $this->service->getAll($params);

            if ($result instanceof \Illuminate\Pagination\LengthAwarePaginator) {
                $collection = StaffBankDetailResource::collection($result->getCollection());
                $result->setCollection($collection->collection);
            } else {
                $result = StaffBankDetailResource::collection($result);
            }

            return $this->success($result, 'Staff bank details retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff bank details: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created staff bank details.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'staff_id' => 'required|exists:staff_members,id|unique:staff_bank_details,staff_id',
                'bank_name' => 'required|string|max:255',
                'account_holder_name' => 'required|string|max:255',
                'account_number' => 'required|string|max:50',
                'ifsc_code' => 'required|string|max:20',
                'verification_status' => 'required|in:verified,unverified',
            ]);

            $validated['created_by'] = $request->user()?->id;
            $validated['updated_by'] = $request->user()?->id;

            $bankDetail = $this->service->create($validated);

            return $this->created(new StaffBankDetailResource($bankDetail), 'Staff bank details created successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create staff bank details: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified staff bank details.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $bankDetail = $this->service->findOrFail($id);

            return $this->success(new StaffBankDetailResource($bankDetail), 'Staff bank details retrieved successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff bank details not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff bank details: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified staff bank details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'staff_id' => 'sometimes|required|exists:staff_members,id|unique:staff_bank_details,staff_id,' . $id,
                'bank_name' => 'sometimes|required|string|max:255',
                'account_holder_name' => 'sometimes|required|string|max:255',
                'account_number' => 'sometimes|required|string|max:50',
                'ifsc_code' => 'sometimes|required|string|max:20',
                'verification_status' => 'sometimes|required|in:verified,unverified',
            ]);

            $validated['updated_by'] = $request->user()?->id;

            $bankDetail = $this->service->update($id, $validated);

            return $this->success(new StaffBankDetailResource($bankDetail), 'Staff bank details updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff bank details not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update staff bank details: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified staff bank details.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return $this->noContent('Staff bank details deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff bank details not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete staff bank details: ' . $e->getMessage());
        }
    }
}
