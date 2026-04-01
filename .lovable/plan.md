

# Collaboration Mode for Client Brand Events

## Overview

Add a "Collaboration Mode" to the admin panel where Classy manages custom drinks produced for client brands (e.g., Adidas events). Collaboration products live in a separate workspace with their own dashboard, and the consumer page adapts to show the client brand's identity alongside Classy's.

## Data Model

**New table: `collaborations`**
- `id` uuid PK
- `brand_name` text (e.g. "Adidas")
- `brand_slug` text unique (e.g. "adidas")
- `brand_logo_url` text nullable
- `brand_color` text (hex, used for accent theming on consumer page)
- `contact_name`, `contact_email` text nullable
- `event_name` text nullable (e.g. "Adidas Summer Run 2026")
- `event_date` date nullable
- `status` text default 'active' (active / archived)
- `created_at` timestamptz

**Modify `products` table** — add two nullable columns:
- `collaboration_id` uuid nullable (FK to collaborations.id)
- `is_collaboration` boolean default false

This lets all existing queries keep working (collaboration products are just products with `is_collaboration = true`). The consumer page, layout system, pairings, tech data — everything works unchanged.

## Admin Routes

| Route | Purpose |
|---|---|
| `/admin/collaborations` | Collaboration dashboard — list of client brands + their drinks |
| `/admin/collaborations/:brandSlug` | Single collaboration detail — shows that client's products grid |
| `/admin/product/:slug` | Existing editor — works for both standard and collab products |

A top-level mode switcher in the admin header toggles between "Brand Products" and "Collaborations". Both modes share the same product editor; only the dashboard view and product creation flow differ.

## Admin UI Changes

### 1. Header Mode Switcher
Add two pill buttons in the dashboard header: **"Brand"** (default) and **"Collabs"**. Clicking Collabs navigates to `/admin/collaborations`.

### 2. Collaborations Dashboard (`/admin/collaborations`)
- Same visual style as the main dashboard
- Header: "Collaborations" title + "＋ New Collaboration" button
- Grid of collaboration cards showing: client logo/name, event name, product count, status badge
- Click a card → `/admin/collaborations/:brandSlug`

### 3. Collaboration Detail Page (`/admin/collaborations/:brandSlug`)
- Header with client brand logo + name + event info
- Settings section: edit brand name, logo, color, event details, contact info
- Product grid: only products where `collaboration_id` matches
- "＋ New Collab Product" button — opens the same new product modal but pre-sets `collaboration_id` and `is_collaboration = true`, and offers a "Collab" product line option

### 4. Product Editor — Collab Awareness
When editing a collaboration product, show a small banner at the top: "Collaboration: Adidas · Summer Run 2026" with the client's accent color. No other editor changes needed — all tabs work the same.

### 5. Consumer Page — Co-branding
When a collaboration product is loaded on `/bottle/:slug`:
- Fetch the linked collaboration record
- Show the client brand logo alongside the Classy logo in the hero
- Apply the client's `brand_color` as an accent override (e.g., hero gradient tint)
- Optionally show "Created exclusively for [Brand] × Classy Cocktails" in the footer

## Implementation Steps

1. **Migration**: Create `collaborations` table + add `collaboration_id` and `is_collaboration` columns to `products` with RLS policies (public read, authenticated write)
2. **Collaborations Dashboard page** (`/admin/collaborations`) — list collaborations, create new ones
3. **Collaboration Detail page** (`/admin/collaborations/:brandSlug`) — edit collab settings + show its products
4. **Update Dashboard header** — add Brand / Collabs mode switcher pills
5. **Update New Product modal** — when created from a collab context, set `collaboration_id` and `is_collaboration`
6. **Update `useProducts` hook** — add a `useCollabProducts(collaborationId)` variant that filters by collaboration
7. **Update product editor** — show collab banner when product has `collaboration_id`
8. **Update consumer BottlePage** — fetch collaboration data and render co-branding (logo, accent color, footer line)
9. **Add routes** to `App.tsx` for `/admin/collaborations` and `/admin/collaborations/:brandSlug`

## Files to Create
- `src/pages/AdminCollaborations.tsx` — collaborations dashboard
- `src/pages/AdminCollaborationDetail.tsx` — single collaboration view
- Migration SQL for `collaborations` table + `products` column additions

## Files to Modify
- `src/App.tsx` — add routes
- `src/pages/AdminDashboard.tsx` — add mode switcher in header
- `src/pages/AdminProductDetail.tsx` — show collab banner
- `src/pages/BottlePage.tsx` — co-branding rendering
- `src/hooks/useProduct.ts` — add collaboration hooks
- `src/components/consumer/BottleHero.tsx` — show client logo
- `src/components/consumer/BottleFooter.tsx` — show co-brand line

