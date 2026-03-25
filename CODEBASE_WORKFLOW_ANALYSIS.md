# Social AI Frontend App - Complete Codebase Workflow Analysis

Last updated: 2026-03-25

## Recent Update (Connections Flow Fix)

- Switched social status refresh to call live per-platform `status` APIs (`/api/social/{platform}/status`) before rendering Connect/Disconnect buttons.
- Updated social callback behavior to stay in `/connections` with an error query instead of forcing `/login` redirect when callback token resolution fails.
- Standardized social refresh/callback auth cookies to `SameSite=lax` to preserve OAuth callback compatibility.
- Updated middleware to treat `refresh_token` as a valid session cookie for protected route/API access checks.

## 1) Scope

This analysis covers the full **app-authored codebase** (all project files except generated/dependency folders such as `node_modules/` and `.next/`).

## 2) Folder Structure (Project Code)

```text
Social-AI-Frontend-App/
├─ .env.local
├─ .gitignore
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.ts
├─ package.json
├─ package-lock.json
├─ postcss.config.mjs
├─ README.md
├─ tailwind.config.ts
├─ tsconfig.json
├─ tsc.txt
├─ tsc_errors.log
├─ tsconfig.tsbuildinfo
├─ public/
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
└─ src/
   ├─ middleware.ts
   ├─ app/
   │  ├─ favicon.ico
   │  ├─ globals.css
   │  ├─ layout.tsx
   │  ├─ page.tsx
   │  ├─ (auth)/
   │  │  ├─ layout.tsx
   │  │  ├─ login/page.tsx
   │  │  ├─ register/page.tsx
   │  │  └─ forgot-password/page.tsx
   │  ├─ (main)/
   │  │  ├─ layout.tsx
   │  │  ├─ page.tsx
   │  │  ├─ dashboard/page.tsx
   │  │  ├─ connections/page.tsx
   │  │  ├─ scheduler/page.tsx
   │  │  ├─ workspace/
   │  │  │  ├─ page.tsx
   │  │  │  ├─ onboarding/page.tsx
   │  │  │  └─ settings/
   │  │  │     ├─ layout.tsx
   │  │  │     ├─ profile/page.tsx
   │  │  │     └─ keywords/page.tsx
   │  │  └─ settings/
   │  │     ├─ layout.tsx
   │  │     ├─ page.tsx
   │  │     ├─ profile/page.tsx
   │  │     ├─ security/page.tsx
   │  │     └─ general/page.tsx
   │  └─ api/
   │     ├─ auth/
   │     │  ├─ refresh/route.ts
   │     │  └─ session/route.ts
   │     └─ social/
   │        ├─ connections/route.ts
   │        └─ [platform]/
   │           ├─ callback/route.ts
   │           └─ [action]/route.ts
   ├─ components/
   │  ├─ navbar.tsx
   │  ├─ sidebar.tsx
   │  ├─ theme_provider.tsx
   │  └─ common/button.tsx
   ├─ hooks/
   │  ├─ useAuth.ts
   │  ├─ useSocial.ts
   │  ├─ useUser.ts
   │  └─ useWorkspace.ts
   └─ lib/
      ├─ http.ts
      ├─ schemas.ts
      └─ api/
         ├─ auth.ts
         ├─ socialAuth.ts
         ├─ user.ts
         └─ workspace.ts
```

## 3) File Inventory (Path + Size + Purpose)

### Root / Config
- `.env.local` (553 B): runtime env vars (`API_URL`, `NEXT_PUBLIC_SOCIAL_BASE_URL`, `JWT_SECRET` placeholder).
- `.gitignore` (521 B): ignores env/build/deps files.
- `eslint.config.mjs` (483 B): Next + TS lint config.
- `next-env.d.ts` (257 B): Next.js TS references.
- `next.config.ts` (164 B): Next config (`reactCompiler: true`).
- `package.json` (747 B): app scripts + dependencies.
- `package-lock.json` (237,635 B): npm lockfile.
- `postcss.config.mjs` (101 B): Tailwind postcss plugin.
- `README.md` (1,486 B): default Next template readme.
- `tailwind.config.ts` (806 B): Tailwind theme tokens and content globs.
- `tsconfig.json` (798 B): TypeScript compiler config.
- `tsc.txt` (630 B), `tsc_errors.log` (2,240 B): old TS error snapshots.
- `tsconfig.tsbuildinfo` (103,762 B): incremental TS build artifact.

### Public Assets
- `public/file.svg` (391 B), `public/globe.svg` (1,035 B), `public/next.svg` (1,375 B), `public/vercel.svg` (128 B), `public/window.svg` (385 B): static icons.

### Middleware
- `src/middleware.ts` (3,125 B): route protection + security headers + auth redirects.

