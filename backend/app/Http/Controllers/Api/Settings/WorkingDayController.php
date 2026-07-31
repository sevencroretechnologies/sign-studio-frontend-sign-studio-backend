<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Core\BaseController;
use App\Models\WorkingDay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WorkingDayController extends Controller
{
    /**
     * Get all working days configurations.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = WorkingDay::with(['organization', 'company']);

            // Get authenticated user
            $user = $request->user();

            // Filter by authenticated user's organization and company
            if ($user->org_id) {
                $query->where('org_id', $user->org_id);
            }

            if ($user->company_id) {
                $query->where('company_id', $user->company_id);
            }

            // Filter by date
            if ($request->has('date')) {
                $query->forDate($request->date);
            }

            // Order by latest
            $query->orderBy('created_at', 'desc');

            // Paginate or get all
            $paginate = $request->get('paginate', true);
            $perPage = $request->get('per_page', 15);

            $result = $paginate
                ? $query->paginate($perPage)
                : $query->get();

            return response()->json([
                'success' => true,
                'data' => $result,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch working days: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific working day configuration.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $workingDay = WorkingDay::with(['organization', 'company'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $workingDay,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Working day configuration not found.',
            ], 404);
        }
    }

    /**
     * Store a new working day configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'monday' => 'boolean',
            'tuesday' => 'boolean',
            'wednesday' => 'boolean',
            'thursday' => 'boolean',
            'friday' => 'boolean',
            'saturday' => 'boolean',
            'sunday' => 'boolean',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Get org_id and company_id from authenticated user
            $user = $request->user();

            $data = $validator->validated();
            $orgId = $user->org_id;
            $companyId = $user->company_id;

            // Scenario 1: Check if there's an existing unclosed record (to_date is null)
            $existingOpenRecord = WorkingDay::where('org_id', $orgId)
                ->where('company_id', $companyId)
                ->whereNull('to_date')
                ->first();

            if ($existingOpenRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'There is an existing working days configuration without an end date. Please close that configuration by setting a "To Date" before creating a new one.',
                    'existing_record' => $existingOpenRecord,
                ], 422);
            }

            // Scenario 2: Check for overlapping date ranges
            $fromDate = $data['from_date'] ?? null;
            $toDate = $data['to_date'] ?? null;

            $query = WorkingDay::where('org_id', $orgId)
                ->where('company_id', $companyId);

            if ($fromDate) {
                // Check for any overlap between the new date range and existing records
                $query->where(function ($q) use ($fromDate, $toDate) {
                    // Two ranges A and B overlap if (StartA <= EndB or EndB is infinity) AND (EndA >= StartB or EndA is infinity)
                    // Here, A is the existing record, B is the new record.
                    
                    // Condition 1: StartA <= EndB or EndB is infinity
                    $q->where(function ($query) use ($toDate) {
                        if ($toDate) {
                            $query->whereNull('from_date')
                                  ->orWhere('from_date', '<=', $toDate);
                        } else {
                            // If new record has no end date (EndB is infinity), this condition is always true.
                            // We just need a dummy true condition or just not add this where clause.
                            // Since we are inside a where closure, we can just do whereNotNull('id') to always pass.
                            $query->whereNotNull('id');
                        }
                    });

                    // Condition 2: EndA >= StartB or EndA is infinity
                    $q->where(function ($query) use ($fromDate) {
                        // StartB is always $fromDate
                        $query->whereNull('to_date')
                              ->orWhere('to_date', '>=', $fromDate);
                    });
                });
            }

            $overlappingRecord = $query->first();

            if ($overlappingRecord) {
                $message = 'This date range overlaps with an existing working days configuration. ';
                if ($overlappingRecord->from_date && $overlappingRecord->to_date) {
                    $fromDateStr = \Carbon\Carbon::parse($overlappingRecord->from_date)->format('M d, Y');
                    $toDateStr = \Carbon\Carbon::parse($overlappingRecord->to_date)->format('M d, Y');
                    $message .= "Existing configuration: {$fromDateStr} to {$toDateStr}. Please use different dates or update the existing configuration.";
                } elseif ($overlappingRecord->from_date) {
                    $fromDateStr = \Carbon\Carbon::parse($overlappingRecord->from_date)->format('M d, Y');
                    $message .= "Existing configuration starts from {$fromDateStr}. Please update that configuration first.";
                } else {
                    $message .= 'Please update the existing configuration first.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'existing_record' => $overlappingRecord,
                ], 422);
            }

            $data['org_id'] = $orgId;
            $data['company_id'] = $companyId;

            $workingDay = WorkingDay::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Working day configuration created successfully.',
                'data' => $workingDay->load(['organization', 'company']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create working day configuration: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a working day configuration.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'monday' => 'boolean',
            'tuesday' => 'boolean',
            'wednesday' => 'boolean',
            'thursday' => 'boolean',
            'friday' => 'boolean',
            'saturday' => 'boolean',
            'sunday' => 'boolean',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $workingDay = WorkingDay::findOrFail($id);
            $data = $validator->validated();

            // Get authenticated user for org_id and company_id
            $user = $request->user();
            $orgId = $user->org_id;
            $companyId = $user->company_id;

            // Check for overlapping date ranges with other records (excluding current record)
            $fromDate = $data['from_date'] ?? $workingDay->from_date;
            $toDate = $data['to_date'] ?? $workingDay->to_date;

            // Build query to find overlapping records
            $query = WorkingDay::where('org_id', $orgId)
                ->where('company_id', $companyId)
                ->where('id', '!=', $id); // Exclude current record

            if ($fromDate) {
                // Check for any overlap between the new date range and existing records
                $query->where(function ($q) use ($fromDate, $toDate) {
                    // Two ranges A and B overlap if (StartA <= EndB or EndB is infinity) AND (EndA >= StartB or EndA is infinity)
                    // Here, A is the existing record, B is the new record.
                    
                    // Condition 1: StartA <= EndB or EndB is infinity
                    $q->where(function ($query) use ($toDate) {
                        if ($toDate) {
                            $query->whereNull('from_date')
                                  ->orWhere('from_date', '<=', $toDate);
                        } else {
                            // If new record has no end date (EndB is infinity), this condition is always true.
                            $query->whereNotNull('id');
                        }
                    });

                    // Condition 2: EndA >= StartB or EndA is infinity
                    $q->where(function ($query) use ($fromDate) {
                        // StartB is always $fromDate
                        $query->whereNull('to_date')
                              ->orWhere('to_date', '>=', $fromDate);
                    });
                });
            }

            $overlappingRecord = $query->first();

            if ($overlappingRecord) {
                $message = 'This date range overlaps with an existing working days configuration. ';
                if ($overlappingRecord->from_date && $overlappingRecord->to_date) {
                    $fromDateStr = \Carbon\Carbon::parse($overlappingRecord->from_date)->format('M d, Y');
                    $toDateStr = \Carbon\Carbon::parse($overlappingRecord->to_date)->format('M d, Y');
                    $message .= "Existing configuration: {$fromDateStr} to {$toDateStr}.";
                } elseif ($overlappingRecord->from_date) {
                    $fromDateStr = \Carbon\Carbon::parse($overlappingRecord->from_date)->format('M d, Y');
                    $message .= "Existing configuration starts from {$fromDateStr} (no end date).";
                }

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'existing_record' => $overlappingRecord,
                ], 422);
            }

            $workingDay->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Working day configuration updated successfully.',
                'data' => $workingDay->load(['organization', 'company']),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update working day configuration: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a working day configuration.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $workingDay = WorkingDay::findOrFail($id);
            $workingDay->delete();

            return response()->json([
                'success' => true,
                'message' => 'Working day configuration deleted successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete working day configuration: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get working days count for a specific date range.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getWorkingDaysCount(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $startDate = \Carbon\Carbon::parse($request->start_date);
            $endDate = \Carbon\Carbon::parse($request->end_date);

            // Get authenticated user
            $user = $request->user();

            // Build query
            $query = WorkingDay::query();

            // Filter by authenticated user's organization and company
            if ($user->org_id) {
                $query->where('org_id', $user->org_id);
            }

            if ($user->company_id) {
                $query->where('company_id', $user->company_id);
            }

            $workingDaysConfig = $query->get();

            if ($workingDaysConfig->isEmpty()) {
                // Default to Monday-Friday if no config found
                $workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            } else {
                // Use the first matching configuration
                $config = $workingDaysConfig->first();
                $workingDays = array_keys(array_filter($config->getWorkingDaysArray()));
            }

            // Count working days in the range
            $workingDaysCount = 0;
            $totalDays = $startDate->diffInDays($endDate) + 1;
            $workingDates = [];

            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dayName = strtolower($date->format('l'));
                if (in_array($dayName, $workingDays)) {
                    $workingDaysCount++;
                    $workingDates[] = $date->format('Y-m-d');
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                    'total_days' => $totalDays,
                    'working_days_count' => $workingDaysCount,
                    'working_days' => $workingDays,
                    'working_dates' => $workingDates,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate working days: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get active working days configuration for a specific date.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getActiveConfig(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $query = WorkingDay::forDate($request->date);

            // Get authenticated user
            $user = $request->user();

            // Filter by authenticated user's organization and company
            if ($user->org_id) {
                $query->where('org_id', $user->org_id);
            }

            if ($user->company_id) {
                $query->where('company_id', $user->company_id);
            }

            $workingDay = $query->first();

            if (!$workingDay) {
                // Return default configuration (Monday-Friday)
                return response()->json([
                    'success' => true,
                    'data' => [
                        'monday' => true,
                        'tuesday' => true,
                        'wednesday' => true,
                        'thursday' => true,
                        'friday' => true,
                        'saturday' => false,
                        'sunday' => false,
                        'from_date' => null,
                        'to_date' => null,
                        'is_default' => true,
                    ],
                ], 200);
            }

            return response()->json([
                'success' => true,
                'data' => $workingDay->append('is_default'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch working days configuration: ' . $e->getMessage(),
            ], 500);
        }
    }
}
