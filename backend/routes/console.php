<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run daily at 00:05 to process yesterday's attendance, mark missed punch outs and absents
\Illuminate\Support\Facades\Schedule::command('attendance:sync-daily')->dailyAt('00:05');
