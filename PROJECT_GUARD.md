# Project Guard Architectural Blueprint & Source of Truth

This document serves as the official source of truth and architectural guard rails for the **Symar Lite** multi-tenant digital catalog platform. 

All future modifications, refactorings, or feature implementations **must** adhere strictly to the guidelines and configurations described herein.

---

## 1. Folder Structure

The project follows a standard Next.js (App Router) structure. Code is isolated cleanly between application routing (`/src/app`), reusable UI blocks (`/src/components`), database repositories, and shared interfaces:

```
symar/
├── src/
│   ├── app/                    # Routing & Next.js Page Segments
│   │   ├── (auth)/             # Login, Signup, Reset Password, Verification
│   │   ├── (dashboard)/        # Merchant Workspace, Store Setup
│   │   ├── admin/              # Global Admin Console (User, Store, Plan, Template)
│   │   ├── demo/               # Public Showcase Redirects
│   │   ├── store/              # Multi-tenant custom storefront renderer
│   │   ├── layout.tsx          # Global CSS, Font Providers, & Hydration
│   │   └── page.tsx            # Marketing Landing Page
│   │
│   ├── components/             # Component Inventory
│   │   ├── admin/              # Admin layouts and table modules
│   │   ├── appearance/         # Visual appearance editor controls
│   │   ├── dashboard/          # Merchant metrics, grids, user menus
│   │   ├── landing/            # Landing page layout, Hero, Navbar, mockups
│   │   ├── storefront/         # Product grids, category listings, checkout actions
│   │   ├── ui/                 # Reusable primitives (Buttons, Inputs, Badges)
│   │   └── providers/          # Theme & dev auth system state providers
│   │
│   ├── config/                 # Static environment flags
│   ├── context/                # Authentication State Provider
│   ├── hooks/                  # Global hooks (use-toast, client-hooks)
│   ├── lib/                    # Logic, Services & Repositories
│   │   ├── actions/            # Server actions (Auth, Store, Theme presets)
│   │   ├── repositories/       # In-memory and Supabase storefront retrieval
│   │   ├── services/           # Role verification, billing rules
│   │   └── supabase/           # Server/Client supabase bindings
│   │
│   └── types/                  # TypeScript contract declarations
```

---

## 2. Route Map

The application supports the following explicit routes:

| Route Path | Type | Access Level | Description |
|---|---|---|---|
| `/` | Page | Public | Premium Marketing Landing Page |
| `/login` | Page | Public | Merchant/Admin Authentication Portal |
| `/signup` | Page | Public | Merchant Registration Screen |
| `/choose-template` | Page | Protected | Theme Preset Selector (after registration) |
| `/create-store` | Page | Protected | 4-step Store Setup Wizard |
| `/dashboard` | Page | Protected | Merchant Dashboard Overview |
| `/dashboard/products` | Page | Protected | Catalog Product Inventory |
| `/dashboard/categories` | Page | Protected | Catalog Product Category Management |
| `/dashboard/collections` | Page | Protected | Catalog Product Group/Filter Management |
| `/dashboard/appearance` | Page | Protected | Storefront Visual Appearance Customizer |
| `/dashboard/themes` | Page | Protected | Theme Selection Screen |
| `/dashboard/creative` | Page | Protected | Creative Services Banner Order Dashboard |
| `/dashboard/orders` | Page | Protected | Customer Storefront Purchase Orders |
| `/dashboard/analytics` | Page | Protected | Store Traffic & Referral Statistics |
| `/dashboard/settings` | Page | Protected | General Store Configurations |
| `/dashboard/billing` | Page | Protected | Billing & Plan Subscriptions |
| `/dashboard/support` | Page | Protected | Support Helpdesk Ticketing |
| `/admin` | Page | Protected | Super Admin User/Store Management Overview |
| `/demo` | Page | Public | Live Showcase Demo of Craft Store Classic |
| `/store/[slug]` | Page | Public | Branded customer storefront renderer |

---

## 3. Design System

The visual design language is customized for a sleek, high-end dark mode aesthetic (Apple/Linear-inspired) with signature maroon details.

### Colors (Tailwind Tokens)
- **Background:** `#080808` (Dark Charcoal)
- **Surface Default:** `#111111` / **Elevated Card Surface:** `#151515`
- **Maroon Accent:** `#800020` (Signature Primary Accent)
- **Maroon Hover:** `#9B1B30` (Primary Accent Hover State)
- **Text Primary:** `#FFFFFF` (White)
- **Text Secondary:** `#A1A1AA` (Muted Zinc)
- **Borders:** `rgba(255, 255, 255, 0.06)`

### Typography
- **Heading Font:** `Plus Jakarta Sans` (Sans-serif with high tracking-tight)
- **Body Font:** `Inter` (Optimized readability)

### Shadows & Glows
- **Accent Glow (`shadow-glow`):** `0 0 25px -5px rgba(128, 0, 32, 0.3)`
- **Glass Panel:** Acrylic backdrop filters combined with thin alpha white borders.

---

## 4. Database Schema

