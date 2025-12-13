# KisanSetu Project Structure

This document explains the codebase organization for the React Frontend.

## Root Directory
*   `index.html`: Main HTML entry point. Contains PWA setup and Tailwind CDN.
*   `index.tsx`: React Entry point. Mounts the app and sets up React Query.
*   `App.tsx`: Main Router file. Handles `Routes`, `PublicRoute`, and `ProtectedRoute` logic.
*   `types.ts`: **Source of Truth** for TypeScript interfaces (User, Order, Bid, Deal).
*   `manifest.json`: Web App Manifest for PWA installation.
*   `BACKEND_SPECS.md`: Detailed API and Database requirements for the Backend Team.

## /components
Reusable UI elements.
*   `Layout.tsx`: The persistent shell of the app. Contains:
    *   Top Navigation Bar (Logo, Desktop Links).
    *   Side Drawer (Mobile Menu).
    *   Bottom Navigation Bar (Mobile only, "App-like" feel).
*   `UI.tsx`: Atomic Design components.
    *   `Button`: Standardized buttons with loading states.
    *   `Card`: White rounded containers with shadow.
    *   `Input` / `Select`: Form elements with consistent styling.
    *   `Badge`: Status indicators (Green for Open, Red for Closed).

## /pages
Route-specific views.
*   `Landing.tsx`: Public home page ("Apni Fasal, Apni Keemat").
*   `Auth.tsx`: Combined Login/Register screen. Handles toggling between modes.
*   `Dashboard.tsx`: Main Hub.
    *   **Farmer View**: Shows active orders, sales stats.
    *   **Buyer View**: Shows active bids, purchases.
*   `PostOrder.tsx`: Multi-step form (Wizard) for Farmers to list crops.
*   `Marketplace.tsx`: Searchable list of crops with Filters.
*   `OrderDetails.tsx`: Single order view. Shows Bid History and "Accept Bid" action.
*   `DealDetails.tsx`: Post-transaction view. Shows Digital Contract and "Mark Delivered" action.
*   `Profile.tsx`: User profile, rating, and trust score.
*   `AdminDashboard.tsx`: Special route for Admin users to verify other users.

## /services
Data Layer.
*   `api.ts`:
    *   **Axios Instance**: Configured with Base URL and Interceptors.
    *   **Auth Service**: Login/Register/Logout logic.
    *   **Order Service**: CRUD for Orders.
    *   **Bid Service**: Bidding logic.
    *   **Deal Service**: Transaction management.
    *   **Admin Service**: User verification.

## Architecture Patterns
1.  **Mobile-First**: Tailwind classes like `md:hidden` or `grid-cols-1 md:grid-cols-3` ensure the app looks like a native mobile app on phones and a web dashboard on laptops.
2.  **React Query**: Used for server state. Handles caching, loading states, and refetching automatically.
3.  **JWT Auth**: Token is stored in `localStorage` and injected into every request via Axios interceptors in `api.ts`.
