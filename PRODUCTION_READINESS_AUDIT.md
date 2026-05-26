# Elixir Insight — Production Readiness Audit
**Date:** 2026-05-26  
**Platform:** elixir-insight — Digital Product Passport (DPP) SaaS for Classy Cocktails  
**Stack:** React 18 + TypeScript + Vite 5 + Supabase (Auth/DB/Storage/Edge Functions) + TanStack Query v5  
**Audited by:** 14 specialist agents (Product, UX/UI, Frontend, Backend, Database, Security, Privacy, Infrastructure, Performance, Integrations, Analytics, QA/Accessibility, AI Content, Legal)

---

## Overall Verdict

> **⚠️ CONDITIONAL GO — Not safe for public EU consumer deployment in current state**

The core product is architecturally sound and functionally impressive for its stage: the consumer DPP journey works end-to-end, the admin suite covers the full content lifecycle, and the codebase has received meaningful security hardening. However, **four compliance-blocking issues** prevent EU launch today: no cookie consent UI (making analytics collection legally invalid and functionally dead), no privacy policy, lead-capture forms collecting PII without GDPR disclosure, and a "Verified · EU Compliant" allergen badge on AI-extracted data with no disclaimer. Fix these four items and the platform can launch to a limited audience within 2-3 weeks. Full production hardening requires a 6-8 week sprint.

---

## Scorecard

| Area | Agent | Score | Verdict |
|---|---|:---:|---|
| Product & Business Logic | Agent 2 | **4.0 / 5** | Strong foundation; overlay_modal placement and collections-targeting are stubs |
| UX / UI & Client-Readiness | Agent 3 | **3.5 / 5** | Polished consumer page; admin nav needs hierarchy; "Powered by Aitems" visible |
| Frontend Code Quality | Agent 4 | **3.5 / 5** | Clean structure; auth subscription leak; zero form validation schemas; 37 `as any` casts |
| Backend / API | Agent 5 | **3.0 / 5** | JWT auth on all functions; no role check in edge functions; no rate limiting |
| Database & Data Model | Agent 6 | **3.5 / 5** | RLS is correct; `get_product_nutrition` RPC has broken column names (CRITICAL) |
| Security & Authentication | Agent 7 | **3.5 / 5** | Well-hardened; `product_nutrition_public` view still leaks `raw_analytical_data` |
| Privacy, Cookies & GDPR | Agent 8 | **1.5 / 5** | No consent banner, no privacy policy, PII collected without legal basis |
| Infrastructure & DevOps | Agent 9 | **1.0 / 5** | No CI/CD, no staging, no monitoring, live `.env` in repo |
| Performance & Scalability | Agent 10 | **2.0 / 5** | 1.8 MB bundle, 10-query waterfall on bottle page, analytics fetches 20K rows |
| Integrations & Interoperability | Agent 11 | **2.0 / 5** | Good import pipeline; no API, no webhooks, no QR generation, Lovable vendor lock |
| Analytics & Reporting | Agent 12 | **3.0 / 5** | Solid model; scan_events unused, geo data never populated, consent gate kills all data |
| QA, Testing & Accessibility | Agent 13 | **1.5 / 5** | Zero tests, WCAG color contrast failures, AgeGate no focus trap, admin forms no `<label>` |
| AI / Generative Content | Agent 14 | **2.0 / 5** | Prompt injection risk; allergen defaults to `false`; no AI audit log |
| Legal & Commercial | Agent 15 | **1.0 / 5** | No privacy policy, ToS, or DPA; allergen badge creates regulatory liability |
| **Overall** | | **2.5 / 5** | **Conditional Go** |

---

## Critical Blockers — Must Fix Before Any EU Consumer Launch

These items create legal exposure or cause core features to silently fail. None requires more than 1-2 days of work individually.

