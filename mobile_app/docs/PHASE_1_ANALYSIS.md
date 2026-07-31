# SignStudio Attendance — Phase 1 Analysis

Analysis of the existing Laravel backend and React frontend that the Flutter
Attendance app must consume. **The React app is the reference implementation.**
No Flutter code has been written yet — this document is for approval before Phase 2.

Sources analyzed:
- `backend/routes/api.php`
- `backend/app/Http/Controllers/Api/Auth/AccessController.php`, `Services/Auth/AuthService.php`
- `backend/app/Http/Controllers/Api/Attendance/WorkLogController.php`
- `backend/app/Services/Attendance/AttendanceService.php`, `GeofenceService.php`
- `backend/app/Traits/ApiResponse.php`
- `frontend/src/services/api.ts`
- `frontend/src/pages/attendance/ClockInOutSelf.tsx`, `MyWorkLogs.tsx`
- `frontend/src/pages/auth/Login.tsx`

---

## 1. API base & networking

- Base URL used by React: `http://127.0.0.1:8000/api` (all endpoints are prefixed `/api`).
  Flutter will need this to be configurable (emulator uses `http://10.0.2.2:8000/api`).
- Default headers: `Content-Type: application/json`, `Accept: application/json`.
- Auth is a request interceptor that adds `Authorization: Bearer <token>` when a
  token is stored.
- Response interceptor: on **HTTP 401**, clear the stored token + user and redirect
  to `/login`.

## 2. Standard API response envelope

Defined in `App\Traits\ApiResponse`. Every endpoint returns this shape.

Success:
```json
{ "success": true, "data": <object|array|null>, "message": "..." }
```

Error / server error:
```json
{ "success": false, "data": null, "message": "...", "errors": <optional> }
```

Validation error (HTTP 422):
```json
{ "success": false, "data": null, "message": "Validation failed", "errors": { "field": ["msg", ...] } }
```

**Pagination** — NOTE: differs from the generic shape in the task prompt. Paginated
lists put items directly in `data` (a flat array) and pagination in a top-level
`meta` object (NOT nested under `data`):
```json
{
  "success": true,
  "message": "...",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 42,
    "total_pages": 5,
    "from": 1,
    "to": 10,
    "has_more_pages": true
  }
}
```
> The React `MyWorkLogs.tsx` also reads `meta.last_page` for its pager, but the
> backend trait emits `total_pages` (not `last_page`) — so we should rely on
> `total_pages` / `has_more_pages`. Flagging this discrepancy; I'll follow the
> backend trait (source of truth for the actual payload).

The Flutter generic models will be:
- `ApiResponse<T>` → `{ success, message, data, errors? }`
- `PaginatedResponse<T>` → items list + meta (`current_page`, `per_page`, `total`,
  `total_pages`, `has_more_pages`)
- `ValidationError` → `{ message, Map<String, List<String>> errors }`

## 3. Authentication flow

Endpoints (from `routes/api.php`):
- `POST /api/auth/sign-in` (public)
- `POST /api/auth/sign-out` (auth)
- `GET  /api/auth/profile` (auth)

### Sign-in
Request:
```json
{ "email": "user@example.com", "password": "secret" }
```
- The `email` field accepts email **or** username **or** the staff member's mobile
  number (backend `AuthService::login` matches any of them). We'll keep the label
  as "Email" to match React, but the field is really a login identifier.
- Validation: both `email` and `password` are `required|string`.

Success response `data`:
```json
{
  "user": { ...see below },
  "token": "<plainTextToken>",
  "access_token": "<same token>",
  "token_type": "Bearer"
}
```
- Use `data.token` (or `access_token`, identical) as the Bearer token.
- Invalid credentials → thrown `InvalidCredentialsException`; deactivated account →
  `AccountDeactivatedException`. These surface as error envelopes; display
  `message` exactly.

### User object (`formatUserData`)
Key fields the app needs:
```
id, name, email, role, role_display, roles[], permissions[],
staff_member_id (int|null),  <-- important
org_id, company_id, organization_name, company_name,
dashboard { show_my_dashboard, show_admin_dashboard, default_dashboard }
```
- **`staff_member_id`** is critical: clock-in/out and logs require the user to be
  linked to a staff member. React disables attendance when `staff_member_id` is
  null and shows: *"You are not linked to a staff member profile…"*.
  (Backend `getStaffMemberId` will auto-create one on self clock-in if missing, but
  the UI gate is based on `staff_member_id` from the user object.)

