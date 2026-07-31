<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case IN = 'in';
    case PRESENT = 'present';
    case ABSENT = 'absent';
    // case HALF_DAY = 'half_day';
    case ON_LEAVE = 'on_leave';
    case HOLIDAY = 'holiday';
    case WEEK_OFF = 'week_off';
    case NOT_PUNCHED_OUT = 'not_punched_out';
    case LATE = 'late';

    public function label(): string
    {
        return match($this) {
            self::IN => 'IN',
            self::PRESENT => 'Present',
            self::ABSENT => 'Absent',
            // self::HALF_DAY => 'Half Day',
            self::ON_LEAVE => 'On Leave',
            self::HOLIDAY => 'Holiday',
            self::WEEK_OFF => 'Week Off',
            self::NOT_PUNCHED_OUT => 'Not Punched Out',
            self::LATE => 'Late',
        };
    }
}