### B1 — No Cookie/Tracking Consent UI (GDPR · Analytics)
**Agents:** 8 (Privacy), 12 (Analytics), 2 (Business Logic)  
The `setTrackingConsent()` function exists in `useTracking.ts` but is **never called from any consumer-facing component**. Result: `hasTrackingConsent()` always returns `false` → all analytics inserts are suppressed → the analytics dashboard shows zero data for every new consumer. There is no banner, no opt-in, no opt-out.

**Fix:** Add a `<CookieBanner>` component to `BottlePage.tsx` that calls `setTrackingConsent(true/false)` on accept/dismiss. Link to cookie policy. This also unlocks all analytics data.

---

### B2 — Lead Capture Forms Collect PII Without Consent or Privacy Notice (GDPR)
**Agents:** 8 (Privacy), 15 (Legal)  
Both `LeadCaptureActivation` and `LeadCaptureRatingActivation` in `ActivationRenderer.tsx` collect name, email, and phone with no privacy notice, no consent checkbox, and no link to a privacy policy. Under GDPR Art. 6 and 13, this has no valid legal basis.

**Fix:** Add a required checkbox (`"I agree to the [Privacy Policy]. My data will be used by Classy Cocktails for..."`) before every lead form submit button. Gate the submit on checkbox-checked.

---

### B3 — No Privacy Policy Exists (GDPR)
**Agents:** 8 (Privacy), 15 (Legal)  
No `/privacy` route, no `privacy.html` in `public/`, no link in `BottleFooter.tsx`. Required under GDPR Art. 13/14 for any EU consumer-facing service that processes personal data.

**Fix:** Create a privacy policy at `/privacy` covering: controller identity, data categories (leads, analytics), purposes, lawful bases, sub-processors (Supabase, Lovable/Google), retention periods, and subject rights. Link from `BottleFooter.tsx`.

---

### B4 — `get_product_nutrition` RPC Has Wrong Column Names — Consumer Nutrition Data Broken
**Agents:** 6 (Database)  
Migration `20260525000001` (the role-system fix) rewrote `get_product_nutrition` using field names `fat_total`, `fat_saturated`, `carbohydrate_total`, `carbohydrate_sugars`, `protein`, `alcohol_percent` — but the actual `product_technical_data` columns are `fats`, `saturated_fats`, `carbohydrates`, `sugars`, `proteins`, `alcoholic_strength`. **This RPC returns null for all nutritional values on every product.** The nutrition section on every consumer bottle page is silently empty.

**Fix:** New migration correcting the column names in `get_product_nutrition`.

---

### B5 — "Verified · EU Compliant" Badge on AI-Extracted Allergen Data (Legal Liability)
**Agents:** 14 (AI Content), 15 (Legal)  
`BottleNutrition.tsx` displays "Verified · EU Compliant" and "EU Reg. 1169/2011" on data extracted by Gemini 2.5 Flash with no human verification step. AI allergen extraction defaults missing fields to `false` (not present) rather than `null` (unknown). Incorrect allergen display can cause consumer harm; claiming EU compliance without verification creates strict regulatory liability.

**Fix:** (a) Replace "Verified · EU Compliant" with "Provided by supplier — verify against product label". (b) Change AI allergen schema defaults from `false` to `null`. (c) Display `null` allergens as "Not confirmed" rather than "Not present" in `BottleNutrition.tsx`.

---

### B6 — `product_nutrition_public` View Still Exposes `raw_analytical_data` to Anon (Security)
**Agents:** 7 (Security), 6 (Database)  
Migration `20260410092801` created this view including `raw_analytical_data` with `GRANT SELECT TO anon`. The subsequent hardening that restricts this column via `get_product_nutrition` RPC does not drop or redefine the view. **Anon users can bypass the RPC gate and query `raw_analytical_data` directly.**

