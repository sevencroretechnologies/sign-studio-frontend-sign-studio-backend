# SignStudio Attendance (Flutter)

Standalone **Employee Attendance** mobile client for the existing SignStudio
Laravel API. It is another client of the backend in `../backend` — it does **not**
contain its own backend, database, or mock APIs, and it never modifies the Laravel
or React apps.

Scope: Login, Dashboard (Clock In / Clock Out), and Attendance History.

## Stack

Flutter (stable) · Material 3 · Riverpod · Dio · flutter_secure_storage ·
go_router · geolocator · camera · permission_handler · freezed · json_serializable ·
build_runner. Clean Architecture with clear separation of UI, repositories,
services, models, state and utilities.

## Project structure

```
lib/
  app.dart                 # Root MaterialApp.router + theme
  main.dart                # Entry point (ProviderScope)
  core/
    api/                   # ApiClient (Dio) + interceptors + ApiException
      interceptors/        # Auth, Error (401), Logger (debug-only)
    constants/             # App constants, endpoints, storage keys
    models/                # ApiResponse<T>, PaginatedResponse<T>, PaginationMeta
    providers/             # Riverpod DI (storage, api client, session)
    router/                # go_router config + guarded routes
    storage/               # SecureStorageService (token/user)
    theme/                 # Material 3 theme
  features/
    auth/                  # Login (Phase 3)
    dashboard/             # Current status + Clock In/Out (Phases 4–6)
    attendance/            # Attendance history (Phase 7)
    shared/                # Splash + shared UI
docs/
  PHASE_1_ANALYSIS.md      # Backend + React analysis (API contract)
```

## Configuration

The API base URL is injected at build/run time via `--dart-define` (no hard-coded
production host). Defaults target the **Android emulator** (`10.0.2.2` → host
`127.0.0.1`).

```bash
# Android emulator (default)
flutter run

# Explicit / physical device (use your machine's LAN IP)
flutter run \
  --dart-define=API_BASE_URL=http://192.168.1.50:8000/api \
  --dart-define=STORAGE_BASE_URL=http://192.168.1.50:8000/storage
```

> The dev backend is served over HTTP; Android cleartext traffic and iOS ATS are
> enabled to allow local development against `http://…`.

## Commands

```bash
flutter pub get
flutter analyze          # must be clean
flutter test
dart run build_runner build --delete-conflicting-outputs   # after adding models
```

## Backend contract

The full API contract (auth, current-status-self, clock-in/out-self, my-logs,
response envelope, geofence rules) is documented in
[`docs/PHASE_1_ANALYSIS.md`](docs/PHASE_1_ANALYSIS.md). All validation
(geofence, GPS accuracy, office radius) is enforced server-side; the app only
sends GPS + selfie and displays backend messages verbatim.
