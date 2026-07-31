<?php

namespace App\Http\Controllers\Api\Leave;

use App\Http\Controllers\Controller;
use App\Models\TimeOffCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TimeOffCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = TimeOffCategory::with(['author', 'officeLocation']);

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        if ($request->has('paid')) {
            $query->where('is_paid', $request->boolean('paid'));
        }

        // Filter by office_location_id if provided or based on user's role
        $user = $request->user();
        $isAdmin = $user->hasPermissionTo('view_admin_dashboard');
        
        if (!$isAdmin) {
            $staffMember = \App\Models\StaffMember::where('user_id', $user->id)->first();
            if ($staffMember && $staffMember->office_location_id) {
                $query->where(function ($q) use ($staffMember) {
                    $q->whereNull('office_location_id')
                      ->orWhere('office_location_id', $staffMember->office_location_id);
                });
            } else {
                $query->whereNull('office_location_id');
            }
        } elseif ($request->has('office_location_id')) {
            $query->where('office_location_id', $request->input('office_location_id'));
        }

        $categories = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'annual_quota' => 'required|integer|min:0',
            'notes' => 'nullable|string',
            'is_paid' => 'boolean',
            'is_active' => 'boolean',
            // Add these two lines for carry forward functionality
            'is_carry_forward_allowed' => 'boolean',
            'max_carry_forward_days' => 'nullable|integer|min:0',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'max_per_month' => 'nullable|integer|min:1',
        ]);

        $validated['author_id'] = $request->user()->id;
        $category = TimeOffCategory::create($validated);

        return $this->created($category, 'Time off category created');
    }

    public function show(TimeOffCategory $timeOffCategory)
    {
        return $this->success($timeOffCategory->load('author'));
    }

    public function update(Request $request, TimeOffCategory $timeOffCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'annual_quota' => 'sometimes|required|integer|min:0',
            'notes' => 'nullable|string',
            'is_paid' => 'boolean',
            'is_active' => 'boolean',
            'is_carry_forward_allowed' => 'boolean',
            'max_carry_forward_days' => 'nullable|integer|min:0',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'max_per_month' => 'nullable|integer|min:1',
        ]);

        $timeOffCategory->update($validated);

        return $this->success($timeOffCategory->fresh(), 'Time off category updated');
    }

    public function destroy(TimeOffCategory $timeOffCategory)
    {
        if ($timeOffCategory->requests()->exists()) {
            return $this->error('Cannot delete category with existing requests', 422);
        }

        $timeOffCategory->delete();

        return $this->noContent('Time off category deleted');
    }
}