**Fix:** `DROP VIEW public.product_nutrition_public; CREATE VIEW public.product_nutrition_public AS SELECT [all columns except raw_analytical_data, supplier_name, supplier_address, supplier_phone, supplier_email, supplier_vat, laboratory_name, laboratory_address, test_report_number, accreditation_number, batch_number, label_date] FROM product_technical_data;` — with `GRANT SELECT TO anon, authenticated`.

---

### B7 — Edge Functions Have No Role Authorization (Security)
**Agents:** 7 (Security), 5 (Backend)  
All three AI edge functions (`analyze-tech-sheet`, `analyse-image`, `translate-product`) verify the user's JWT but do not check their role. Any authenticated user — including `marketing`, `editor`, or `moderator` — can invoke these functions, burning AI credits and writing to `brand_images`/`image_attributes`/`product_translations`.

**Fix:** After `auth.getUser()` in each function, add:
```ts
const isAuthorized = await supabase.rpc('has_any_role', {
  user_id: user.id, roles: ['admin', 'supply', 'editor']
});
if (!isAuthorized.data) return new Response('Forbidden', { status: 403 });
```

---

### B8 — `has_role` / `has_any_role` Executable by Anon (Security Oracle)
**Agents:** 5 (Backend), 7 (Security)  
No `REVOKE EXECUTE` statement exists for these two SECURITY DEFINER functions. Supabase defaults to granting EXECUTE to `public` for new functions. Anonymous callers can determine whether a given UUID has a given role — a privilege escalation intelligence tool.

**Fix:** Migration: `REVOKE EXECUTE ON FUNCTION public.has_role FROM anon, public; REVOKE EXECUTE ON FUNCTION public.has_any_role FROM anon, public; GRANT EXECUTE ON FUNCTION public.has_role TO authenticated; GRANT EXECUTE ON FUNCTION public.has_any_role TO authenticated;`

---

## High Priority Issues — Fix Within 30 Days

### H1 — Auth Store Subscription Leak
**Agent 4 (Frontend)**  
`authStore.ts` returns a cleanup function from an async `initialize()`, but `App.tsx`'s `useEffect` never captures or calls it. The `onAuthStateChange` listener accumulates on every hot-reload and re-mount.

**Fix:** Move `onAuthStateChange` into `AppInner`'s `useEffect` directly; return `() => subscription.unsubscribe()` from the effect.

---

### H2 — No Code-Splitting (1.8 MB Monolithic Bundle)
**Agents:** 10 (Performance), 9 (DevOps)  
`vite.config.ts` has no `build.rollupOptions.output.manualChunks`. The entire app ships as a single ~1.8 MB JS chunk including recharts (~350 KB), framer-motion (~100 KB), pdfjs-dist, radix-ui, and react-router. On mobile 4G this means ~4-6 seconds before the first byte of product data can even be requested.

**Fix:** Add `manualChunks` splitting at least: `vendor-react`, `vendor-charts` (recharts), `vendor-animation` (framer-motion). Lazy-load all admin routes. Target: initial consumer bundle < 300 KB.

---

### H3 — 10-Query Sequential Waterfall on Bottle Page
**Agent 10 (Performance)**  
`BottlePage.tsx` fires 11 queries on load: 1 initial product lookup, then 10 more that each wait for `productId` to resolve — creating a minimum of 11 sequential round-trips before the page can fully render. On mobile 4G with 80ms RTT this alone adds ~880ms.

**Fix:** Merge the 7 product-content queries into a single Supabase RPC (`get_bottle_page_data(slug)`). Only `activations` and `defaultSections` need separate fetches.

---

### H4 — Analytics Fetches Up to 20,000 Raw Rows Client-Side
**Agents:** 10 (Performance), 12 (Analytics)  
`useAnalytics.ts` fetches up to 10,000 `page_views` and 10,000 `section_interactions` rows then aggregates everything in JavaScript. Hits the cap silently; all KPIs undercount past the threshold with no warning.

**Fix:** Replace with Supabase RPC or materialized views that return pre-aggregated counts. Browser receives summary data, not raw rows.

