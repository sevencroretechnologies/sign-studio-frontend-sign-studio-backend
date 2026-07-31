<?php

namespace App\Services\Attendance;

use App\Models\ShiftAssignment;
use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;
use App\Models\CompanyHoliday;
use App\Services\Core\BaseService;
use App\Services\Leave\LeaveService;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Attendance Service
 *
 * Handles all business logic for attendance/work log management.
 */
class AttendanceService extends BaseService
{
    protected string $modelClass = WorkLog::class;

    protected array $defaultRelations = [
        'staffMember.division',
        'staffMember.jobTitle',
        // 'shift',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'office_location_id' => 'office_location_id',
    ];

    protected ShiftService $shiftService;
    protected LeaveService $leaveService;
    protected GeofenceService $geofenceService;

    public function __construct(
        ShiftService $shiftService,
        LeaveService $leaveService,
        GeofenceService $geofenceService
    ) {
        // parent::__construct();
        $this->shiftService     = $shiftService;
        $this->leaveService     = $leaveService;
        $this->geofenceService  = $geofenceService;

        // Initialize any parent properties that need to be set
        $this->perPage = config('app.per_page', 15);
    }

    /**
     * Get attendance records with filters.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $this->syncApprovedLeaves($params['staff_member_id'] ?? null);
        $this->syncCompanyHolidays($params['staff_member_id'] ?? null);

        $query = $this->query()->with($this->defaultRelations);
        $timezone = config('app.timezone', 'UTC');

        // Apply filters
        if (!empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        if (!empty($params['office_location_id'])) {
            $query->whereHas('staffMember', function ($q) use ($params) {
                $q->where('office_location_id', $params['office_location_id']);
            });
        }

        if (!empty($params['exclude_self'])) {
            $user = auth()->user();
            if ($user) {
                $query->whereHas('staffMember', function ($q) use ($user) {
                    $q->where(function ($q2) use ($user) {
                        $q2->whereNull('user_id')
                            ->orWhere('user_id', '!=', $user->id);
                    });
                });
            }
        }

        // Date filter
        if (!empty($params['date'])) {
            $query->whereDate('log_date', $params['date']);
        }

        // Date range filter
        if (!empty($params['start_date'])) {
            $query->whereDate('log_date', '>=', $params['start_date']);
        }
        if (!empty($params['end_date'])) {
            $query->whereDate('log_date', '<=', $params['end_date']);
        }

        // Month/Year filter
        if (!empty($params['month']) && !empty($params['year'])) {
            $query->whereMonth('log_date', $params['month'])
                ->whereYear('log_date', $params['year']);
        }

        // Apply ordering
        $orderBy = $params['order_by'] ?? 'log_date';
        $order = $params['order'] ?? 'desc';
        $query->orderBy($orderBy, $order);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = isset($params['per_page']) ? (int)$params['per_page'] : $this->perPage;

        $result = $paginate
            ? $query->paginate($perPage)
            : $query->get();

        // Transform the result with shift information
        $transformFunc = function ($workLog) use ($timezone) {
            // Format log_date with proper timezone
            $workLog->log_date_formatted = Carbon::parse($workLog->log_date, $timezone)
                ->format('D, M d, Y');

            // Format clock_in - Use local time instead of UTC
            if ($workLog->clock_in) {
                $workLog->clock_in_time = $workLog->clock_in;
                // Create full datetime with timezone for proper display
                $clockInDateTime = Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $workLog->log_date->format('Y-m-d') . ' ' . $workLog->clock_in,
                    $timezone
                );
                // Send local time in ISO format without 'Z' (which indicates UTC)
                $workLog->clock_in = $clockInDateTime->format('Y-m-d\TH:i:s');
                // Also format just the time part for easy display
                $workLog->clock_in_display = $clockInDateTime->format('H:i');
            }

            // Format clock_out - Use local time instead of UTC
            if ($workLog->clock_out) {
                $workLog->clock_out_time = $workLog->clock_out;
                // Create full datetime with timezone for proper display
                $clockOutDateTime = Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $workLog->log_date->format('Y-m-d') . ' ' . $workLog->clock_out,
                    $timezone
                );
                // Send local time in ISO format without 'Z' (which indicates UTC)
                $workLog->clock_out = $clockOutDateTime->format('Y-m-d\TH:i:s');
                // Also format just the time part for easy display
                $workLog->clock_out_display = $clockOutDateTime->format('H:i');
            }

            // Load shift information for this work log
            $this->loadShiftInfo($workLog);

            return $workLog;
        };

        if ($paginate) {
            $result->getCollection()->transform($transformFunc);
        } else {
            $result->transform($transformFunc);
        }

        return $result;
    }

    /**
     * Load shift information for a work log
     */
    private function loadShiftInfo(WorkLog $workLog): void
    {
        try {
            // Get shift assignment for the log date
            $shiftAssignment = ShiftAssignment::where('staff_member_id', $workLog->staff_member_id)
                ->whereDate('effective_from', '<=', $workLog->log_date)
                ->where(function ($query) use ($workLog) {
                    $query->whereNull('effective_to')
                        ->orWhereDate('effective_to', '>=', $workLog->log_date);
                })
                ->with('shift')
                ->first();

            if ($shiftAssignment && $shiftAssignment->shift) {
                $shift = $shiftAssignment->shift;

                // Create shift object with required fields
                $workLog->shift = (object)[
                    'id' => $shift->id,
                    'name' => $shift->name,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'break_duration_minutes' => $shift->break_duration_minutes,
                    'color' => $shift->color,
                    'is_night_shift' => $shift->is_night_shift,
                    'overtime_after_hours' => $shift->overtime_after_hours,
                    'formatted_start_time' => Carbon::parse($shift->start_time)->format('H:i'),
                    'formatted_end_time' => Carbon::parse($shift->end_time)->format('H:i'),
                ];
            } else {
                $workLog->shift = null;
            }
        } catch (\Exception $e) {
            Log::error('Error loading shift info for work log', [
                'work_log_id' => $workLog->id,
                'error' => $e->getMessage()
            ]);
            $workLog->shift = null;
        }
    }

