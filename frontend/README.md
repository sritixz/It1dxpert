# iT1DXpert Frontend

React (Vite) + Tailwind. This phase: **auth pages (login/register) + the
role-aware app shell (sidebar/topbar/route-guarding)**. Dashboard screens
themselves are placeholders — Daily Log, Glucose Trends, Medications, etc.
are next.

## Why plain React, not Next.js

Discussed and decided: the backend is a separate Express API, not
something this frontend needs to colocate server code with — so Next.js's
main advantage (server + client in one framework) doesn't apply here. A
Vite SPA keeps the mental model simpler: this is a browser app that calls
an API, full stop.

## Design approach

Not a generic dashboard template — a few deliberate choices:
- **Palette**: deep navy ink (`#16233A`) + clinical blue (`#2B6CB0`) as
  primary, with green/amber/red reserved specifically for in-range/warning/
  critical states — so color always means the same clinical thing everywhere
  in the app, never just decoration.
- **Type**: Manrope for headers/UI (a little more character than the
  default), Inter for body copy (built for dense, legible reading), and
  IBM Plex Mono specifically for numeric readouts (glucose values, doses) —
  data reads as data, distinct from prose, matching how the mockups
  foreground big legible numbers.
- **Signature element**: the glucose trend line + target-range band on the
  auth screen (`src/assets/GlucoseWave.jsx`) is the one deliberate visual
  flourish — grounded in the product's actual subject matter (it's a
  simplified version of the real Glucose Trends chart) rather than a
  generic gradient or blob.

## Structure

```
src/
  api/
    client.js          axios instance — attaches JWT, handles 401 + refresh
    auth.api.js         login / register / me
  context/
    AuthContext.jsx     app-wide auth state (user, login, logout, register)
  components/
    ProtectedRoute.jsx  client-side auth + role guard (see note below)
    layout/
      AppShell.jsx       sidebar + topbar + routed content
      Sidebar.jsx         role-aware nav (reads config/navConfig.js)
      Topbar.jsx          greeting, date, logout
    ui/                  Button, Input, Card — shared primitives
  pages/
    auth/                LoginPage, RegisterPage, AuthLayout
    patient/ doctor/ admin/   dashboard placeholders (real screens next phase)
  config/navConfig.js    one nav list + one "home path" per role
  assets/GlucoseWave.jsx signature SVG
```

## Important: this is a UI convenience layer, not the security boundary

`ProtectedRoute` stops a logged-in PATIENT from ever seeing the doctor
shell render — but it's a client-side check. The actual enforcement is the
backend's `authenticate` → `authorize` → `scopeToHospital` middleware
chain. Never assume hiding a route here means the data behind it is safe;
every API call still has to go through the real backend guard.

## Known gap: hospital selection on the register form

The register form has a plain "Hospital ID" text field, pre-filled from
`VITE_DEFAULT_HOSPITAL_ID` in `.env`. That's a stand-in — the backend
doesn't have a public `GET /hospitals` endpoint yet (only `SUPER_ADMIN` can
create one), so there's nothing to populate a real dropdown from. Once that
endpoint exists, swap the text input in `RegisterPage.jsx` for a `<select>`
fetched from it.

## Local setup

1. Make sure the backend (`it1dxpert-backend`) is running — this frontend
   calls it directly, nothing works without it up.
2. `cp .env.example .env` — set `VITE_API_BASE_URL` (defaults to
   `http://localhost:5000/api`, fine if you're running the backend
   unmodified) and `VITE_DEFAULT_HOSPITAL_ID` (use the id printed by the
   backend's `npm run seed`).
3. `npm install`
4. `npm run dev` — runs at `http://localhost:3000`.

Try it: go to `/register`, create a patient account (the hospital ID field
should already be filled in from `.env`), and you should land on the
patient dashboard placeholder, sidebar and all. Log out, log back in at
`/login`, same result. Try hitting `/doctor` directly while logged in as
that patient — `ProtectedRoute` should bounce you back to `/patient`.

## Auth storage note

Tokens currently live in `localStorage` (simplest option to get this phase
working). blog.vani used httpOnly cookies for JWTs — if that's the pattern
you'd rather standardize on across projects, swapping this out means:
moving refresh-token issuance to set an httpOnly cookie from the backend,
and dropping the manual `Authorization` header attachment in
`api/client.js` in favor of `credentials: "include"`. Worth deciding before
this goes much further, not after.

## Not built yet

- Daily Log / Glucose Trends / Medications / Badges screens (patient)
- Patient list / patient overview / alerts screens (doctor)
- Doctor & patient management screens (admin)
- Hospital selection dropdown on registration (blocked on backend endpoint, see above)
- Logout-everywhere / refresh-token revocation (matches backend's current scope)