---

### H5 — No Password Reset Flow
**Agent 2 (Business Logic)**  
`AdminLogin.tsx` has no "Forgot password?" link. `authStore.ts` has no `resetPassword` method. A locked-out admin has no self-service recovery.

**Fix:** Add `supabase.auth.resetPasswordForEmail()` + `/admin/reset-password` callback route in `App.tsx`.

---

### H6 — `overlay_modal` Placement Has No Consumer Renderer
**Agent 2 (Business Logic)**  
`AdminActivationEditor.tsx` lists `overlay_modal` as a valid placement. `BottlePage.tsx` only renders activations at named placements. `ActivationRenderer.tsx` has no modal renderer. Admins can create and publish `overlay_modal` campaigns that are permanently invisible to consumers with no error.

**Fix:** Either implement the modal renderer, or remove `overlay_modal` from the placement options until it is built.

---

### H7 — Prompt Injection via PDF Content
**Agent 14 (AI)**  
`analyze-tech-sheet` passes raw extracted PDF text verbatim as a user-prompt string with no sanitisation. A crafted document could override the extraction schema and corrupt allergen booleans in `product_technical_data`.

**Fix:** Wrap document text in structural delimiters; add explicit system instruction that document content is untrusted data only. Enforce max character cap on `sourceText` (~100,000 chars) server-side.

---

### H8 — No CI/CD Pipeline
**Agent 9 (DevOps)**  
No `.github/workflows/` directory exists. All changes go directly to production with no automated gate.

**Fix:** GitHub Actions with jobs: `tsc --noEmit`, `eslint`, `vite build`. Add branch protection on `main`. Even a 15-minute setup eliminates the class of "broken production build" incidents.

---

### H9 — `scan_events` Table Is Completely Unused
**Agent 12 (Analytics)**  
The `scan_events` table exists with RLS policies but nothing in `useTracking.ts` or `BottlePage.tsx` ever inserts into it. QR scan volume — the primary commercial KPI of a DPP platform — is entirely unmeasured.

**Fix:** Insert into `scan_events` on `usePageViewTracking` (add `?source=qr` query param from QR codes to distinguish scans from direct hits).

---

### H10 — Zero Test Coverage
**Agent 13 (QA)**  
No `*.test.ts`, `*.spec.ts`, or `__tests__/` files exist anywhere in the codebase. Playwright is in `devDependencies` but no test files or `playwright.config.ts` exist. There is no QA checklist, no release process documented.

**Fix (minimum):** Add unit tests for the 3 most critical utilities: `pdfParser.ts`, `excelParser.ts`, `getCompletenessColor`. Add a single Playwright e2e smoke test: load a bottle page, verify product name renders.

---

### H11 — Geographic Analytics Never Populated
**Agent 12 (Analytics)**  
`page_views.country` and `page_views.city` columns exist in the schema but are never written. The geographic breakdown UI widget will always be empty.

**Fix:** Enrich via a Supabase Database Webhook or trigger on `page_views` insert, calling a GeoIP edge function; or pass country from a CDN geo-header (`CF-IPCountry`, `X-Vercel-IP-Country`).

---

### H12 — `useApiForm.handleSave` Silently Swallows Errors
**Agent 4 (Frontend)**  
`handleSave` uses `try/finally` with no `catch`. When `onSave()` throws, the spinner stops but no error is shown to the user. Every tab component that uses `useApiForm` silently discards save failures.

**Fix:** Add `catch (e) { setError(e); }` to `useApiForm`, return `error` from the hook, and surface it in each tab's UI.

---

