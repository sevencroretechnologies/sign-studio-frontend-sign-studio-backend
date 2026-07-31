# Phase 8 — Testing

## Automated tests (run in this environment)

```bash
cd mobile_app
flutter analyze   # static analysis — clean, 0 issues
flutter test      # unit + widget tests — all passing
```

Coverage focuses on the highest-risk area: parsing the backend contract and the
attendance state machine (pure Dart, no backend required).

| Test file | What it verifies |
|-----------|------------------|
| `test/models/api_response_test.dart` | `ApiResponse` success/null-data/validation-errors; `PaginationMeta` reads `total_pages`/`has_more_pages` and falls back to `last_page`. |
| `test/models/user_test.dart` | `User` snake_case mapping, `staff_member_id` → `hasStaffMember`; `AuthSession` token / `access_token` fallback and missing-token error. |
| `test/models/current_status_test.dart` | Clock-in/out gating per status (`not_clocked_in`/`clocked_in`/`clocked_out`/`on_leave`), leave title, `total_hours` from string or num. |
| `test/models/work_log_test.dart` | `WorkLog` label fallbacks; `PaginatedResponse<WorkLog>` for both paginated (`data` + `meta`) and non-paginated responses. |
| `test/widget_test.dart` | App boots (`ProviderScope` → `SignStudioApp`), which transitively compiles every page/service/plugin binding. |

## Environment limitation for live end-to-end

This VM has **no Android SDK/emulator, and no PHP/MySQL**, so a full on-device run
against a live backend cannot be executed here. Live E2E requires either:

1. An Android emulator/device + a reachable backend (`--dart-define=API_BASE_URL=...`), or
2. A hosted API URL + test employee credentials (a user **with** `staff_member_id`).

## Manual E2E checklist (on a device/emulator with the backend reachable)

Run: `flutter run --dart-define=API_BASE_URL=http://<host>:8000/api`

1. **Login** — valid credentials → dashboard; invalid → backend error shown verbatim.
2. **Session restore** — kill & reopen app → stays logged in (secure storage).
3. **401 handling** — expired/invalid token → auto-redirect to Login.
4. **Dashboard** — `current-status-self` loads; correct button per status; user without `staff_member_id` sees the unavailable notice.
5. **Clock In** — deny location → clear message, no crash; allow → GPS + selfie → submit → backend message shown, status flips to clocked-in.
6. **Geofence/accuracy** — from outside the office radius, the backend rejection message is shown verbatim (no client-side validation).
7. **Clock Out** — same flow; status flips to clocked-out.
8. **History** — list loads, scroll paginates (`my-logs`), pull-to-refresh works, empty/error states render.
9. **Offline** — with no connectivity, actions show a connectivity message and no offline clock in/out is cached.