### Token storage & 401 handling
- Store the Bearer token securely (`flutter_secure_storage`).
- Every authenticated request sends `Authorization: Bearer <token>`.
- On 401: clear token + cached user, route to Login.

### Sign-out
- `POST /api/auth/sign-out` revokes the token server-side. Client should also clear
  local token/user regardless of the response.

## 4. Attendance workflow

Endpoints (all under `auth:sanctum`, self endpoints need **no special permission**):
- `GET  /api/current-status-self`
- `POST /api/clock-in-self`
- `POST /api/clock-out-self`
- `GET  /api/my-logs`
- `GET  /api/my-summary`

### Current status — `GET /api/current-status-self`
Returns (in `data`) the current attendance state. Possible `status` values:
- `not_clocked_in` — no clock-in today → show **Clock In**
- `clocked_in` — clocked in, not out → show **Clock Out** + today's clock-in time
- `clocked_out` — done for today → show "Attendance completed", no button
- `on_leave` — approved leave today (`on_leave: true`, `leave_details`) → block clock in/out
- `holiday` — company holiday (may still clock in)

`data` fields (clocked-in/out case):
```json
{
  "status": "clocked_in",
  "notes": null,
  "clock_in": "2026-07-31T09:15:00",   // full local datetime (no Z)
  "clock_out": null,
  "clock_in_time": "09:15:00",
  "clock_out_time": null,
  "total_hours": 0,
  "late_minutes": 0,
  "early_leave_minutes": 0,
  "overtime_minutes": 0,
  "break_minutes": 0,
  "shift": { "id", "name", "start_time", "end_time", "is_night_shift" } | null,
  "current_time": "09:40:00",
  "server_timezone": "UTC",
  "log_date_formatted": "2026-07-31"
}
```
Not-clocked-in case returns `status: not_clocked_in` with null times and a `shift`.
On-leave case returns `status: on_leave`, `on_leave: true`, `leave_details`.

React logic for buttons (`ClockInOutSelf.tsx`):
- Clock In shown when `status !== 'clocked_in'` and not on leave and not clocked_out.
- Clock Out shown when `status === 'clocked_in'`.
- Both disabled while loading/getting location, when no `staff_member_id`, or on leave.

### Clock In — `POST /api/clock-in-self`
Request (JSON, Bearer auth):
```json
{ "latitude": 12.34567, "longitude": 76.54321, "accuracy": 10.5, "image": "<base64>" }
```
Backend validation:
- `latitude`  required, numeric, between -90..90
- `longitude` required, numeric, between -180..180
- `accuracy`  nullable, numeric, min 0
- `image`     nullable, string (base64)

> The React web app currently sends `ip_address, latitude, longitude, accuracy`
> and does **not** send an image. The backend `image` field is nullable and, when
> present, is decoded and stored (`processAttendanceImage`). The Flutter task
> **requires** capturing a selfie and sending it as base64 `image` — this is an
> additive use of an already-supported field, not a backend change.

Image/base64 handling (`processAttendanceImage`): backend strips a
`data:image/jpeg|png|webp;base64,` prefix if present, so Flutter may send either a
raw base64 string or a data-URI. We'll send **raw base64 JPEG** with moderate
compression to keep the payload small. Stored under `attendance_images/…`.

Business rules enforced server-side (Flutter must NOT re-implement):
- If already clocked in and not out today → error `"Already clocked in for today"`.
- Geofence + GPS accuracy validation (`GeofenceService`, since `geofence_required=true`):
  - Accuracy worse than the threshold → `"GPS signal is too inaccurate (Xm accuracy)…"`.
  - Outside allowed office radius → `"You are Xm from the office. You must be within
    Ym to mark attendance. Please move Zm closer."`.
  - No office assigned / coords not configured / `bypass_geofence` permission →
    allowed.
- Late-minutes calculation from shift.

Success: `success: true`, `message: "Clocked in successfully"`, `data` = the
`current-status-self` payload (so we can update UI directly from the response).
Failure: HTTP 400 with `success: false` and a `message` — **display it verbatim**.

### Clock Out — `POST /api/clock-out-self`
Identical request shape and validation to clock-in. Same geofence enforcement.
Success `message: "Clocked out successfully"`, `data` = current status.
Display backend message verbatim on both success and error.