### H13 — WCAG 2.2 AA Color Contrast Failures Throughout Consumer Page
**Agent 13 (QA/Accessibility)**  
Multiple color combinations fail the 4.5:1 AA contrast ratio:
- `#9a9a9a` text on `#fafaf8`: ratio ~2.85:1 — used heavily in `BottleNutrition.tsx` at 8–10px
- `#b8975a` gold on `#fafaf8`: ratio ~2.83:1 — product line names, badges, expand buttons
- `#4a8c5c` green on `#fafaf8`: ratio ~3.49:1 — allergen "safe" badges
- `#a08040` amber on `#fafaf8`: ratio ~3.21:1 — allergen warning text (safety-critical)

**Fix:** Darken to minimum accessible equivalents: gold → `#8a6d30`, green → `#2e6b3e`, amber → `#6b5621`, muted text → `#595959`.

---

### H14 — AgeGate Has No Focus Trap or ARIA Dialog Attributes
**Agent 13 (QA/Accessibility)**  
`AgeGate.tsx` renders a full-screen overlay with no `role="dialog"`, `aria-modal="true"`, focus management, or Escape-key handling. Screen readers can navigate past it; keyboard users can interact with content behind it.

**Fix:** Add `role="dialog" aria-modal="true" aria-labelledby` to the overlay container; implement a focus trap within the modal using the existing Radix Dialog primitive already in the project.

---

### H15 — Admin Login Form Inputs Have No `<label>` Elements
**Agent 13 (QA/Accessibility)**  
`AdminLogin.tsx` renders `<Input placeholder="Email" />` and `<Input placeholder="Password" />` with no associated `<label htmlFor>`. Placeholders disappear on focus and are not read by all screen readers as labels.

**Fix:** Add `<Label htmlFor="email">Email</Label>` etc. and matching `id=` props. Apply the same pattern to all admin form input groups in `GeneralTab.tsx`, `LanguagesTab.tsx`, and other tab components.

---

### H16 — ErrorBoundary "Try Again" Button Immediately Re-throws
**Agent 13 (QA/Accessibility)**  
`ErrorBoundary.tsx` resets `hasError: false` on "Try again" click without remounting the child component tree. The same broken subtree re-executes and immediately throws again. The button is effectively non-functional.

**Fix:** Increment a `key` prop on the child wrapper when resetting state so React remounts the subtree: `<div key={this.state.resetKey}>{this.props.children}</div>`.

---

### H17 — No Meaningful `staleTime` on Consumer Queries
**Agent 10 (Performance)**  
The QueryClient default `staleTime: 30_000` (30s) is already set. Consumer bottle data (product info, translations, pairings) changes at most a few times per day. A 30s stale time means every consumer returning within 30s won't refetch, but every fresh visit does. Raising to 10–30 minutes for consumer queries would significantly reduce waterfall depth.

**Verify/Fix:** Raise `staleTime` to `10 * 60 * 1000` for consumer queries (`useProduct`, `useProductTranslations`, `useProductAiPairings`, etc.). Keep admin queries at 30s for snappier data freshness.

---

## Medium Priority Issues — Fix Within 60 Days

