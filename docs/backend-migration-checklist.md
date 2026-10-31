# Pod Ops Admin backend migration checklist

Use this checklist before mounting any legacy Pod Ops Admin page in the current application shell. A migrated page must never read or write `lib/data/collections.ts` or `lib/store.ts`.

## Completed

- [x] Partners: `/partnerships` list, create, update, archive, permissions, detail, and sponsorship assets.
- [x] Partners: register `/partners` and `/partners/:partnerId` in the active router and Operations navigation.
- [x] Partner detail: remove the local Talent Map editor until Talent Members is migrated.

## Migrate before routing

| Surface | Replace local collection | Backend API | Migration requirements |
| --- | --- | --- | --- |
| Research HIVE | `researchStore` | `/research-profiles` | Query list/detail; create, edit, archive; use server IDs and preserve HIVE scoring fields. |
| Rolodex | `contactStore` | `/contacts` | Query list/detail; create, edit, archive; use `/research-profiles/:id/promote-to-rolodex` for the hand-off. |
| Talent Map | `talentStore` | `/talent-members` | Query list; create, edit, archive; associate a member with a backend partnership ID. |
| Opportunity Canvas | `jobStore` | `/opportunities` and `/companies/:companyId/opportunities` | Query by company/partnership; create, edit, archive; do not derive a local company ID. |
| Placement Agent | `placementOfferStore` | `/placement-offers` | Read backend opportunities and talent members; create/update/archive offers through the API; calculate recommendations only from fetched records. |
| Legacy dashboard | All collections | Existing admin/dashboard and relationship endpoints | Derive counts from queries only; remove seeded metrics and browser-state level calculations. |
| Level-up guide | `goalStore` plus derived collections | Admin dashboard/insights endpoints | Use backend progress and eligibility values; do not calculate levels from seeded browser data. |

## Required verification for every migration

- [ ] The routed page does not import `@/lib/data/collections` or `@/lib/store`.
- [ ] Every list, create, update, and archive operation is performed through `@/lib/api` and React Query.
- [ ] UI actions honour server-returned permission flags rather than inferring access client-side.
- [ ] Refreshing the browser and opening the page in a different session shows the same saved record.
- [ ] Invalid, unauthorized, loading, and empty states are visible and actionable.
- [ ] Direct detail URLs work after a hard refresh.
- [ ] Typecheck and production build pass before the route is added to navigation.

## Cleanup after all migrations

- [ ] Remove legacy route files and unused UI components.
- [ ] Delete `src/lib/data/collections.ts`, `src/lib/store.ts`, seed data, and local-only transforms only after no imports remain.
- [ ] Remove stale links from `Resources.tsx` and any documentation that names an unmounted page.
