# Routing: Astro pages, no client-side router

**Decision (2026-10-13):** the client is an Astro multi-page app. Every URL is an Astro page under
`src/pages/`, and each page mounts exactly one React island (`src/islands/`) that renders one view.
`react-router` was removed; nothing in the app owns the URL except the browser.

## Audit (why the router had to go)

| Smell | Where | Effect |
| --- | --- | --- |
| Every Astro page mounted the same `<App />`, which rendered a `BrowserRouter` with all 25 routes | `src/pages/*.astro`, `src/App.tsx` | Each page shipped every view; Astro pages were an empty shell around a SPA |
| Dynamic routes lived only in the router | `/clients/:id`, `/p/:slug` | Required a dev middleware and an nginx catch-all to `index.html`, which also hid real 404s |
| Two `Outlet`-based layouts plus `AdminRoute` and `ProtectedRoute` | `components/templates`, `components/AdminRoute.tsx`, `App.tsx` | Guards were route elements, not reusable page templates |
| 47 `Link` / 18 `useNavigate` call sites | views and organisms | Components depended on a router context to render at all; every test had to wrap in `MemoryRouter` |

## Design

```
src/pages/<route>.astro        one per URL, mounts one island with client:only="react"
src/islands/<View>Island.tsx   <ProtectedPage><View/></ProtectedPage> (or AuthPage / PublicPage)
src/components/templates/
  AppShell.tsx                 i18n boot, I18nextProvider, locale sync, legacy #/ link adoption, session check
  ProtectedPage.tsx            AppShell + account gate + initial data + DashboardLayout (requireAdmin prop)
  AuthPage.tsx                 AppShell + AuthPageLayout
  PublicPage.tsx               AppShell only (magic-link pages, blocked screen)
src/utils/navigation.ts        navigateTo(), isActivePath(), clientIdFromPath(), workoutSlugFromPath()
src/hooks/useUrlSearchParams.ts  [URLSearchParams, set] backed by history.pushState + popstate
```

- Links are plain `<a href>`; programmatic navigation goes through `navigateTo(path, { replace })`,
  which is the single choke point tests mock.
- Guards redirect with `window.location.replace`, so a protected page never renders its view for an
  anonymous user and the redirect leaves no history entry.
- Dynamic segments stay as they were (`/clients/:id`, `/p/:slug`). Astro static output cannot
  prerender unknown ids, so the dev middleware (`spaFallback.ts`) and nginx rewrite those two
  patterns to `/client-details` and `/workout-player`; the view reads the id from the pathname.
  `spaFallback.test.ts` asserts the nginx template carries the same patterns.
- Unknown paths are real 404s (`src/pages/404.astro`); nginx no longer falls back to `index.html`.
- Legacy aliases are Astro `redirects` in `astro.config.mjs` (`/dashboard`, `/admin/tenants`).
- Each page load re-reads the session from storage and refetches the initial data. This is the cost
  of plain MPA navigation; Astro's `<ClientRouter />` can be added later without touching views.

## Test conventions

- `renderWithProviders(ui, { initialRoute })` sets `window.history` instead of a `MemoryRouter`.
- Mock `utils/navigation` (`navigateTo`) where a view navigates; assert on `<a href>` for links.
- Islands have a bootstrap test that mounts them exactly as Astro does (no outside providers).
