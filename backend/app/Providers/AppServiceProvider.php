<?php

namespace App\Providers;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Services\Attendance\AttendanceService;
use App\Services\Attendance\ShiftService;
use App\Services\Leave\LeaveService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
 public function register(): void
    {
        $this->app->singleton(AttendanceService::class, function ($app) {
            return new AttendanceService(
                $app->make(ShiftService::class),
                $app->make(LeaveService::class),
                $app->make(\App\Services\Attendance\GeofenceService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Scramble API docs
        Scramble::configure()
            ->withDocumentTransformers(function (OpenApi $openApi) {
                $openApi->secure(
                    SecurityScheme::http('bearer', 'JWT')
                );
            });

        // Admin users have full access to all gates/abilities
        // Support both new role name (admin) and legacy role name (administrator)
        Gate::before(function ($user, $ability) {
            if ($user->roles->contains('hierarchy_level', 1)) {
                return true;
            }
        });
    }
}