    /**
     * Clock in for an employee.
     *
     * @param  int    $staffMemberId
     * @param  array  $data  May contain:
     *   - ip_address  string
     *   - latitude    float|null
     *   - longitude   float|null
     *   - accuracy    float|null  (GPS accuracy in meters)
     *   - author_id   int|null
     *   - geofence_required bool  (true = validate GPS, false = skip, default false)
     */
    public function clockIn(int $staffMemberId, array $data = []): array
    {
        // --- Geofence validation ---
        $distanceFromOffice = null;
        if (!empty($data['geofence_required'])) {
            $latitude  = isset($data['latitude'])  ? (float) $data['latitude']  : null;
            $longitude = isset($data['longitude']) ? (float) $data['longitude'] : null;
            $accuracy  = isset($data['accuracy'])  ? (float) $data['accuracy']  : null;

            if ($latitude === null || $longitude === null) {
                throw new \Exception('GPS location is required. Please enable location services and try again.');
            }

            $geofenceResult = $this->geofenceService->validateLocation(
                $staffMemberId,
                $latitude,
                $longitude,
                $accuracy
            );

            $bypassGeofence = auth()->check() && auth()->user()->hasPermissionTo('bypass_geofence');

            if (!$geofenceResult['allowed'] && !$bypassGeofence) {
                throw new \Exception($geofenceResult['message']);
            }

            $distanceFromOffice = $geofenceResult['distance'];
        }

        // Set the timezone for this operation
        $timezone = config('app.timezone', 'UTC');
        $today = Carbon::now($timezone)->toDateString();
        $currentTime = Carbon::now($timezone);

        // Check if already clocked in today
        $existing = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        if ($existing && $existing->clock_in && !$existing->clock_out) {
            throw new \Exception('Already clocked in for today');
        }

        // Get employee's shift for today
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, $today);

        $lateMinutes = 0;
        $status = 'in'; // Status is 'in' upon clock-in, late_minutes tracks lateness

        if ($existing && $existing->status === 'holiday') {
            $status = 'holiday'; // Keep as holiday so overtime_holiday applies
        }

        if ($shift) {
            // Calculate if late based on shift
            $appTimezone = config('app.timezone') === 'UTC' ? 'Asia/Kolkata' : config('app.timezone');

            // Current time in the target timezone
            $currentTimeInAppZone = Carbon::now($appTimezone);

            // Shift Start in the target timezone
            $shiftStart = Carbon::parse($today . ' ' . $shift->start_time, $appTimezone);

            $isLate = $currentTimeInAppZone->gt($shiftStart);

            if ($isLate) {
                // Calculate how many minutes after shift start
                $lateMinutes = $shiftStart->diffInMinutes($currentTimeInAppZone);
            }
        }

        $clockInImagePath = null;
        if (!empty($data['image'])) {
            $clockInImagePath = $this->processAttendanceImage($data['image'], 'checkin', $staffMemberId);
        }

        // If a record already exists (e.g. absent record or already clocked out), update it
        if ($existing) {
            $existing->update([
                'clock_in'                      => $currentTime->format('H:i:s'),
                'clock_in_ip'                   => $data['ip_address'] ?? null,
                'clock_in_latitude'             => $data['latitude'] ?? null,
                'clock_in_longitude'            => $data['longitude'] ?? null,
                'clock_in_accuracy'             => $data['accuracy'] ?? null,
                'clock_in_distance_from_office' => $distanceFromOffice,
                'clock_in_image'                => $clockInImagePath,
                'late_minutes'                  => $lateMinutes,
                'status'                        => $status,
                'clock_out'                     => null,
                'clock_out_ip'                  => null,
                'clock_out_latitude'            => null,
                'clock_out_longitude'           => null,
                'clock_out_accuracy'            => null,
                'clock_out_distance_from_office' => null,
                'early_leave_minutes'           => 0,
                'overtime_minutes'              => 0,
                'total_hours'                   => 0,
                'author_id'                     => $data['author_id'] ?? null,
            ]);

            $workLog = $existing;
        } else {
            // Create new work log
            $workLog = WorkLog::create([
                'staff_member_id'               => $staffMemberId,
                'log_date'                      => $today,
                'clock_in'                      => $currentTime->format('H:i:s'),
                'clock_in_ip'                   => $data['ip_address'] ?? null,
                'clock_in_latitude'             => $data['latitude'] ?? null,
                'clock_in_longitude'            => $data['longitude'] ?? null,
                'clock_in_accuracy'             => $data['accuracy'] ?? null,
                'clock_in_distance_from_office' => $distanceFromOffice,
                'clock_in_image'                => $clockInImagePath,
                'late_minutes'                  => $lateMinutes,
                'status'                        => $status,
                'author_id'                     => $data['author_id'] ?? null,
            ]);
        }