| # | Area | Finding | Effort |
|---|---|---|---|
| M1 | UX | Replace admin flat button bar with proper sidebar navigation | 2 days |
| M2 | UX | Remove "Powered by Aitems" from consumer bottle page | 30 min |
| M3 | UX | Wire Leads Captured stat (currently hardcoded `—`) | 1 day |
| M4 | UX | AgeGate: switch from `sessionStorage` to `localStorage` with TTL | 1 hour |
| M5 | Frontend | Replace `window.__refreshPreview` global with Zustand signal or query invalidation | 2 hours |
| M6 | Frontend | Add Zod schemas for login form and new-product modal | 1 day |
| M7 | Frontend | Regenerate `supabase/types.ts` to eliminate `as any` casts in analytics/settings hooks | 2 hours |
| M8 | Backend | Add input size cap on `sourceText` in `analyze-tech-sheet` (200 KB max server-side) | 30 min |
| M9 | Backend | Add `public_url` origin validation in `analyse-image` (must be Supabase storage domain) | 1 hour |
| M10 | Backend | Add per-user rate limiting to AI edge functions (e.g. 20 calls/hour/user) | 1 day |
| M11 | Database | Add `brand_id` to `products` table (required before multi-brand onboarding) | 2 days + migration |
| M12 | Database | Add `expires_at` / data retention policy to `activation_leads` (GDPR) | 1 day |
| M13 | Database | Add CHECK constraints: `completeness BETWEEN 0 AND 100`, `rating BETWEEN 1 AND 5`, `tech_sheet_uploads.status IN (...)` | 2 hours |
| M14 | Security | Drop or rewrite `product_nutrition_public` view to exclude sensitive columns (see B6) | 30 min |
| M15 | Security | Restrict CORS on edge functions from `*` to production domain | 30 min |
| M16 | Security | Validate that `public_url` in `analyse-image` belongs to Supabase storage before forwarding to AI | 1 hour |
| M17 | Privacy | Add "responsible drinking" footer to `BottleFooter.tsx` | 30 min |
| M18 | Privacy | Gate YouTube/Vimeo iframes (VideoActivation) behind consent check | 1 hour |
| M19 | Privacy | Remove `user_agent` from `page_views` or document retention + legal basis | 1 day |
| M20 | DevOps | Create `.env.example` with placeholder values; document setup | 30 min |
| M21 | DevOps | Create a staging Supabase project; separate staging vs production environments | 2 days |
| M22 | Performance | Move `useActiveActivationsForProduct` filter server-side using `@>` PostgREST operator | 1 hour |
| M23 | Performance | Add `fetchpriority="high"` + explicit dimensions to hero image in `BottleHero` | 30 min |
| M24 | Performance | Replace 4 sequential `await` calls in `useImageStats` with `Promise.all()` | 30 min |
| M25 | Integrations | Replace Lovable AI gateway with direct Gemini or Anthropic API calls | 1 day |
| M26 | Integrations | Abstract `SHEET_SLUG_MAP` in `excelParser.ts` from hardcoded to database-driven | 2 days |
| M27 | Analytics | Add responsible-consent two-tier model: cookieless aggregate events unconditionally + session tracking only post-consent | 2 days |
| M28 | AI Content | Change AI allergen defaults from `false` to `null`; display `null` as "Unconfirmed" | 1 day |
| M29 | AI Content | Add `data_source` enum to `product_technical_data` (`ai_extracted`, `ai_reviewed`, `lab_verified`, `manual`) | 1 day |
| M30 | Legal | Add cookie banner UI | 2 days |
| M31 | Legal | Publish Privacy Policy and Cookie Policy | External (legal) |
| M32 | Legal | Add promotional T&Cs to reward code display UI | 1 day |

---

## Low Priority / Post-Launch Polish — Fix Within 90 Days

