<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Services\Staff\StaffMemberService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Staff Member Controller
 *
 * Handles HTTP requests for staff member management.
 * All business logic is delegated to StaffMemberService.
 */
class StaffMemberController extends Controller
{
    use ApiResponse;

    protected StaffMemberService $service;

    public function __construct(StaffMemberService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of staff members.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'branch_id' => 'nullable|integer|exists:office_locations,id',
                'department_id' => 'nullable|integer|exists:divisions,id',
                'office_location_id' => 'nullable|integer|exists:office_locations,id',
                'division_id' => 'nullable|integer|exists:divisions,id',
                'status' => 'nullable|string|max:50',
                'search' => 'nullable|string|max:255',
                'paginate' => 'nullable|in:true,false,1,0',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'order_by' => 'nullable|string|max:255',
                'order' => 'nullable|string|in:asc,desc,ASC,DESC',
            ]);

            $user = $request->user();
            $params = $request->only([
                'office_location_id',
                'division_id',
                'status',
                'search',
                'paginate',
                'per_page',
                'page',
                'order_by',
                'order',
            ]);

            // Merge validated filters
            $params['name'] = $validated['name'] ?? null;
            $params['branch_id'] = $validated['branch_id'] ?? null;
            $params['department_id'] = $validated['department_id'] ?? null;

            if ($user) {
                if ($user->org_id) {
                    $params['org_id'] = $user->org_id;
                }
                if ($user->company_id) {
                    $params['company_id'] = $user->company_id;
                }
            }

            $result = $this->service->getAll($params);

            return $this->success($result, 'Staff members retrieved successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff members: ' . $e->getMessage());
        }
    }

    /**
     * Display a listing of staff members for daily attendance, excluding admin's own record.
     */
    public function attendanceIndex(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'branch_id' => 'nullable|integer|exists:office_locations,id',
                'department_id' => 'nullable|integer|exists:divisions,id',
                'office_location_id' => 'nullable|integer|exists:office_locations,id',
                'division_id' => 'nullable|integer|exists:divisions,id',
                'status' => 'nullable|string|max:50',
                'search' => 'nullable|string|max:255',
                'paginate' => 'nullable|in:true,false,1,0',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'order_by' => 'nullable|string|max:255',
                'order' => 'nullable|string|in:asc,desc,ASC,DESC',
            ]);

            $user = $request->user();
            $params = $request->only([
                'office_location_id',
                'division_id',
                'status',
                'search',
                'paginate',
                'per_page',
                'page',
                'order_by',
                'order',
            ]);

            // Merge validated filters
            $params['name'] = $validated['name'] ?? null;
            $params['branch_id'] = $validated['branch_id'] ?? null;
            $params['department_id'] = $validated['department_id'] ?? null;

            if ($user) {
                if ($user->org_id) {
                    $params['org_id'] = $user->org_id;
                }
                if ($user->company_id) {
                    $params['company_id'] = $user->company_id;
                }
            }

            $result = $this->service->getAllForAttendance($params);

            return $this->success($result, 'Staff members retrieved successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff members: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $this->validateStoreRequest($request);

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                $validated['profile_image'] = $this->uploadProfileImage($request->file('profile_image'));
            }

            // Add org_id and company_id from authenticated user
            $authenticatedUser = $request->user();
            $validated['org_id'] = $authenticatedUser->org_id ?? null;
            $validated['company_id'] = $authenticatedUser->company_id ?? null;

            $staffMember = $this->service->createWithUser(
                $validated,
                $authenticatedUser?->id
            );

            $staffMember->load(['user', 'officeLocation', 'division', 'jobTitle']);

            return $this->created($staffMember, 'Staff member created successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create staff member: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified staff member.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $staffMember = $this->service->getFullProfile($id);

            return $this->success($staffMember, 'Staff member retrieved successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff member not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff member: ' . $e->getMessage());
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $this->validateUpdateRequest($request, $id);

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                $staffMember = \App\Models\StaffMember::findOrFail($id);
                if ($staffMember->profile_image) {
                    $oldPath = str_replace('/storage/', '', $staffMember->profile_image);
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($oldPath)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                    }
                }
                $validated['profile_image'] = $this->uploadProfileImage($request->file('profile_image'));
            }

            $staffMember = $this->service->updateWithUser($id, $validated);

            return $this->success($staffMember, 'Staff member updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff member not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update staff member: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deactivate($id);

            return $this->noContent('Staff member deactivated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff member not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to deactivate staff member: ' . $e->getMessage());
        }
    }

    /**
     * Get staff members for dropdown.
     */
    public function dropdown(Request $request): JsonResponse
    {
        try {
            $params = $request->only(['office_location_id', 'division_id']);
            $result = $this->service->getForDropdown($params);

            return $this->collection($result, 'Staff dropdown data retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve dropdown data: ' . $e->getMessage());
        }
    }

    /**
     * Validate store request.
     */
    protected function validateStoreRequest(Request $request): array
    {
        return $request->validate([
            'full_name' => 'required|string|max:255',
            'profile_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'email' => 'nullable|email|unique:users,email',
            'username' => 'nullable|string|unique:users,username',
            'password' => 'nullable|string|min:6',
            'personal_email' => 'nullable|email',
            'mobile_number' => 'required|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'home_address' => 'nullable|string',
            // 'nationality' => 'nullable|string|max:100',
            // 'passport_number' => 'nullable|string|max:50',
            // 'country_code' => 'nullable|string|max:3',
            // 'region' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'biometric_id' => 'nullable|string|max:50',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
            'job_title_id' => 'nullable|exists:job_titles,id',
            'date_of_joining' => 'nullable|date',
            'bank_account_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string',
            'bank_branch' => 'nullable|string',
            'compensation_type' => 'nullable|in:monthly,hourly,daily,contract',
            // 'base_salary' => 'nullable|numeric|min:0',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            // New fields
            'timestamp' => 'nullable|string|max:255',
            'blood_group' => 'nullable|string|max:10',
            'hobbies' => 'nullable|string',
            'marital_status' => 'nullable|string|max:50',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact_number' => 'nullable|string|max:20',
            'guardian_date_of_birth' => 'nullable|date',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_contact_number' => 'nullable|string|max:20',
            'date_of_anniversary' => 'nullable|date',
            'designation' => 'nullable|string|max:255',
            'date_of_joining' => 'nullable|date',
            'ctc' => 'nullable|numeric|min:0',
            'active_exit' => 'nullable|string|max:50',
        ]);
    }

    protected function validateUpdateRequest(Request $request, int $id): array
    {
        $staffMember = \App\Models\StaffMember::findOrFail($id);

        $profileImageRule = $request->hasFile('profile_image')
            ? 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048'
            : 'nullable|string|max:500';

        return $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'profile_image' => $profileImageRule,
            'email' => 'nullable|email|unique:users,email,' . $staffMember->user_id,
            'username' => 'nullable|string|unique:users,username,' . $staffMember->user_id,
            'password' => 'nullable|string|min:6',
            'personal_email' => 'nullable|email',
            'mobile_number' => 'required|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'home_address' => 'nullable|string',
            // 'nationality' => 'nullable|string|max:100',
            // 'passport_number' => 'nullable|string|max:50',
            'country_code' => 'nullable|string|max:3',
            'region' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'biometric_id' => 'nullable|string|max:50',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
            'job_title_id' => 'nullable|exists:job_titles,id',
            'date_of_joining' => 'nullable|date',
            'bank_account_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string',
            'bank_branch' => 'nullable|string',
            'compensation_type' => 'nullable|in:monthly,hourly,daily,contract',
            // 'base_salary' => 'nullable|numeric|min:0',
            'employment_status' => 'nullable|in:active,on_leave,suspended,terminated,resigned',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            // New fields
            'timestamp' => 'nullable|string|max:255',
            'blood_group' => 'nullable|string|max:10',
            'hobbies' => 'nullable|string',
            'marital_status' => 'nullable|string|max:50',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact_number' => 'nullable|string|max:20',
            'guardian_date_of_birth' => 'nullable|date',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_contact_number' => 'nullable|string|max:20',
            'date_of_anniversary' => 'nullable|date',
            'designation' => 'nullable|string|max:255',
            'date_of_joining' => 'nullable|date',
            'ctc' => 'nullable|numeric|min:0',
            'active_exit' => 'nullable|string|max:50',
        ]);
    }

    /**
     * Upload profile image and return the file path.
     */
    protected function uploadProfileImage($file): string
    {
        $folderName = 'staff_profiles';
        $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $filePath = $file->storeAs($folderName, $fileName, 'public');

        return '/storage/' . $filePath;
    }

}