### App Shell
- `src/app/layout.tsx` (1,017 B): root HTML layout; injects theme script that reads `localStorage`.
- `src/app/page.tsx` (197 B): redirects `/` to `/login`.
- `src/app/globals.css` (933 B): CSS variables + theme colors.
- `src/app/favicon.ico` (25,931 B): favicon asset.

### Auth Pages
- `src/app/(auth)/layout.tsx` (432 B): auth wrapper layout.
- `src/app/(auth)/login/page.tsx` (4,803 B): email login + Google button flow.
- `src/app/(auth)/register/page.tsx` (9,963 B): signup + OTP verify flow.
- `src/app/(auth)/forgot-password/page.tsx` (7,454 B): reset password 3-step flow.

### Main Pages
- `src/app/(main)/layout.tsx` (534 B): app frame (Sidebar + Navbar).
- `src/app/(main)/page.tsx` (109 B): redirects to `/dashboard`.
- `src/app/(main)/dashboard/page.tsx` (8,408 B): dashboard UI (currently static/mocked).
- `src/app/(main)/connections/page.tsx` (8,081 B): social account connect/disconnect UI.
- `src/app/(main)/scheduler/page.tsx` (1,310 B): scheduler empty-state page.
- `src/app/(main)/workspace/page.tsx` (7,914 B): workspace overview with profile completeness.
- `src/app/(main)/workspace/onboarding/page.tsx` (11,506 B): 3-step workspace onboarding.
- `src/app/(main)/workspace/settings/layout.tsx` (2,005 B): workspace settings navigation.
- `src/app/(main)/workspace/settings/profile/page.tsx` (6,169 B): workspace profile form UI (mostly local state).
- `src/app/(main)/workspace/settings/keywords/page.tsx` (5,665 B): keyword strategy UI (mock list).
- `src/app/(main)/settings/layout.tsx` (2,000 B): account settings navigation.
- `src/app/(main)/settings/page.tsx` (176 B): redirects `/settings` -> `/settings/profile`.
- `src/app/(main)/settings/profile/page.tsx` (7,495 B): user profile + avatar upload page.
- `src/app/(main)/settings/security/page.tsx` (11,106 B): password/session security UI.
- `src/app/(main)/settings/general/page.tsx` (2,515 B): general preferences UI.

### API Routes (BFF)
- `src/app/api/auth/session/route.ts` (382 B): returns session JSON by calling server auth action.
- `src/app/api/auth/refresh/route.ts` (3,018 B): refresh token endpoint with rate limiting.
- `src/app/api/social/connections/route.ts` (3,325 B): reads social connection status from cookie cache.
- `src/app/api/social/[platform]/[action]/route.ts` (7,622 B): connect/status/disconnect proxy route.
- `src/app/api/social/[platform]/callback/route.ts` (6,934 B): OAuth callback handler + cookie sync.

### Components
- `src/components/sidebar.tsx` (5,807 B): main nav, user display, logout action.
- `src/components/navbar.tsx` (3,327 B): top nav + theme toggle.
- `src/components/theme_provider.tsx` (1,289 B): dark/light toggle persisted in localStorage.
- `src/components/common/button.tsx` (1,829 B): reusable button component.

### Hooks
- `src/hooks/useAuth.ts` (2,937 B): auth state hook via `/api/auth/session` and server actions.
- `src/hooks/useUser.ts` (2,164 B): user profile hook.
- `src/hooks/useWorkspace.ts` (4,298 B): workspace + business profile state hook.
- `src/hooks/useSocial.ts` (4,203 B): social connect/disconnect + polling hook.

### Lib
- `src/lib/http.ts` (2,101 B): server-only fetch wrapper using `API_URL`.
- `src/lib/schemas.ts` (4,001 B): zod validation schemas for auth/workspace.
- `src/lib/api/auth.ts` (11,331 B): auth server actions + cookie lifecycle.
- `src/lib/api/user.ts` (4,003 B): user/session server actions.
- `src/lib/api/workspace.ts` (5,403 B): workspace/business-profile server actions.
- `src/lib/api/socialAuth.ts` (2,584 B): helper for social routes to get/refresh access token.

## 4) Complete Workflow (As Implemented)

## 4.1 Initial Load / Routing Guard
- `/` always redirects to `/login` (`src/app/page.tsx:6`).
- Middleware protects `/dashboard`, `/workspace`, `/settings`, `/connections`, `/scheduler` using `access_token` cookie check (`src/middleware.ts:5-11`, `src/middleware.ts:46-47`, `src/middleware.ts:64-69`).
- If authenticated user hits auth pages (`/login`, `/register`, `/forgot-password`) -> redirected to `/dashboard` (`src/middleware.ts:14`, `src/middleware.ts:58-60`).

