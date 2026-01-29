# Project Status & Memory

## Project Overview
**Name**: Varamio ERP (Common ERP)
**Framework**: Next.js 16.1.6 (App Router)
**Language**: TypeScript
**Styling**: Tailwind CSS 4 (via `@tailwindcss/postcss`)
**Component Library**: Shadcn UI (Radix UI primitives)
**Backend/Auth**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
**Icons**: Lucide React
**Fonts**: Geist Sans and Geist Mono (Next.js default)

## Current Implementation State

### Authentication System ✅
- **Supabase Auth**: Fully configured with SSR support
  - `lib/supabase/client.ts`: Browser client using `createBrowserClient`
  - `lib/supabase/server.ts`: Server client with cookie handling using `createServerClient`
- **Routes**:
  - `/`: Landing page with `<LoginForm />` component
  - `/signup`: Signup page with `<SignupForm />` component
  - `/transactions`: Protected route (Main App Interface)
  - `/report`: Protected route
  - `/master/*`: Protected master data routes
- **Authentication Features**:
  - Email/password login (`app/login/actions.ts`)
  - Email/password signup (`app/signup/actions.ts`)
  - Form validation (email normalization, password matching, min 6 chars)
  - Session management with 2-session limit per user (database trigger)
  - Logout functionality (implemented in `nav-user.tsx`)
  - Route protection via `proxy.ts` (Next.js 16 standard)
- **Route Protection**:
  - `proxy.ts`: URL Proxy/Middleware that protects `/transactions`, `/report`, and `/master` routes (replaces generic `middleware.ts` in Next.js 16)
  - Redirects unauthenticated users from protected routes to `/`
  - Redirects authenticated users from `/` or `/login` to `/transactions`
  - Redirects `/login` to `/` (login form is on home page)

### Main Layout Structure ✅
- **Layout**: Sidebar layout using `DashboardWrapper` component (wraps `AppSidebar`)
- **Components**:
  - `DashboardWrapper`: Orchestrates Sidebar, Header, and Breadcrumbs
  - `AppSidebar`: Main navigation sidebar (collapsible, icon mode)
  - `NavMain`: Main menu items:
    - Transactions (`/transactions`)
    - Report (`/report`)
  - `NavProjects`: Master modules:
    - Payment Modes (`/master/payment-modes`)
    - Categories (`/master/categories`)
  - `NavUser`: User profile menu (bottom of sidebar)
    - *Dynamic: Accepts user data from `app/(main)/layout.tsx`*
    - Shows user name, email, avatar
    - Logout functionality implemented
  - `TeamSwitcher`: Dropdown to switch teams
    - *Current state: Hardcoded "ERP" team by Varamio*
  - `HeaderActions`: Custom actions component in the header
  - `ModeToggle`: Dark/Light theme switcher
  - `Breadcrumb`: Dynamic breadcrumb navigation (`DynamicBreadcrumbs` component)

### Master Module ✅
- **Payment Modes**:
  - Route: `/master/payment-modes`
  - Features: 
    - Advanced Data Table with Sorting and Searching
    - Status Management (Active/Inactive toggle)
    - Add, Edit, Delete with "In Use" protection
    - Optimized UI with consistent alignment (Name Left, Status Center, Actions Right)
    - **Schema Update**: Added `status` column (default: 'active')
- **Categories**:
  - Route: `/master/categories`
  - Component: `components/categories/category-list.tsx`
  - Features:
    - Mirrored design of Payment Modes for consistency
    - Full Sort/Search capabilities
    - Status Lifecycle Management
    - Delete protection if used in transactions

### Transaction Module ✅
- **Route**: `/transactions` (Main Entry)
- **Database**: 
  - `transactions` table created
  - Linked to Categories/Payment Modes with `ON DELETE CASCADE`
  - RLS Policies enabled
- **UI Components**:
  - `TransactionForm` (`components/transaction/transaction-form.tsx`): Horizontal layout, date picker, search-enabled dropdowns (Select), validation.
  - `TransactionList` (`components/transaction/transaction-list.tsx`): Searchable table, delete with confirmation alert, income/expense color coding.

### UI Improvements ✅
- **Header**:
  - Removed border (`border-b`) for seamless look
  - **Shortcuts**: Added visual hints for Sidebar (`Ctrl+B`) and Theme (`Ctrl+Shift+L`)
  - **Styling**: 
    - Theme & User icons: White background in light mode, transparent in dark
    - Notification icon: Consistent styling with tooltip
    - User Avatar: Black initial in light mode, turns white on hover
- **Sidebar**:
  - Renamed "Category" to "Categories" in navigation
  - Shortcut support `Ctrl+B` with bottom tooltip
- **404 Page**:
  - Custom `not-found.tsx` with animation and "Back to Home" button.

### UI Components ✅
- **Shadcn UI Library** (`components/ui/`):
  - Button, Input, Card, Avatar, Badge
  - Sidebar, Dropdown Menu, Popover, Tooltip
  - Breadcrumb, Separator, Scroll Area, Sheet
  - Skeleton, Sonner (toast notifications)
  - Field, Label, Collapsible
  - Dialog, Table
- **Custom Components**:
  - `LoginForm`: Email/password login with password visibility toggle, Google OAuth button (not implemented)
  - `SignupForm`: Full name, email, password, confirm password with validation
  - `ThemeProvider`: Dark/light mode support via `next-themes`
  - All components follow responsive design patterns