        return $this->getCurrentStatus($staffMemberId);
    }

    /**
     * Clock out for an employee.
     *
     * @param  int    $staffMemberId
     * @param  array  $data  May contain:
     *   - ip_address  string
     *   - latitude    float|null
     *   - longitude   float|null
     *   - accuracy    float|null
     *   - geofence_required bool
     */
    public function clockOut(int $staffMemberId, array $data = []): array
    {
        // --- Geofence validation ---
        $distanceFromOffice = null;
        if (!empty($data['geofence_required'])) {
            $latitude  = isset($data['latitude'])  ? (float) $data['latitude']  : null;
            $longitude = isset($data['longitude']) ? (float) $data['longitude'] : null;
            $accuracy  = isset($data['accuracy'])  ? (float) $data['accuracy']  : null;

            if ($latitude === null || $longitude === null) {
                throw new \Exception('GPS location is required. Please enable location services and try again.');
            }

            $geofenceResult = $this->geofenceService->validateLocation(
                $staffMemberId,
                $latitude,
                $longitude,
                $accuracy
            );

            $bypassGeofence = auth()->check() && auth()->user()->hasPermissionTo('bypass_geofence');

            if (!$geofenceResult['allowed'] && !$bypassGeofence) {
                throw new \Exception($geofenceResult['message']);
            }

            $distanceFromOffice = $geofenceResult['distance'];
        }

        $timezone = config('app.timezone', 'UTC');
        $today = Carbon::now($timezone)->toDateString();
        $currentTime = Carbon::now($timezone);

        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->first();

        // Fallback to active open night shift from previous day if ongoing
        if (!$workLog) {
            $yesterday = Carbon::now($timezone)->subDay()->toDateString();
            $yesterdayLog = WorkLog::where('staff_member_id', $staffMemberId)
                ->whereDate('log_date', $yesterday)
                ->whereNotNull('clock_in')
                ->whereNull('clock_out')
                ->first();

            if ($yesterdayLog) {
                $shift = $this->shiftService->getEmployeeShift($staffMemberId, $yesterday);
                if ($shift && $shift->is_night_shift) {
                    $workLog = $yesterdayLog;
                }
            }
        }

        if (!$workLog) {
            throw new \Exception('No active clock-in found for today');
        }

        // FIX: Use proper method to combine date and time
        $clockInDateTime = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $workLog->log_date->format('Y-m-d') . ' ' . $workLog->clock_in,
            $timezone
        );

        $clockOut = $currentTime;

        $totalMinutes = $clockInDateTime->diffInMinutes($clockOut);
        $totalHours = round($totalMinutes / 60, 2);

        $earlyLeaveMinutes = 0;
        $overtimeMinutes = 0;

        // Get shift for calculation
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, $today);

        if ($shift) {
            // Use specific timezone logic
            $appTimezone = config('app.timezone') === 'UTC' ? 'Asia/Kolkata' : config('app.timezone');
            $currentTimeInAppZone = Carbon::now($appTimezone);
            $clockOutInAppZone = $currentTimeInAppZone; // Since clocking out now

            // Parse shift time with today's date for proper comparison
            $shiftEnd = Carbon::createFromFormat('Y-m-d H:i:s', $today . ' ' . $shift->end_time, $appTimezone);

            // Calculate early leave
            if ($clockOutInAppZone->lt($shiftEnd)) {
                $earlyLeaveMinutes = $clockOutInAppZone->diffInMinutes($shiftEnd);
            }

            // Calculate overtime (after shift end)
            if ($clockOutInAppZone->gt($shiftEnd)) {
                $overtimeMinutes = $clockOutInAppZone->diffInMinutes($shiftEnd);

                // If shift has overtime threshold, adjust
                if ($shift->overtime_after_hours > 0) {
                    $regularHours = $shift->overtime_after_hours * 60; // Convert to minutes
                    $actualWorkMinutes = $totalMinutes - ($workLog->break_minutes ?? 0);

                    if ($actualWorkMinutes > $regularHours) {
                        $overtimeMinutes = $actualWorkMinutes - $regularHours;
                    } else {
                        $overtimeMinutes = 0;
                    }
                }
            }
        }

        // If they worked on a holiday, all time is considered overtime
        if ($workLog->status === 'holiday') {
            $actualWorkMinutes = $totalMinutes - ($workLog->break_minutes ?? 0);
            $overtimeMinutes = $actualWorkMinutes > 0 ? $actualWorkMinutes : 0;
            $earlyLeaveMinutes = 0; // No early leave on holidays
        }

        $clockOutImagePath = null;
        if (!empty($data['image'])) {
            $clockOutImagePath = $this->processAttendanceImage($data['image'], 'checkout', $staffMemberId);
        }

        $workLog->update([
            'status'                         => 'present',
            'clock_out'                      => $clockOut->format('H:i:s'),
            'clock_out_ip'                   => $data['ip_address'] ?? null,
            'clock_out_latitude'             => $data['latitude'] ?? null,
            'clock_out_longitude'            => $data['longitude'] ?? null,
            'clock_out_accuracy'             => $data['accuracy'] ?? null,
            'clock_out_distance_from_office' => $distanceFromOffice,
            'clock_out_image'                => $clockOutImagePath,
            'early_leave_minutes'            => $earlyLeaveMinutes,
            'overtime_minutes'               => $overtimeMinutes,
            'total_hours'                    => $totalHours,
            'author_id'                      => $data['author_id'] ?? null,
        ]);

        return $this->getCurrentStatus($staffMemberId);
    }

    /**
     * Get current status with comprehensive info.
     */
    public function getCurrentStatus(int $staffMemberId): array
    {
        $timezone = config('app.timezone', 'UTC');
        $today = Carbon::now($timezone)->toDateString();

        // Check if on leave
        $isOnLeave = $this->isOnLeave($staffMemberId, $today);

        if ($isOnLeave) {
            return [
                'status' => 'on_leave',
                'clock_in' => null,
                'clock_out' => null,
                'total_hours' => null,
                'late_minutes' => 0,
                'on_leave' => true,
                'leave_details' => $isOnLeave,
            ];
        }

        // Try to get today's work log first
        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        // If no work log for today, check for an active night shift from yesterday that is still within active shift hours
        if (!$workLog) {
            $yesterday = Carbon::now($timezone)->subDay()->toDateString();
            $yesterdayLog = WorkLog::where('staff_member_id', $staffMemberId)
                ->whereDate('log_date', $yesterday)
                ->whereNotNull('clock_in')
                ->whereNull('clock_out')
                ->first();

            if ($yesterdayLog) {
                $shift = $this->shiftService->getEmployeeShift($staffMemberId, $yesterday);
                if ($shift && $shift->is_night_shift) {
                    $shiftEndDT = Carbon::createFromFormat(
                        'Y-m-d H:i:s',
                        $today . ' ' . $shift->end_time,
                        $timezone
                    );
                    if (Carbon::now($timezone)->lt($shiftEndDT->addHours(2))) {
                        $workLog = $yesterdayLog;
                    }
                }
            }
        }

        // Get shift information
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, $today);
        $shiftInfo = $shift ? [
            'id' => $shift->id,
            'name' => $shift->name,
            'start_time' => $shift->start_time,
            'end_time' => $shift->end_time,
            'is_night_shift' => $shift->is_night_shift,
        ] : null;

        if (!$workLog) {
            return [
                'status' => 'not_clocked_in',
                'clock_in' => null,
                'clock_out' => null,
                'total_hours' => null,
                'late_minutes' => 0,
                'early_leave_minutes' => 0,
                'overtime_minutes' => 0,
                'break_minutes' => 0,
                'shift' => $shiftInfo,
                'current_time' => Carbon::now($timezone)->format('H:i:s'),
            ];
        }

        // IMPORTANT: Use timezone for log_date formatting
        // Convert log_date to Carbon with correct timezone
        $logDate = Carbon::parse($workLog->log_date)->setTimezone($timezone);

        // Extract only the DATE part (without time) using the correct timezone
        $clockInDateTime = $workLog->clock_in
            ? ($logDate->format('Y-m-d') . ' ' . $workLog->clock_in)
            : null;

        $clockOutDateTime = $workLog->clock_out
            ? ($logDate->format('Y-m-d') . ' ' . $workLog->clock_out)
            : null;

        // Determine correct status based on clock_in and clock_out
        if ($workLog->clock_in && !$workLog->clock_out) {
            $status = 'clocked_in';
        } elseif ($workLog->clock_in && $workLog->clock_out) {
            $status = 'clocked_out';
        } else {
            if ($workLog->status === 'holiday') {
                $status = 'holiday';
            } else {
                $status = 'not_clocked_in';
            }
        }

        return [
            'status' => $status,
            'notes' => $workLog->notes,
            'clock_in' => $workLog->clock_in_full, // Use accessor
            'clock_out' => $workLog->clock_out_full, // Use accessor
            'clock_in_time' => $workLog->clock_in,
            'clock_out_time' => $workLog->clock_out,
            'total_hours' => $workLog->total_hours,
            'late_minutes' => $workLog->late_minutes ?? 0,
            'early_leave_minutes' => $workLog->early_leave_minutes ?? 0,
            'overtime_minutes' => $workLog->overtime_minutes ?? 0,
            'break_minutes' => $workLog->break_minutes ?? 0,
            'shift' => $shiftInfo,
            'current_time' => Carbon::now($timezone)->format('H:i:s'),
            'server_timezone' => $timezone,
            'log_date_formatted' => $logDate->format('Y-m-d'), // For debugging
        ];
    }

    /**
     * Manual attendance entry with shift calculations.
     */
    public function recordAttendance(array $data): WorkLog
    {
        return DB::transaction(function () use ($data) {
            $logDate = $data['log_date'] ?? now()->toDateString();
            $staffMemberId = $data['staff_member_id'];

            if ($logDate > now()->toDateString()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'log_date' => ['Cannot record attendance for future dates.']
                ]);
            }

            // Check for existing record
            $existing = WorkLog::where('staff_member_id', $staffMemberId)
                ->whereDate('log_date', $logDate)
                ->first();

            // Auto-fill from shift if status is present and times not explicitly provided
            if (!array_key_exists('clock_in', $data) && isset($data['status']) && $data['status'] === 'present') {
                if (!$existing || (!$existing->clock_in && !$existing->clock_out)) {
                    $shift = $this->shiftService->getEmployeeShift($staffMemberId, $logDate);
                    if ($shift) {
                        $data['clock_in'] = $shift->start_time;
                        $data['clock_out'] = $shift->end_time;
                    }
                }
            }

            // Auto-calculate if clock_in and clock_out provided
            if (isset($data['clock_in']) && isset($data['clock_out'])) {
                $clockIn = Carbon::parse($data['clock_in']);
                $clockOut = Carbon::parse($data['clock_out']);

                if ($clockOut->lt($clockIn)) {
                    // Handle overnight shift (for night shifts)
                    $clockOut->addDay();
                }

                $totalMinutes = $clockIn->diffInMinutes($clockOut);
                $data['total_hours'] = round($totalMinutes / 60, 2);

                // Get shift for calculations
                $shift = $this->shiftService->getEmployeeShift($staffMemberId, $logDate);

                if ($shift) {
                    $shiftStart = Carbon::parse($shift->start_time);
                    $shiftEnd = Carbon::parse($shift->end_time);

                    // Handle night shifts crossing midnight
                    if ($shift->is_night_shift && $shiftEnd->lt($shiftStart)) {
                        $shiftEnd->addDay();
                    }

                    // Late minutes
                    if ($clockIn->gt($shiftStart)) {
                        $data['late_minutes'] = $clockIn->diffInMinutes($shiftStart);
                    }

                    // Early leave minutes
                    if ($clockOut->lt($shiftEnd)) {
                        $data['early_leave_minutes'] = $clockOut->diffInMinutes($shiftEnd);
                    }

                    // Overtime minutes
                    if ($clockOut->gt($shiftEnd)) {
                        $data['overtime_minutes'] = $clockOut->diffInMinutes($shiftEnd);
                    }
                }
                
                // If clock out is provided, and status is a temporary state, finalize to present
                $currentStatus = $data['status'] ?? ($existing->status ?? 'present');
                if (in_array($currentStatus, ['in', 'not_punched_out'])) {
                    $data['status'] = 'present';
                }
            } elseif (isset($data['clock_in']) && empty($data['clock_out'])) {
                // If only clock in is provided, and status was present (from frontend), downgrade to 'in'
                $currentStatus = $data['status'] ?? ($existing->status ?? 'present');
                if ($currentStatus === 'present') {
                    $data['status'] = 'in';
                }
            }

            if ($existing) {
                $existing->update($data);
                return $existing->fresh($this->defaultRelations);
            }

            return WorkLog::create($data);
        });
    }

    /**
     * Bulk record attendance for multiple employees.
     */
    public function bulkRecordAttendance(array $records): Collection
    {
        return DB::transaction(function () use ($records) {
            $created = collect();

            foreach ($records as $record) {
                $created->push($this->recordAttendance($record));
            }

            return $created;
        });
    }

    /**
     * Get today's attendance summary.
     */
    public function getTodaySummary(): array
    {
        $today = now()->toDateString();
        $totalEmployees = StaffMember::active()->count();

        $present = WorkLog::whereDate('log_date', $today)->count();
        $absent = $totalEmployees - $present;
        $late = WorkLog::whereDate('log_date', $today)
            ->where('status', 'late')
            ->count();
        $halfDay = WorkLog::whereDate('log_date', $today)
            ->where('status', 'half_day')
            ->count();

        return [
            'date' => $today,
            'total_employees' => $totalEmployees,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'half_day' => $halfDay,
            'not_marked' => $absent,
            'attendance_percentage' => $totalEmployees > 0
                ? round(($present / $totalEmployees) * 100, 1)
                : 0,
        ];
    }

    /**
     * Get attendance summary for a date range.
     */
    public function getSummaryForDateRange(string $startDate, string $endDate, ?int $staffMemberId = null, bool $excludeSelf = false): array
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        // Get all work logs for the date range
        $query = WorkLog::whereBetween('log_date', [$startDate, $endDate]);

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        if ($excludeSelf) {
            $user = auth()->user();
            if ($user) {
                $query->whereHas('staffMember', function ($q) use ($user) {
                    $q->where(function ($q2) use ($user) {
                        $q2->whereNull('user_id')
                          ->orWhere('user_id', '!=', $user->id);
                    });
                });
            }
        }

        $records = $query->get();

        // Count different statuses
        $presentCount = $records->where('status', 'present')->count();
        $absentCount = $records->where('status', 'absent')->count();
        $lateCount = $records->where('late_minutes', '>', 0)->count(); // Count based on late_minutes > 0
        $halfDayCount = $records->where('status', 'half_day')->count();
        $onLeaveCount = $records->where('status', 'on_leave')->count();

        // Calculate total days in range
        $totalDays = $start->diffInDays($end) + 1;

        if ($staffMemberId) {
            $workingDaysConfig = $this->getWorkingDaysConfig($staffMemberId, $start, $end);
        } else {
            $workingDaysConfig = $this->getDefaultWorkingDaysConfig($start, $end);
        }
        $workingDays = $workingDaysConfig['total_working_days'];
        $workingDates = $workingDaysConfig['working_dates'];

        // Calculate absent days (working days without any attendance record)
        $datesWithAttendance = $records->pluck('log_date')->map(function ($date) {
            return Carbon::parse($date)->format('Y-m-d');
        })->unique()->toArray();

        // Find working dates without attendance
        $absentDates = [];
        foreach ($workingDates as $workingDate) {
            if (!in_array($workingDate, $datesWithAttendance)) {
                $absentDates[] = $workingDate;
            }
        }

        $calculatedAbsentDays = count($absentDates);

        // If staff member is specified, check for leaves on absent days
        if ($staffMemberId) {
            $leaveDates = $this->getLeaveDatesForStaff($staffMemberId, $startDate, $endDate);

            // Remove leave days from absent days
            $actualAbsentDays = 0;
            $finalAbsentDates = [];
            foreach ($absentDates as $date) {
                if (!in_array($date, $leaveDates)) {
                    $actualAbsentDays++;
                    $finalAbsentDates[] = $date;
                }
            }
            $calculatedAbsentDays = $actualAbsentDays;
            $absentDates = $finalAbsentDates;

            // Add leave days count
            $onLeaveCount = count(array_intersect($workingDates, $leaveDates));
        }

        // Calculate total working hours (excluding break time)
        $totalHours = $records->sum('total_hours');

        // Calculate average hours per day for days with attendance
        $daysWithAttendanceCount = $records->count();
        $averageHoursPerDay = $daysWithAttendanceCount > 0
            ? round($totalHours / $daysWithAttendanceCount, 2)
            : 0;

        // Calculate overall average (including absent days as 0 hours)
        $overallAverageHoursPerDay = $workingDays > 0
            ? round($totalHours / $workingDays, 2)
            : 0;

        // Calculate attendance percentage based on working days
        $attendancePercentage = $workingDays > 0
            ? round((($presentCount + $halfDayCount) / $workingDays) * 100, 2)
            : 0;

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => $totalDays,
            'working_days' => $workingDays,
            'present_days' => $presentCount,
            'absent_days' => $calculatedAbsentDays,
            'late_days' => $lateCount,
            'half_days' => $halfDayCount,
            'leave_days' => $onLeaveCount,
            'total_hours' => $totalHours,
            'average_hours_per_day' => $averageHoursPerDay,
            'overall_average_hours_per_day' => $overallAverageHoursPerDay,
            'attendance_percentage' => $attendancePercentage,
            'absent_dates' => $absentDates, // For debugging/display
            'dates_with_attendance' => $datesWithAttendance, // For debugging
            'working_dates' => $workingDates, // For debugging
        ];
    }

    /**
     * Get leave dates for a staff member within a date range
     */
    private function getLeaveDatesForStaff(int $staffMemberId, string $startDate, string $endDate): array
    {
        $leaves = TimeOffRequest::where('staff_member_id', $staffMemberId)
            ->where('approval_status', 'approved')
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                    });
            })
            ->get();

        $leaveDates = [];

        foreach ($leaves as $leave) {
            $current = Carbon::parse(max($leave->start_date, $startDate));
            $last = Carbon::parse(min($leave->end_date, $endDate));

            while ($current <= $last) {
                // Only count working days as leave days
                if (!$current->isWeekend()) {
                    $leaveDates[] = $current->format('Y-m-d');
                }
                $current->addDay();
            }
        }

        return array_unique($leaveDates);
    }

    /**
     * Check if a leave request is Paid Leave or Sick Leave (returns true), otherwise Unpaid Leave (returns false).
     */
    public static function isPaidLeaveRequest($leave): bool
    {
        $cat = $leave->category ?? null;
        if (!$cat) {
            return false;
        }
        $title = strtolower($cat->title ?? $cat->name ?? '');

        // If title contains 'unpaid' -> Unpaid Leave
        if (str_contains($title, 'unpaid')) {
            return false;
        }

        // If title contains 'sick' or 'paid', or is_paid is true -> Paid Leave
        if (str_contains($title, 'sick') || str_contains($title, 'paid') || ($cat->is_paid ?? false) == true) {
            return true;
        }

        return false;
    }

    /**
     * Sync approved leaves for staff to WorkLog table.
     */
    public function syncApprovedLeaves(?int $staffMemberId = null): void
    {
        try {
            $query = TimeOffRequest::with('category')->where('approval_status', 'approved');
            if ($staffMemberId) {
                $query->where('staff_member_id', $staffMemberId);
            }
            $approvedLeaves = $query->get();

            foreach ($approvedLeaves as $leave) {
                $start = Carbon::parse($leave->start_date);
                $end = Carbon::parse($leave->end_date);
                $current = $start->copy();

                $isPaid = self::isPaidLeaveRequest($leave);
                $leaveLabel = $isPaid ? 'Approved Paid Leave' : 'Approved Unpaid Leave';
                $noteText = $leaveLabel . ($leave->reason ? ": {$leave->reason}" : '');

                while ($current <= $end) {
                    $dateStr = $current->toDateString();
                    $log = WorkLog::where('staff_member_id', $leave->staff_member_id)
                        ->whereDate('log_date', $dateStr)
                        ->first();

                    if (!$log) {
                        WorkLog::create([
                            'staff_member_id' => $leave->staff_member_id,
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
        } catch (\Exception $e) {
            Log::error('Error syncing approved leaves to work logs', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get monthly attendance with shift and leave integration.
     */
    public function getEmployeeMonthlyAttendance(int $staffMemberId, int $month, int $year): array
    {
        $staff = StaffMember::findOrFail($staffMemberId);
        $doj = $staff->date_of_joining ? Carbon::parse($staff->date_of_joining)->startOfDay() : null;
        $requestedMonth = Carbon::create($year, $month, 1)->startOfMonth();

        if ($doj && $requestedMonth->lt($doj->copy()->startOfMonth())) {
            return [
                'month' => $month,
                'year' => $year,
                'shift' => null,
                'working_days' => 0,
                'present_days' => 0,
                'absent_days' => 0,
                'paid_leave_days' => 0,
                'unpaid_leave_days' => 0,
                'leave_days' => 0,
                'late_days' => 0,
                'total_hours' => 0,
                'total_late_minutes' => 0,
                'total_overtime_minutes' => 0,
                'total_early_leave_minutes' => 0,
                'total_break_minutes' => 0,
                'records' => [],
                'leaves' => [],
                'message' => 'Employee had not joined the company during this period.',
                'date_of_joining' => $doj->format('Y-m-d')
            ];
        }

        $this->syncApprovedLeaves($staffMemberId);
        $this->syncCompanyHolidays($staffMemberId, $month, $year);

        $records = WorkLog::with(['staffMember', 'author'])
            ->where('staff_member_id', $staffMemberId)
            ->whereMonth('log_date', $month)
            ->whereYear('log_date', $year)
            ->orderBy('log_date')
            ->get();

        // Get shift for the month
        $shift = $this->shiftService->getEmployeeShift($staffMemberId, Carbon::create($year, $month, 15));

        $startOfMonth = $requestedMonth->copy();
        if ($doj && $requestedMonth->isSameMonth($doj)) {
            $startOfMonth = $doj->copy();
        }
        $endOfMonth = $requestedMonth->copy()->endOfMonth();
        
        $workingDaysConfig = $this->getWorkingDaysConfig($staffMemberId, $startOfMonth, $endOfMonth);
        $workingDays = $workingDaysConfig['total_working_days'];
        $workingDates = $workingDaysConfig['working_dates'];

        // Get leaves for this month
        $leaves = TimeOffRequest::with('category')->where('staff_member_id', $staffMemberId)
            ->where('approval_status', 'approved')
            ->whereMonth('start_date', $month)
            ->whereYear('start_date', $year)
            ->get();

        $paidLeaveDays = 0;
        $unpaidLeaveDays = 0;
        foreach ($leaves as $leave) {
            $isPaid = self::isPaidLeaveRequest($leave);
            $leaveStart = Carbon::parse($leave->start_date);
            $leaveEnd = Carbon::parse($leave->end_date);

            // Count only working days in the leave period within this month
            $current = max($leaveStart, $startOfMonth);
            $last = min($leaveEnd, $endOfMonth);

            while ($current <= $last) {
                if (in_array($current->format('Y-m-d'), $workingDates)) {
                    if ($isPaid) {
                        $paidLeaveDays++;
                    } else {
                        $unpaidLeaveDays++;
                    }
                }
                $current->addDay();
            }
        }
        $leaveDays = $paidLeaveDays + $unpaidLeaveDays;

        // Calculate totals
        $totalLateMinutes = $records->sum('late_minutes');
        $totalOvertimeMinutes = $records->sum('overtime_minutes');
        $totalEarlyLeaveMinutes = $records->sum('early_leave_minutes');
        $totalBreakMinutes = $records->sum('break_minutes');

        return [
            'month' => $month,
            'year' => $year,
            'shift' => $shift,
            'working_days' => $workingDays,
            'present_days' => $records->whereIn('status', ['present', 'late'])->count(),
            'absent_days' => $records->where('status', 'absent')->count(),
            'paid_leave_days' => $paidLeaveDays,
            'unpaid_leave_days' => $unpaidLeaveDays,
            'leave_days' => $leaveDays,
            'late_days' => $records->where('late_minutes', '>', 0)->count(),
            'total_hours' => $records->sum('total_hours'),
            'total_late_minutes' => $totalLateMinutes,
            'total_overtime_minutes' => $totalOvertimeMinutes,
            'total_early_leave_minutes' => $totalEarlyLeaveMinutes,
            'total_break_minutes' => $totalBreakMinutes,
            'records' => $records,
            'leaves' => $leaves,
            'date_of_joining' => $doj ? $doj->format('Y-m-d') : null,
        ];
    }


    /**
     * Get attendance report for all employees.
     */
    public function getAttendanceReport(array $params = []): Collection
    {
        $startDate = $params['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? now()->endOfMonth()->toDateString();

        $employees = StaffMember::active()
            ->with(['officeLocation', 'division', 'jobTitle'])
            ->get();

        return $employees->map(function ($employee) use ($startDate, $endDate) {
            $summary = $this->getSummaryForDateRange($startDate, $endDate, $employee->id);

            return [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'staff_code' => $employee->staff_code,
                    'department' => $employee->division?->title,
                ],
                'attendance' => $summary,
            ];
        });
    }

    /**
     * Check if employee has clocked in today.
     */
    public function hasClockedInToday(int $staffMemberId): bool
    {
        return WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', now()->toDateString())
            ->exists();
    }

    /**
     * Check if employee is on leave for a specific date.
     */
    private function isOnLeave(int $staffMemberId, string $date): mixed
    {
        return TimeOffRequest::where('staff_member_id', $staffMemberId)
            ->where('approval_status', 'approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->with('category')
            ->first();
    }

    /**
     * Sync company holidays to WorkLog table.
     */
    public function syncCompanyHolidays(?int $staffMemberId = null, ?int $month = null, ?int $year = null): void
    {
        try {
            $query = CompanyHoliday::query();
            
            if ($month && $year) {
                $query->whereMonth('holiday_date', $month)
                      ->whereYear('holiday_date', $year);
            } else {
                // Default to current year if no specific month/year provided to limit scope
                $query->whereYear('holiday_date', now()->year);
            }
            
            $holidays = $query->get();
            if ($holidays->isEmpty()) {
                return;
            }

            // Get staff members to sync for
            $staffQuery = StaffMember::active();
            if ($staffMemberId) {
                $staffQuery->where('id', $staffMemberId);
            }
            $staffMembers = $staffQuery->get(['id', 'date_of_joining']);

            foreach ($holidays as $holiday) {
                $holidayDateObj = Carbon::parse($holiday->holiday_date)->startOfDay();
                $dateStr = $holidayDateObj->toDateString();
                $noteText = "Holiday: " . $holiday->title;

                foreach ($staffMembers as $staff) {
                    $doj = $staff->date_of_joining ? Carbon::parse($staff->date_of_joining)->startOfDay() : null;
                    if ($doj && $holidayDateObj->lt($doj)) {
                        continue;
                    }

                    $staffId = $staff->id;
                    $log = WorkLog::where('staff_member_id', $staffId)
                        ->whereDate('log_date', $dateStr)
                        ->first();

                    if (!$log) {
                        WorkLog::create([
                            'staff_member_id' => $staffId,
                            'log_date' => $dateStr,
                            'status' => 'holiday',
                            'notes' => $noteText,
                        ]);
                    } elseif (!in_array($log->status, ['on_leave', 'paid_leave'])) {
                        // If absent, present, late, or not marked, update to holiday
                        $updateData = [
                            'status' => 'holiday',
                            'notes' => $noteText,
                        ];

                        // If they already worked, all hours count as overtime on a holiday
                        if ($log->total_hours > 0) {
                            $updateData['overtime_minutes'] = $log->total_hours * 60;
                            $updateData['late_minutes'] = 0;
                            $updateData['early_leave_minutes'] = 0;
                        }

                        $log->update($updateData);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error syncing company holidays to work logs', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Sync attendance with approved leaves (for daily cron).
     */
    public function syncWithApprovedLeaves(): void
    {
        $today = now()->toDateString();
        
        $this->syncCompanyHolidays();

        $leaves = TimeOffRequest::where('approval_status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->get();

        foreach ($leaves as $leave) {
            WorkLog::updateOrCreate(
                [
                    'staff_member_id' => $leave->staff_member_id,
                    'log_date' => $today,
                ],
                [
                    'status' => 'on_leave',
                    'notes' => "On approved leave: {$leave->category?->title} - {$leave->reason}",
                    'author_id' => $leave->approved_by,
                ]
            );
        }
    }

    /**
     * Get Working Days Configuration for an employee and date range.
     */
    protected function getWorkingDaysConfig(int $staffMemberId, \Carbon\Carbon $startDate, \Carbon\Carbon $endDate): array
    {
        $employee = StaffMember::find($staffMemberId);
        
        if (!$employee) {
            return $this->getDefaultWorkingDaysConfig($startDate, $endDate);
        }

        $orgId = $employee->org_id;
        $companyId = $employee->company_id;

        $workingDay = \App\Models\WorkingDay::where('org_id', $orgId)
            ->where('company_id', $companyId)
            ->where(function ($q) use ($startDate) {
                $q->whereNull('from_date')
                  ->orWhere('from_date', '<=', $startDate->format('Y-m-d'));
            })
            ->where(function ($q) use ($endDate) {
                $q->whereNull('to_date')
                  ->orWhere('to_date', '>=', $endDate->format('Y-m-d'));
            })
            ->first();

        if (!$workingDay) {
            return $this->getDefaultWorkingDaysConfig($startDate, $endDate);
        }

        $workingDays = [
            'monday' => $workingDay->monday,
            'tuesday' => $workingDay->tuesday,
            'wednesday' => $workingDay->wednesday,
            'thursday' => $workingDay->thursday,
            'friday' => $workingDay->friday,
            'saturday' => $workingDay->saturday,
            'sunday' => $workingDay->sunday,
        ];

        return $this->buildWorkingDatesArray($workingDays, $startDate, $endDate);
    }
    
    /**
     * Get Default Working Days Configuration.
     */
    protected function getDefaultWorkingDaysConfig(\Carbon\Carbon $startDate, \Carbon\Carbon $endDate): array
    {
        $workingDays = [
            'monday' => true,
            'tuesday' => true,
            'wednesday' => true,
            'thursday' => true,
            'friday' => true,
            'saturday' => false,
            'sunday' => false,
        ];
        return $this->buildWorkingDatesArray($workingDays, $startDate, $endDate);
    }
    
    /**
     * Build arrays of working and non-working dates based on config.
     */
    protected function buildWorkingDatesArray(array $workingDays, \Carbon\Carbon $startDate, \Carbon\Carbon $endDate): array
    {
        $workingDaysArray = array_keys(array_filter($workingDays));
        $workingDates = [];
        $nonWorkingDates = [];

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dayName = strtolower($date->format('l'));
            if (isset($workingDays[$dayName]) && $workingDays[$dayName]) {
                $workingDates[] = $date->format('Y-m-d');
            } else {
                $nonWorkingDates[] = $date->format('Y-m-d');
            }
        }

        return [
            'working_days' => $workingDaysArray,
            'total_working_days' => count($workingDates),
            'working_dates' => $workingDates,
            'non_working_dates' => $nonWorkingDates,
        ];
    }

    /**
     * Process yesterday's attendance (mark missed punches and absents).
     */
    public function processDailyAttendance(): void
    {
        $yesterday = now()->subDay()->toDateString();
        $yesterdayCarbon = now()->subDay();

        // 1. Process Missed Punch Outs for yesterday
        $missedPunchLogs = WorkLog::whereDate('log_date', $yesterday)
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->where('status', 'in')
            ->get();

        foreach ($missedPunchLogs as $log) {
            $log->update([
                'status' => 'not_punched_out',
                'notes' => trim(($log->notes ?? '') . ' (Auto marked - missing clock out)'),
            ]);
        }

        // 2. Process Absents for yesterday
        // Check if yesterday was a holiday
        $isHoliday = CompanyHoliday::whereDate('holiday_date', $yesterday)->exists();
        if ($isHoliday) {
            // Holidays are handled by syncCompanyHolidays
            return;
        }

        // Get all active staff members
        $staffMembers = StaffMember::active()->get(['id', 'date_of_joining']);

        // Get staff who ALREADY have ANY attendance record for yesterday
        $attendedStaff = WorkLog::whereDate('log_date', $yesterday)->pluck('staff_member_id');

        // Mark absent for staff without ANY attendance record
        foreach ($staffMembers as $staff) {
            $staffId = $staff->id;
            $doj = $staff->date_of_joining ? Carbon::parse($staff->date_of_joining)->startOfDay() : null;
            
            if ($doj && $yesterdayCarbon->copy()->startOfDay()->lt($doj)) {
                continue;
            }

            if (!$attendedStaff->contains($staffId)) {
                // Check if yesterday was a working day for this staff member
                $workingDaysConfig = $this->getWorkingDaysConfig($staffId, $yesterdayCarbon, $yesterdayCarbon);
                
                // If yesterday was a non-working day (Weekly Off), do not mark as absent
                if (in_array($yesterday, $workingDaysConfig['non_working_dates'])) {
                    continue;
                }

                // Check if not on leave
                if (!$this->isOnLeave($staffId, $yesterday)) {
                    WorkLog::create([
                        'staff_member_id' => $staffId,
                        'log_date' => $yesterday,
                        'status' => 'absent',
                        'notes' => 'Auto-marked absent - no attendance recorded',
                        'author_id' => 1, // System user
                    ]);
                }
            }
        }
    }

    /**
     * Format time safely.
     */
    private function formatTime($time): ?string
    {
        if (!$time) return null;

        try {
            if (is_string($time)) {
                return Carbon::parse($time)->format('H:i:s');
            }
            if ($time instanceof Carbon) {
                return $time->format('H:i:s');
            }
            return (string) $time;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Count working days between dates based on working days configuration.
     * Uses default config if no staffMemberId is provided.
     */
    private function countWorkingDays(Carbon $start, Carbon $end, ?int $staffMemberId = null): int
    {
        if ($staffMemberId) {
            $config = $this->getWorkingDaysConfig($staffMemberId, $start, $end);
            return $config['total_working_days'];
        }

        $config = $this->getDefaultWorkingDaysConfig($start, $end);
        return $config['total_working_days'];
    }

    /**
     * Get historical attendance for an employee.
     */
    public function getEmployeeHistoricalAttendance(int $staffMemberId, int $monthsCount = 12): array
    {
        $staff = StaffMember::with(['jobTitle', 'officeLocation', 'division'])->findOrFail($staffMemberId);
        $doj = $staff->date_of_joining ? Carbon::parse($staff->date_of_joining)->startOfDay() : null;

        // If DOJ exists, calculate the exact number of months to fetch (cap at 120 months)
        if ($doj) {
            $monthsCount = abs(now()->startOfMonth()->diffInMonths($doj->copy()->startOfMonth())) + 1;
            $monthsCount = min($monthsCount, 120);
        }

        $results = [];

        for ($i = 0; $i < $monthsCount; $i++) {
            $targetMonth = now()->startOfMonth()->subMonths($i);
            
            // Skip and stop if the target month is entirely before the date of joining
            if ($doj && $targetMonth->copy()->endOfMonth()->lt($doj)) {
                break;
            }

            $month = $targetMonth->month;
            $year = $targetMonth->year;
            $startOfMonth = $targetMonth->copy()->startOfMonth()->startOfDay();
            $endOfMonth = $targetMonth->copy()->endOfMonth();

            $logs = WorkLog::where('staff_member_id', $staffMemberId)
                ->whereDate('log_date', '>=', $startOfMonth)
                ->whereDate('log_date', '<=', $endOfMonth)
                ->get();

            $paidLeave = $logs->filter(function($l) {
                if (!in_array($l->status, ['on_leave', 'paid_leave'])) return false;
                $notes = strtolower($l->notes ?? '');
                if (str_contains($notes, 'unpaid')) return false;
                return true;
            })->count();

            $unpaidLeave = $logs->filter(function($l) {
                if ($l->status === 'unpaid_leave') return true;
                if ($l->status === 'on_leave') {
                    $notes = strtolower($l->notes ?? '');
                    if (str_contains($notes, 'unpaid')) return true;
                }
                return false;
            })->count();

            $results[] = [
                'month_name'            => $targetMonth->format('M Y'),
                'month'                 => $month,
                'year'                  => $year,
                'present'               => $logs->whereIn('status', ['present', 'late'])->count(),
                'absent'                => $logs->where('status', 'absent')->count(),
                'half_day'              => $logs->where('status', 'half_day')->count(),
                'week_off'              => $logs->where('status', 'week_off')->count(),
                'holiday'               => $logs->where('status', 'holiday')->count(),
                'paid_leave'            => $paidLeave,
                'unpaid_leave'          => $unpaidLeave,
                'overtime_working_day'  => $logs->filter(fn($l) => $l->overtime_minutes > 0 && in_array($l->status, ['present', 'late']))->count(),
                'overtime_week_off'     => $logs->filter(fn($l) => $l->overtime_minutes > 0 && $l->status === 'week_off')->count(),
                'overtime_holiday'      => $logs->filter(fn($l) => $l->overtime_minutes > 0 && $l->status === 'holiday')->count(),
                'late_coming'           => $logs->filter(fn($l) => $l->late_minutes > 0)->count(),
                'early_leaving'         => $logs->filter(fn($l) => $l->early_leave_minutes > 0)->count(),
            ];
        }

        return [
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->full_name,
                'initials' => strtoupper(substr($staff->full_name, 0, 2)),
                'date_of_joining' => $staff->date_of_joining,
            ],
            'history' => $results,
        ];
    }

    /**
     * Get attendance dashboard report — monthly summary for all staff.
     */
    public function getDashboardReport(array $params = []): array
    {
        $month = (int) ($params['month'] ?? now()->month);
        $year  = (int) ($params['year']  ?? now()->year);
        $perPage = (int) ($params['per_page'] ?? 15);

        $startOfMonth = Carbon::create($year, $month, 1)->startOfDay();
        $endOfMonth   = $startOfMonth->copy()->endOfMonth();

        // Build staff query
        $query = StaffMember::with(['jobTitle', 'officeLocation', 'division']);

        // Filter: active / inactive
        if ((empty($params['show_inactive']) || $params['show_inactive'] === 'false') && empty($params['date_of_leaving'])) {
            $query->where(function ($q) {
                $q->where('employment_status', 'active')
                  ->orWhere('active_exit', 'active')
                  ->orWhereNull('active_exit');
            });
        }

        // Filter: branch (office_location_id)
        if (!empty($params['office_location_id'])) {
            $query->where('office_location_id', $params['office_location_id']);
        }

        // Filter: department (division_id)
        if (!empty($params['division_id'])) {
            $query->where('division_id', $params['division_id']);
        }

        // Filter: search by name or phone
        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'LIKE', "%{$search}%")
                  ->orWhere('mobile_number', 'LIKE', "%{$search}%");
            });
        }

        // Filter: date of joining
        if (!empty($params['date_of_joining'])) {
            $query->whereDate('date_of_joining', '=', $params['date_of_joining']);
        }

        // Filter: date of leaving
        if (!empty($params['date_of_leaving'])) {
            $query->where(function ($q) {
                $q->where('active_exit', '!=', 'active')
                  ->orWhere('employment_status', '!=', 'active');
            })->whereDate('updated_at', '=', $params['date_of_leaving']);
        }

        if (!empty($params['exclude_self'])) {
            $user = auth()->user();
            if ($user) {
                $query->where(function ($q) use ($user) {
                    $q->whereNull('user_id')
                      ->orWhere('user_id', '!=', $user->id);
                });
            }
        }

        $query->orderBy('full_name', 'asc');

        // Paginate staff
        $paginated = $query->paginate($perPage, ['*'], 'page', $params['page'] ?? 1);

        // Get staff IDs on this page
        $staffIds = collect($paginated->items())->pluck('id')->toArray();

        // Fetch all work logs for these staff members for the month in one query
        $workLogs = WorkLog::whereIn('staff_member_id', $staffIds)
            ->whereDate('log_date', '>=', $startOfMonth)
            ->whereDate('log_date', '<=', $endOfMonth)
            ->get()
            ->groupBy('staff_member_id');

        // Transform each staff member into a dashboard row
        $records = collect($paginated->items())->map(function ($staff) use ($workLogs) {
            $logs = $workLogs->get($staff->id, collect());

            return [
                'id'                    => $staff->id,
                'name'                  => $staff->full_name,
                'phone_number'          => $staff->mobile_number,
                'employee_id'           => $staff->staff_code,
                'job_title'             => $staff->designation ?? '',
                'present'               => $logs->whereIn('status', ['present', 'late'])->count(),
                'absent'                => $logs->where('status', 'absent')->count(),
                'half_day'              => $logs->where('status', 'half_day')->count(),
                'week_off'              => $logs->where('status', 'week_off')->count(),
                'holiday'               => $logs->where('status', 'holiday')->count(),
                'paid_leave'            => $logs->whereIn('status', ['on_leave', 'paid_leave'])->count(),
                'unpaid_leave'          => $logs->where('status', 'unpaid_leave')->count(),
                'overtime_working_day'  => $logs->filter(fn($l) => $l->overtime_minutes > 0 && in_array($l->status, ['present', 'late']))->count(),
                'overtime_week_off'     => $logs->filter(fn($l) => $l->overtime_minutes > 0 && $l->status === 'week_off')->count(),
                'overtime_holiday'      => $logs->filter(fn($l) => $l->overtime_minutes > 0 && $l->status === 'holiday')->count(),
                'late_coming'           => $logs->filter(fn($l) => $l->late_minutes > 0)->count(),
            ];
        })->values();

        return [
            'data'         => $records,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
        ];
    }

    /**
     * Process and store base64 attendance image.
     */
    private function processAttendanceImage(string $base64Image, string $type, int $staffMemberId): string
    {
        // Decode base64
        $image = str_replace('data:image/jpeg;base64,', '', $base64Image);
        $image = str_replace('data:image/png;base64,', '', $image);
        $image = str_replace('data:image/webp;base64,', '', $image);
        $image = str_replace(' ', '+', $image);
        $imageData = base64_decode($image);

        $filename = 'staff_' . $staffMemberId . '_' . time() . '.jpg';
        $path = "attendance_images/{$filename}";

        Storage::disk('public')->put($path, $imageData);

        return $path;
    }
}