| # | Area | Finding |
|---|---|---|
| L1 | UX | Language switcher: show only languages with existing translations |
| L2 | UX | Add "Not found" branded page with logo when `/bottle/:slug` returns nothing |
| L3 | UX | Define `font-admin` utility class in `index.css` (falls back but should be explicit) |
| L4 | UX | Wire `product.product_link` as fallback URL in `StoreCTA.tsx` |
| L5 | Frontend | `parseFloat(product.abv)` guard for `null`/`undefined` in `BottlePage.tsx` — silent NaN skips age gate |
| L6 | Frontend | Migrate `AdminSiteSettings` initial load and `LanguagesTab` language list to TanStack Query |
| L7 | Frontend | Add `'str' in item` filter in `pdfParser.ts` before accessing `.str` / `.transform` (pdfjs `TextMarkedContent` items) |
| L8 | Backend | Standardize all edge functions on same `@supabase/supabase-js` version |
| L9 | Backend | Restrict `get_product_nutrition` caller to `anon` explicitly (add `GRANT EXECUTE TO anon`) if public access is intentional |
| L10 | Database | Add `updated_at` timestamps to `product_technical_data`, `product_translations`, `product_sections`, `user_roles` |
| L11 | Database | Add `uploaded_by uuid REFERENCES auth.users(id)` to `brand_images` (currently `text`) |
| L12 | Database | Clarify/merge the `brands` and `collaborations` tables (overlapping concepts) |
| L13 | Security | Drop `maybe_assign_admin` function entirely (`DROP FUNCTION public.maybe_assign_admin()`) |
| L14 | Security | Apply `DOMPurify.sanitize()` to `content.html` in `CustomHtmlActivation` before iframe srcDoc |
| L15 | Security | Apply `safeUrl()` guard to `CustomBlock`'s `cta` case (currently no `javascript:` check) |
| L16 | Performance | Add WebP image serving via Supabase Storage transform params (`?width=800&format=webp`) |
| L17 | Performance | `useAdminStats` count queries: use `select('*', { count: 'exact', head: true })` to avoid fetching rows |
| L18 | Integrations | Add QR code generation in-platform (linked to `/bottle/:slug` per product) |
| L19 | Integrations | Add lead CSV export from the activation leads table |
| L20 | Integrations | Implement or remove "Coming Soon" PDF report export from AdminAnalytics |
| L21 | Analytics | Add a "published/draft" boolean to `products` so incomplete products can't be publicly accessed |
| L22 | AI Content | Add AI audit log table (model, input hash, response hash, tokens, timestamp, user_id, product_id) |
| L23 | AI Content | Add mandatory human sign-off step for allergen fields before "Apply All" in tech sheet review |
| L24 | Legal | Add age verification DOB field to AgeGate (replace honour-system button) |
| L25 | Legal | Sign DPAs with Supabase and Lovable/Google AI |
| L26 | DevOps | Integrate Sentry for error monitoring |
| L27 | DevOps | Add uptime monitoring (BetterStack or similar) |
| L28 | DevOps | Add `"typecheck": "tsc --noEmit"` to `package.json` scripts; run in CI |
| L29 | DevOps | Host favicon locally in `public/` (currently hotlinked from external CDN) |

---

## 30 / 60 / 90-Day Remediation Roadmap

### Sprint 0 — Immediate (this week)
*Complete before any client demo or consumer exposure*

- [ ] **B4** Fix `get_product_nutrition` RPC column names (migration)
- [ ] **B6** Drop/rewrite `product_nutrition_public` view
- [ ] **B7** Add role check to all 3 edge functions
- [ ] **B8** Revoke `has_role`/`has_any_role` from anon
- [ ] **B5** Replace "Verified · EU Compliant" badge with supplier disclaimer; change allergen null defaults
- [ ] **H1** Fix auth store subscription leak
- [ ] **H12** Add error catch to `useApiForm.handleSave`
- [ ] Rotate Supabase anon key (the `.env` file was in repo root even if gitignored — precautionary)

### Sprint 1 — 30 Days
*Required for any EU consumer exposure*

- [ ] **B1** Cookie consent banner (2 days)
- [ ] **B2** GDPR consent checkbox in lead capture forms (1 day)
- [ ] **B3** Privacy policy at `/privacy`, linked from footer (external legal + 1 dev day)
- [ ] **B5** Allergen null-default and disclaimer (1 day)
- [ ] **H5** Password reset flow (1 day)
- [ ] **H6** Remove or implement `overlay_modal` placement (1 day)
- [ ] **H7** Prompt injection defense in `analyze-tech-sheet` (1 day)
- [ ] **H8** GitHub Actions CI pipeline: `tsc --noEmit` + `vite build` (1 day)
- [ ] **H2** Vite code-splitting: `manualChunks` for recharts + framer-motion + lazy admin routes (2 days)
- [ ] **M2** Remove "Powered by Aitems" from consumer page (30 min)
- [ ] **M3** Wire Leads Captured stat (1 day)
- [ ] **M30** Cookie banner with accept/decline UI (if not done in B1)
- [ ] **M31** Publish Privacy Policy and Cookie Policy
- [ ] **M20** Create `.env.example`