For persistence, the architecture uses Supabase PostgreSQL. Below are the key tables defined inside `supabase/migrations`:

- **`profiles`:** Stores merchant names, account status, and custom profile properties.
- **`stores`:** Multi-tenant core store details including unique `slug` (unique constraint), `theme_id`, WhatsApp numbers, and branding colors.
- **`categories`:** Hierarchy listings for product tags.
- **`products`:** Catalog items linked to a `store_id` including pricing, stock, comparisons, and image references.
- **`subscriptions`:** Tracks plan level (`starter`, `pro`, `business`) and payment status per store.
- **`activity_logs`:** Logging records for audit trials.

---

## 5. Component Inventory

Key UI elements are isolated inside `/src/components`:

- **Landing UI (`/landing`):** `LandingPage`, `LandingNavbar` (marketing navigation).
- **Merchant Shell (`/layout`):** 
  - `Sidebar`: Dynamic merchant navigation, supports collapse mode, features subscription indicators, and handles team tenant switcher.
  - `Navbar`: Breadcrumb path rendering, quick creation selector dropdown, and search.
  - `DashboardLayout`: Wraps children with sidebar and navbar components.
- **Storefront Rendering (`/storefront`):**
  - `StoreRenderer`: Master component which organizes homepage sections dynamically matching appearance configurations.
  - `ProductGrid` & `StoreProductCard`: Visual listings with WhatsApp checkout and Quick View Modals.
  - `templates/bloom`: Signature Craft Store Classic template system.

---

## 6. Repository Interfaces

Storefront catalog fetching is isolated into repository contracts under `/src/lib/repositories`:

- **`StorefrontRepository`:** Contract interface defining:
  - `getStoreBySlug(slug: string)`: Fetches configuration, categories, and products for a merchant's custom site.
  - Intercepts demo store slug (`demo`, `demo-craft-classic`) to inject rich static data directly from `src/lib/demo-data.ts` if database entries are missing, ensuring live demos always compile and run cleanly without 404s.

---

## 7. Environment Variables

Key runtime environment configurations:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Root domain mapping for tenant routing resolution
NEXT_PUBLIC_ROOT_DOMAIN=platform.com

# Admin emails configured (comma separated fallback)
ADMIN_EMAILS=admin@symar.com,owner@platform.com
```

---

## 8. Middleware Behavior

Next.js `middleware.ts` acts as the master gateway coordinator:
1. **Public Routes:** Allows unauthenticated routing access to `/`, `/login`, `/signup`, `/demo`, `/store/*`, `/callback`, `/verify-email`, and `/api/public`.
2. **Auth Enforcement:** Redirects unauthenticated sessions targeting `/dashboard/*` or `/admin/*` directly back to `/login`.
3. **Subdomain Rewrites:** Resolves hostname requests (e.g. `brand-slug.platform.com`) and silently rewrites requests internally to `/store/brand-slug` to mask custom subdomains.

---

## 9. Authentication Flow

Supported in two modes:

### Temporary Development Mode (Bypass)
- Suppressed when Supabase URL environment variables are absent.
- Users login/signup in simulated states backed by `localStorage` (`symar_user`, `symar_stores`, `symar_active_store`).
- Checks if login email matches configured admin email list (`admin@symar.com`, etc.) to trigger `/admin` redirect; otherwise, directs merchants to `/dashboard`.

### Supabase Production Auth (Future State Ready)
- Extends Next.js Server Actions (`signInWithEmailAction`, `signUpWithEmailAction`) using `@supabase/ssr` to authenticate sessions via PostgreSQL authentication layers.

---

## 10. Theme Engine

Customer storefront visual rendering is managed by theme presets:
- **Presets:** `luxury` (Oud theme), `minimal` (monochrome spacing), `fashion` (vibrant apparel grids), `dark` (deep maroon accents).
- Configured colors (primary/secondary) and typography are compiled as CSS custom properties on page load inside `StoreRenderer` to dynamically paint customer catalogs without compilation restarts.

---

## 11. Feature Gating

Limits workspace tools based on active merchant plans:
- **Starter Plan:** Up to 50 products, standard checkout.
- **Pro Plan:** Up to 500 products, collections, analytics tracking, premium themes.
- **Business Plan:** Up to 5,000 products, Razorpay payment gateway integration, shipping automation, order metrics console.
- Verification logic is centralized inside `src/lib/feature-gating.ts`.

---

## 12. Admin Flow

A unified login page checks for admin privileges:
1. Merchant/Admin enters details on `/login`.
2. If `isAdminUser(email)` returns `true`:
   - Session redirects instantly to `/admin`.
   - Accesses dashboard statistics, manages global stores, alters templates, and impersonates merchants for support settings.

---

## Guard Rails for Development

- **Read Before Modifying:** Always read this blueprint before writing new feature integrations.
- **Maintain UI Identity:** Never redesign completed user interfaces unless explicitly requested.
- **Preserve Active Architecture:** Keep current route structures, in-memory repository contracts, and database configurations functional. Always explain structural changes beforehand.
