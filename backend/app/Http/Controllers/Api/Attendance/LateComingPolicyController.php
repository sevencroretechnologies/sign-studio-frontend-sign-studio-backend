<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Models\LateComingPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LateComingPolicyController extends Controller
{
    public function show(Request $request)
    {
        $user = Auth::user();
        $policy = LateComingPolicy::where('org_id', $user->org_id)
            ->where('company_id', $user->company_id)
            ->first();

        if (!$policy) {
            // Return defaults if none exists
            return response()->json([
                'success' => true,
                'data' => [
                    'allowed_late_days' => 2,
                    'grace_period_mins' => 10,
                    'deduction_type' => 'fixed_hourly_rate',
                    'third_day_penalty_percentage' => 50,
                ]
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $policy
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'allowed_late_days' => 'required|integer|min:0',
            'grace_period_mins' => 'required|integer|min:0',
            'deduction_type' => 'required|string',
            'third_day_penalty_percentage' => 'required|integer|min:0|max:1000',
        ]);

        $user = Auth::user();

        $policy = LateComingPolicy::updateOrCreate(
            [
                'org_id' => $user->org_id,
                'company_id' => $user->company_id,
            ],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Late coming policy updated successfully',
            'data' => $policy
        ]);
    }
}