### Sprint 2 — 60 Days
*Full production hardening*

- [ ] **H3** Bottle page query consolidation (RPC) — biggest performance win (3 days)
- [ ] **H4** Move analytics aggregation server-side (3 days)
- [ ] **H9** Wire `scan_events` for QR scan tracking (1 day)
- [ ] **H11** GeoIP enrichment for analytics geographic breakdown (2 days)
- [ ] **M21** Staging environment setup (2 days)
- [ ] **M25** Replace Lovable AI gateway with direct API (1 day)
- [ ] **M26** Database-driven Excel slug map (2 days)
- [ ] **M28/29** Allergen provenance + `data_source` column (2 days)
- [ ] **H10** Minimum test coverage: 3 unit tests + 1 Playwright smoke test (2 days)
- [ ] **L1** Language switcher: filter to available languages (2 hours)
- [ ] **L5** Fix `parseFloat(product.abv)` null guard (30 min)

### Sprint 3 — 90 Days
*Commercial polish and long-term sustainability*

- [ ] Multi-brand `brand_id` on `products` table
- [ ] QR code generation in-platform
- [ ] Lead CSV export
- [ ] Sentry error monitoring + uptime monitoring
- [ ] Data retention pg_cron jobs (GDPR)
- [ ] DPA documentation with Supabase + Lovable/Google
- [ ] Comprehensive test suite expansion
- [ ] Allergen human-sign-off admin workflow

---

## Feature Gaps vs Business Model

The following features would be needed for a commercially complete DPP SaaS offering but are currently absent:

| Feature | Commercial Importance | Effort |
|---|:---:|---|
| QR code generation in-platform | Critical — DPP requires physical label QR | Medium |
| Published/draft status on products | High — any known slug is publicly live | Low |
| Password reset | High — admin lockout has no recovery | Low |
| Lead CSV/CRM export | High — lead capture ROI cannot be proven without it | Medium |
| Invite-by-email onboarding | Medium — new admins must self-register | Medium |
| Public API / JSON-LD endpoint for DPP data | Medium — EU DPP regulation favours machine-readable data | High |
| Webhook system for external integrations | Medium — CRM, e-commerce | High |
| Collections targeting (activation segmentation) | Low (UI stub, no data model) | High |
| Overlay/modal activation renderer | Medium — UI option exists but renders nothing | Medium |
| PDF report export | Low (placeholder in UI) | Medium |
| Shopify/e-commerce integration | Low (post-launch) | High |

---

## Strengths Worth Preserving

Despite the gaps above, the platform has significant genuine strengths:

- **Core consumer journey** is complete and polished: QR scan → age gate → branded DPP page → activations → analytics tracking
- **Admin suite** covers the full content lifecycle: bulk Excel import → AI PDF extraction → per-language translations → image management → activation campaigns → analytics
- **Role-based access control** is well-architected with `app_role` enum, `user_roles` table, and `has_role`/`has_any_role` SECURITY DEFINER functions
- **Security hardening** has been applied in two passes (April + May 2026): column-level grants, SECURITY DEFINER with fixed `search_path`, restricted RPCs, `maybe_assign_admin` revoked
- **Collaboration feature** is genuinely differentiated for DPP use cases
- **Tech sheet AI extraction** pipeline is sophisticated: client-side pdfjs parsing → position-aware table detection → AI JSON extraction → admin review → structured DB write
- **Analytics model** is commercially relevant: section heatmap, language segmentation, CTA conversion, lead funnel
- **Component architecture** is clean after the tab-split refactor: 14 focused components, shared constants, reusable hooks

---

*Report generated 2026-05-26 by 14-agent parallel audit. Each specialist agent read the full codebase in its domain and produced independent findings. Scores are domain-specific, not overall quality scores.*
