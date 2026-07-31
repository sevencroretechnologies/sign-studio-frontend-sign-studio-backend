<?php

namespace App\Services\Attendance;

use App\Models\StaffMember;
use Illuminate\Support\Facades\Log;

/**
 * GeofenceService
 *
 * Provides GPS-based geofence validation for employee attendance.
 * Uses the Haversine formula to calculate distances between two
 * GPS coordinates, then validates whether an employee is within
 * their assigned office's allowed radius.
 */
class GeofenceService
{
    /**
     * -------------------------------------------------------
     * TEST MODE — Set to true to bypass the database entirely.
     * Uses the hardcoded office coordinates below for testing.
     * Set back to false after running migrations.
     * -------------------------------------------------------
     */
    protected bool $testMode = false;

    /**
     * Hardcoded office coordinates for TEST MODE only.
     * Replace these with your actual office GPS coordinates.
     * Get them from Google Maps → right-click your office → copy the numbers.
     */
    protected float $testOfficeLat = 15.359284;   // ← replace with your office lat
    protected float $testOfficeLng = 75.127605;   // ← replace with your office lng
    protected int $testAllowedRadius = 100;        // metres

    /**
     * Maximum acceptable GPS accuracy in meters.
     * Requests with accuracy worse than this are rejected.
     */
    protected int $maxAccuracyThreshold = 500;

    /**
     * Calculate the distance in meters between two GPS coordinates
     * using the Haversine formula.
     *
     * @param  float  $lat1  Latitude of point 1 (degrees)
     * @param  float  $lon1  Longitude of point 1 (degrees)
     * @param  float  $lat2  Latitude of point 2 (degrees)
     * @param  float  $lon2  Longitude of point 2 (degrees)
     * @return float Distance in meters
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        // Earth's mean radius in meters
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Validate whether an employee is within their office's geofence.
     *
     * @param  int        $staffMemberId  The ID of the StaffMember record
     * @param  float      $latitude       Employee's current GPS latitude
     * @param  float      $longitude      Employee's current GPS longitude
     * @param  float|null $accuracy       GPS fix accuracy in meters (optional)
     * @return array{
     *     allowed: bool,
     *     distance: float|null,
     *     message: string
     * }
     */
    public function validateLocation(
        int $staffMemberId,
        float $latitude,
        float $longitude,
        ?float $accuracy = null
    ): array {
        // --- Step 1: Validate GPS accuracy ---
        if ($accuracy !== null && $accuracy > $this->maxAccuracyThreshold) {
            return [
                'allowed' => false,
                'distance' => null,
                'message' => "GPS signal is too inaccurate ({$accuracy}m accuracy). Please move to an open area and try again.",
            ];
        }

        // --- TEST MODE: Use hardcoded coordinates, skip database ---
        if ($this->testMode) {
            $distance = $this->calculateDistance(
                $this->testOfficeLat,
                $this->testOfficeLng,
                $latitude,
                $longitude
            );
            $distanceRounded = round($distance, 2);
            $allowedRadius = $this->testAllowedRadius;

            Log::info('[GeofenceService TEST MODE]', [
                'staff_member_id' => $staffMemberId,
                'employee_lat' => $latitude,
                'employee_lng' => $longitude,
                'office_lat' => $this->testOfficeLat,
                'office_lng' => $this->testOfficeLng,
                'distance_m' => $distanceRounded,
                'allowed_radius' => $allowedRadius,
                'allowed' => $distance <= $allowedRadius,
            ]);

            if ($distance <= $allowedRadius) {
                return [
                    'allowed' => true,
                    'distance' => $distanceRounded,
                    'message' => "[TEST] You are {$distanceRounded}m from the office (within {$allowedRadius}m radius).",
                ];
            }

            $excessMeters = round($distance - $allowedRadius);
            return [
                'allowed' => false,
                'distance' => $distanceRounded,
                'message' => "You are {$distanceRounded}m from the office. You must be within {$allowedRadius}m to mark attendance. Please move {$excessMeters}m closer.",
            ];
        }
        // --- END TEST MODE ---

        // --- Step 2: Load staff member with their assigned office location and division ---
        $staffMember = StaffMember::with(['officeLocation', 'division'])
            ->find($staffMemberId);

        if (!$staffMember) {
            Log::warning('GeofenceService: Staff member not found', [
                'staff_member_id' => $staffMemberId,
            ]);
            return [
                'allowed' => false,
                'distance' => null,
                'message' => 'Staff member record not found.',
            ];
        }

        // --- Step 2.5: Geofence bypass based on permission ---
        if ($staffMember->user && $staffMember->user->hasPermissionTo('bypass_geofence')) {
            Log::info('GeofenceService: Geofence bypassed via permission', [
                'staff_member_id' => $staffMemberId,
                'user_id' => $staffMember->user->id,
            ]);
            return [
                'allowed' => true,
                'distance' => null,
                'message' => 'Geofence bypassed via permission: Location validated from remote site.',
            ];
        }

        $officeLocation = $staffMember->officeLocation;

        // --- Step 3: Check office location exists and has GPS coordinates ---
        if (!$officeLocation) {
            // If no office location is assigned, skip geofence validation (allow)
            Log::info('GeofenceService: No office location assigned — skipping geofence', [
                'staff_member_id' => $staffMemberId,
            ]);
            return [
                'allowed' => true,
                'distance' => null,
                'message' => 'No office location assigned — geofence skipped.',
            ];
        }

        if ($officeLocation->latitude === null || $officeLocation->longitude === null) {
            // Office location exists but GPS coordinates not configured — skip validation
            Log::info('GeofenceService: Office location has no GPS coordinates — skipping geofence', [
                'staff_member_id' => $staffMemberId,
                'office_location_id' => $officeLocation->id,
            ]);
            return [
                'allowed' => true,
                'distance' => null,
                'message' => 'Office GPS coordinates not configured — geofence skipped.',
            ];
        }

        // --- Step 4: Calculate distance ---
        $distance = $this->calculateDistance(
            (float) $officeLocation->latitude,
            (float) $officeLocation->longitude,
            $latitude,
            $longitude
        );

        $allowedRadius = (int) ($officeLocation->allowed_radius ?? 100);
        $distanceRounded = round($distance, 2);

        // --- Step 5: Compare against allowed radius ---
        if ($distance <= $allowedRadius) {
            return [
                'allowed' => true,
                'distance' => $distanceRounded,
                'message' => "You are {$distanceRounded}m from the office (within {$allowedRadius}m radius).",
            ];
        }

        $excessMeters = round($distance - $allowedRadius);
        return [
            'allowed' => false,
            'distance' => $distanceRounded,
            'message' => "You are {$distanceRounded}m from the office. You must be within {$allowedRadius}m to mark attendance. Please move {$excessMeters}m closer.",
        ];
    }
}