## 4.2 Auth Login/Register
- Login page calls server action `login(email,password)` (`src/app/(auth)/login/page.tsx:30`, `src/lib/api/auth.ts:99-124`).
- On success, auth cookies are set (`access_token`, optional `refresh_token`) (`src/lib/api/auth.ts:42-53`, `src/lib/api/auth.ts:119`), then redirect to `/dashboard` (`src/app/(auth)/login/page.tsx:35`).
- Register flow:
  - Step 1: `signup` (`src/app/(auth)/register/page.tsx:48`, `src/lib/api/auth.ts:127-153`).
  - Step 2: OTP verify via `verifyEmail`, which sets auth cookies on success (`src/app/(auth)/register/page.tsx:63`, `src/lib/api/auth.ts:155-173`).
  - Step 3: redirect to dashboard (`src/app/(auth)/register/page.tsx:227`).

## 4.3 Session Resolution / Token Refresh
- Client session endpoint `/api/auth/session` calls `getSession()` (`src/app/api/auth/session/route.ts:10`).
- `getSession()` attempts `/auth/me`; on failure, attempts refresh using `refresh_token`, rewrites cookies, retries `/auth/me` (`src/lib/api/auth.ts:208-244`).
- Dedicated refresh API exists with basic IP rate-limiter (`src/app/api/auth/refresh/route.ts:15-30`, `:38-98`).

## 4.4 Dashboard / Sidebar / Profile Data
- Dashboard page is currently static UI and does not fetch session/user data (`src/app/(main)/dashboard/page.tsx`).
- Sidebar fetches user using `useUser` hook and shows avatar/name (`src/components/sidebar.tsx:24`, `:85-100`).
- `useUser` calls `getUser` server action -> `/auth/me` via token cookie (`src/hooks/useUser.ts:30-50`, `src/lib/api/user.ts:17-27`).

## 4.5 Settings / Profile / Security
- `/settings` redirects to `/settings/profile` (`src/app/(main)/settings/page.tsx:5`).
- Profile page supports name update + avatar upload through server actions (`src/app/(main)/settings/profile/page.tsx:34-68`, `src/lib/api/user.ts:31-68`).
- Security page supports:
  - change/set password (`src/app/(main)/settings/security/page.tsx:45-54`, `src/lib/api/auth.ts:301-356`)
  - list/revoke sessions (`src/app/(main)/settings/security/page.tsx:24-34`, `:66-75`, `src/lib/api/user.ts:70-96`)
  - logout all (`src/app/(main)/settings/security/page.tsx:77-82`, `src/lib/api/user.ts:98-123`)

## 4.6 Social Connections Flow
- Connections page uses `useSocial` (`src/app/(main)/connections/page.tsx:19`).
- `refreshAll()` fetches `/api/social/connections` every 20s (`src/hooks/useSocial.ts:27-32`, `:61-64`).
- Connect flow:
  - POST `/api/social/{platform}/connect` -> receives `authUrl` (`src/hooks/useSocial.ts:75-95`, `src/app/api/social/[platform]/[action]/route.ts:102-123`).
  - Browser redirects to provider.
  - Callback route stores connected status + username in `platform_connections` cookie and redirects back to `/connections?success=` (`src/app/api/social/[platform]/callback/route.ts:172-183`).
- Disconnect flow:
  - POST `/api/social/{platform}/disconnect` (`src/hooks/useSocial.ts:110-121`).
  - Backend disconnect attempted; platform entry removed from `platform_connections` cookie (`src/app/api/social/[platform]/[action]/route.ts:129-143`).
  - UI refreshes status.

## 4.7 Workspace / Onboarding Flow
- Workspace page loads workspace + business profile from backend (`src/app/(main)/workspace/page.tsx:9`, `src/hooks/useWorkspace.ts:35-49`).
- Onboarding page:
  - step 1 create workspace (`src/app/(main)/workspace/onboarding/page.tsx:45-48`)
  - step 2 upsert business profile (`src/app/(main)/workspace/onboarding/page.tsx:65-71`)
  - step 3 redirects to `/workspace` (`src/app/(main)/workspace/onboarding/page.tsx:85`).

## 4.8 Logout Flow
- Sidebar logout calls server action `logout()` then hard redirects `/login` (`src/components/sidebar.tsx:26-31`).
- `logout()` backend-call best effort then clears auth cookies (`src/lib/api/auth.ts:193-206`).

## 5) Inferred Backend / Database Model (From API Contracts)

This frontend does not contain DB schema/migrations. Based on endpoints and payloads, backend likely has:

- `users`: `id`, `firstName`, `lastName`, `email`, `avatarUrl`, `timezone`.
- `sessions`: per-device sessions (`/auth/sessions`, revoke by id).
- `tokens`: short-lived `access_token`, long-lived `refresh_token`.
- `workspaces`: `id`, `name`, `slug`, owner mapping (`/workspace`, `/workspace/me`).
- `business_profiles`: workspace-linked fields (industry, website, audience, tone, etc.).
- `social_connections`: provider records (`platform`, `providerAccountName`, tokens/status).