### My logs — `GET /api/my-logs`
- Always filtered to the logged-in user's `staff_member_id` server-side.
- Query params supported: `start_date`, `end_date`, `month`, `year`, `paginate`
  (`'false'` to disable), `per_page`, `page`.
- Paginated by default → `data` array + `meta` (see §2).
- Each log item (fields React uses):
  ```
  id, staff_member_id, log_date, log_date_formatted ("Fri, Jul 31, 2026"),
  clock_in (ISO local "YYYY-MM-DDTHH:MM:SS" | null), clock_out (same | null),
  clock_in_time / clock_out_time ("HH:MM:SS"), clock_in_display / clock_out_display ("HH:MM"),
  status (present|late|absent|holiday|... ), late_minutes, total_hours,
  notes, clock_in_image, clock_out_image,
  shift { id, name, start_time, end_time, formatted_start_time, formatted_end_time, ... } | null
  ```
- Attendance History screen will display: **Date, Clock In, Clock Out, Status**
  (plus optional hours), with pagination via `meta`.
- Images are served at `http://<host>/storage/<clock_in_image>`.

### My summary — `GET /api/my-summary`
- Params `start_date`/`end_date` (defaults to current month). Returns aggregate
  stats (total_days, present_days, late_days, total_hours, average_hours_per_day…).
- Optional for the History screen header. Not strictly required by the task's
  "primary screens", but available.

## 5. Error handling rules

- Always show the backend `message` exactly (both validation and business errors).
- Validation (422): map `errors{field: [msg]}` under fields when applicable, but the
  top-level `message` is the primary display.
- 401 → auto logout + redirect to Login.
- Network/timeout/offline → generic connectivity message; **no offline clock in/out,
  no caching** of attendance requests (per task).

## 6. Permissions (device) & backend permissions

- Device permissions needed: **Location** (GPS) and **Camera** (selfie). Gracefully
  request; if denied, explain that attendance can't continue; never crash.
- Backend permissions: the self endpoints (`clock-in-self`, `clock-out-self`,
  `current-status-self`, `my-logs`, `my-summary`) require only authentication — no
  `permission:*` middleware. Admin/manual endpoints (`clock-in`, `work-logs`, etc.)
  are out of scope.

## 7. Endpoint checklist (all confirmed to exist)

| Purpose | Method | Path | Auth |
|---|---|---|---|
| Sign in | POST | `/api/auth/sign-in` | public |
| Sign out | POST | `/api/auth/sign-out` | bearer |
| Profile | GET | `/api/auth/profile` | bearer |
| Current status (self) | GET | `/api/current-status-self` | bearer |
| Clock in (self) | POST | `/api/clock-in-self` | bearer |
| Clock out (self) | POST | `/api/clock-out-self` | bearer |
| My logs | GET | `/api/my-logs` | bearer |
| My summary | GET | `/api/my-summary` | bearer |

No missing endpoints. No backend changes required.

## 8. Open items / decisions to confirm before Phase 2

1. **Base URL config** — the app should default to a configurable host. For Android
   emulator that's `http://10.0.2.2:8000`, physical device needs the LAN IP or a
   deployed API. Please confirm the API host the mobile app should point to (or
   confirm it should be a build-time/`--dart-define` config).
2. **Selfie image** — confirmed additive (backend supports nullable `image`). We'll
   send raw base64 JPEG with moderate compression. OK to proceed.
3. **Login label** — field accepts email/username/mobile; we'll label it "Email"
   like React. Confirm acceptable.
4. **Pagination keys** — will use `meta.total_pages` / `has_more_pages` (backend
   truth) rather than React's `last_page`.

---

### Proposed Phase 2 structure (for reference, not yet built)
```
mobile_app/
  lib/
    core/ (api/, constants/, services/, storage/, utils/, theme/, widgets/)
    features/ (auth/, attendance/, dashboard/, shared/)
    main.dart
  android/ ios/ assets/ pubspec.yaml README.md
```
Stack: Flutter (stable), Material 3, Riverpod, Dio, flutter_secure_storage,
go_router, geolocator, camera, permission_handler, freezed, json_serializable,
build_runner. Clean architecture (UI / repositories / services / models / state /
utils), immutable models, DI, reusable widgets.

**Awaiting approval to proceed to Phase 2.**