### Database & Migrations ✅
- **Supabase Migration**:
  - `supabase/migrations/20260108_limit_user_sessions.sql`
  - Enforces maximum 2 active sessions per user via database trigger
  - Trigger: `on_session_created` on `auth.sessions` table
  - Function: `handle_new_session()` automatically deletes oldest sessions
- **Database Schema**:
  - `transactions`, `categories`, `payment_modes` tables implemented

## File Structure Details

### `app/`
- `layout.tsx`: Root layout with `ThemeProvider`, `Toaster` (sonner), and font configuration
- `page.tsx`: Home entry point, shows Login form with "Varamio Technologies" branding
- `not-found.tsx`: Custom 404 error page
- `login/actions.ts`: Server action for login (`login`, `signout`)
- `signup/actions.ts`: Server action for signup with validation
- `signup/page.tsx`: Signup page with "Varamio Technologies" branding

### `app/(main)/` (Main App Group)
- `layout.tsx`: Main app layout using `DashboardWrapper`
- `transactions/page.tsx`: Transactions page
  - Renders `TransactionList` component
- `report/page.tsx`: Reports page (Placeholder)
- `master/`
  - `payment-modes/page.tsx`: Payment Modes management page
  - `categories/page.tsx`: Categories management page

### `components/`
- **Layout Components**:
  - `dashboard-wrapper.tsx`: Wrapper for Sidebar + Header layout
  - `app-sidebar.tsx`: Main sidebar with transactions and report navigation
  - `nav-main.tsx`: Main navigation menu renderer
  - `nav-projects.tsx`: Master data list renderer
  - `nav-user.tsx`: User profile menu with logout
  - `team-switcher.tsx`: Team selection dropdown
  - `header-actions.tsx`: Header action buttons
  - `mode-toggle.tsx`: Theme switcher
  - `theme-provider.tsx`: Theme context provider
  - `dynamic-breadcrumbs.tsx`: Breadcrumb component
- **Feature Components**:
  - `login-form.tsx`: Login form
  - `signup-form.tsx`: Signup form
  - `transaction/`:
    - `transaction-form.tsx`: Form for adding transactions
    - `transaction-list.tsx`: List view of transactions
  - `categories/category-list.tsx`: Categories CRUD component
  - `payment-modes/payment-mode-list.tsx`: Payment modes CRUD component
- **UI Library** (`components/ui/`): Complete Shadcn component set

### `lib/`
- `supabase/client.ts`: Browser client initialization
- `supabase/server.ts`: Server client initialization with cookie handling
- `utils.ts`: Utility functions (includes `cn` for className merging)

### Root Files
- `proxy.ts`: Route protection (Next.js 16 standard replacement for middleware.ts)
- `next.config.ts`: Next.js configuration (minimal)
- `tsconfig.json`: TypeScript configuration
- `package.json`: Dependencies and scripts
- `components.json`: Shadcn UI configuration

### `.agent/rules/`
- `file-structure.md`: Project structure documentation
- `style-guide.md`: Coding standards
  - `cursor-pointer` for all actionable triggers
  - Responsiveness mandate for all UI
- `supabase-info.md`: Supabase MCP server reference

## Implementation Details

### Authentication Flow
1. User visits `/` → sees LoginForm
2. User submits login → `app/login/actions.ts` → Supabase auth
3. On success → redirects to `/transactions`
4. `proxy.ts` checks auth on every request
5. User is redirected to `/transactions` if authenticated

### Signup Flow
1. User visits `/signup` → sees SignupForm
2. User submits → `app/signup/actions.ts` → validation → Supabase signup
3. On success → shows success toast → redirects to `/`
4. Email verification required (handled by Supabase)

### Session Management
- Database trigger automatically limits to 2 active sessions per user
- Oldest sessions are deleted when new session is created
- Implemented in `supabase/migrations/20260108_limit_user_sessions.sql`

## TODO / Next Steps

### High Priority
1. **Dynamic Navigation**: Centralize navigation logic
2. **Report Module**: Implement `app/(main)/report/page.tsx` content
3. **Google OAuth**: Implement Google OAuth login (buttons exist but not functional)

### Medium Priority
4. **Profile Management**: Connect `NavUser` menu items (Account, Billing, Notifications) to real functionality
5. **Team Management**: Make `TeamSwitcher` functional with real team data
6. **Form Improvements**: Add "Forgot password" functionality

### Low Priority
7. **Error Handling**: Enhance error messages and handling
8. **Loading States**: Add more loading states and skeletons
9. **Accessibility**: Audit and improve accessibility features

## Important Notes

### Coding Standards
- **Cursor Standard**: `cursor-pointer` MUST be applied to all actionable triggers (buttons, links, interactive elements) per style guide
- **Responsiveness Mandate**: All new UI MUST be fully responsive across Mobile, Tablet, Desktop using Tailwind responsive prefixes
- **TypeScript**: Strict typing throughout the project

### Technical Details
- **Supabase MCP**: Connected to Supabase MCP server (reference in `.agent/rules/supabase-info.md`)
- **Next.js DevTools**: DevTools MCP is initialized
- **React Version**: React 19.2.4
- **Next.js Version**: 16.1.6 (App Router)

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key

## Current Limitations

1. **Navigation Data**: All navigation items are hardcoded sample data
2. **Report Content**: No real content, only placeholders
3. **OAuth**: Google OAuth buttons exist but not implemented
4. **User Profile**: Profile menu items are placeholders (Account, Billing, etc.)