Frontend cookie cache includes:
- `access_token`
- `refresh_token`
- `platform_connections` (JSON map of platform status/usernames)

## 6) Required Flow vs Current Implementation (Gap Analysis)

## 6.1 Matches
- Cookie-based auth tokens are implemented (`src/lib/api/auth.ts:42-53`).
- Protected route redirects work (`src/middleware.ts:64-69`).
- Refresh logic exists for session API path (`src/lib/api/auth.ts:230-239`).
- Social connect/disconnect/callback cycle is implemented end-to-end.

## 6.2 Mismatches / Risks
- Missing route: login/register point to `/api/auth/google`, but no handler exists.
- Middleware only checks `access_token`; if expired/missing but refresh token exists, user can be redirected to login before silent refresh.
- Dashboard is static and does not display live user profile from cookies/session.
- Requirement said no localStorage for user/session data: app uses localStorage for theme (`src/app/layout.tsx:31`, `src/components/theme_provider.tsx:10-27`).
- User profile is not persisted in cookies; it is fetched from backend and held in hook state.
- Profile updates are not globally synchronized across all active `useUser` consumers instantly (separate hook instances).
- Connections status load uses cookie cache, not guaranteed per-platform live status check on every page open.
- Disconnect removes one platform from cookie cache, not full social/session cookie cleanup.
- Onboarding completion redirects to `/workspace`, not `/dashboard`.
- Workspace `Team` nav link points to `/workspace/settings/team`, but page is missing.
- Cookie policy is inconsistent (`sameSite: lax` and `sameSite: strict` used across different auth paths).
- Old `tsc_errors.log` exists and is stale (`npx tsc --noEmit` currently passes).

## 7) Current Code Health Checks

- `npx tsc --noEmit`: **passes**.
- `npm run lint`: **fails** with 14 errors / 11 warnings (including `react-hooks/set-state-in-effect`, `no-explicit-any`, unescaped entities, unused vars).

## 8) Security Notes

- CSP includes `'unsafe-inline'` and `'unsafe-eval'` (`src/middleware.ts:25`), which weakens XSS protection.
- Token refresh logic duplicated in multiple files (`auth.ts`, `socialAuth.ts`, `connections route`, `callback route`), increasing drift risk.
- `NEXT_PUBLIC_SOCIAL_BASE_URL` is used by server routes; acceptable but should be validated and restricted.
- Logout does not clear `platform_connections` cookie.

## 9) Recommended Priority Fixes

1. Add missing `/api/auth/google` route (login/register currently broken for Google auth).
2. Centralize token refresh into one shared server utility and use it in middleware-friendly path.
3. Make protected-route auth check refresh-aware (or use session endpoint before redirecting).
4. Ensure logout clears all auth-related cookies including `platform_connections`.
5. Replace static dashboard data with session/user-backed data.
6. Implement cross-page user state sync (context/store or SWR cache invalidation).
7. Fix lint errors and remove stale diagnostic files.
8. Add missing `/workspace/settings/team` route or remove nav link.

## 10) Mermaid Workflow (Current)

```mermaid
flowchart TD
  A[App Load /] --> B[/login redirect]
  B --> C{access_token cookie?}
  C -- yes --> D[/dashboard]
  C -- no --> E[Login/Register/Forgot]

  E --> F[login() or verifyEmail()]
  F --> G[Set access_token + refresh_token cookies]
  G --> D

  D --> H[Sidebar useUser -> /auth/me]
  H --> I[Profile shown in UI]

  I --> J{Token expired during session fetch?}
  J -- yes --> K[refreshAccessToken() with refresh_token]
  K --> L{refresh success?}
  L -- yes --> H
  L -- no --> E
  J -- no --> M[Continue]

  M --> N[/connections]
  N --> O[useSocial refreshAll -> /api/social/connections]
  O --> P[Read platform_connections cookie]
  P --> Q{Connect clicked?}
  Q -- yes --> R[/api/social/:platform/connect]
  R --> S[Provider OAuth]
  S --> T[/api/social/:platform/callback]
  T --> U[Update platform_connections cookie]
  U --> N
  Q -- no --> V{Disconnect clicked?}
  V -- yes --> W[/api/social/:platform/disconnect]
  W --> X[Remove platform entry from cookie]
  X --> N

  M --> Y[/workspace/onboarding]
  Y --> Z[Create workspace + business profile]
  Z --> AA[/workspace]

  M --> AB[Logout]
  AB --> AC[Clear access_token + refresh_token]
  AC --> E
```

---

This file is intended as a living reference. Update it whenever workflows, routes, cookies, or API contracts change.
