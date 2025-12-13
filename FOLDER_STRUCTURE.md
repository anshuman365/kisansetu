# Project Folder Structure

This project follows a clean, feature-based and scalable architecture suitable for Next.js/React applications.

```
/
├── components/           # Reusable UI components
│   ├── Layout.tsx        # Main application shell (Header, Sidebar)
│   └── UI.tsx            # Atomic components (Button, Card, Input, Badge)
│
├── pages/                # Page components (Mapped to Routes)
│   ├── Auth.tsx          # Login & Registration Logic
│   ├── Dashboard.tsx     # User Dashboard (Role-based)
│   ├── Landing.tsx       # Public Landing Page
│   ├── Marketplace.tsx   # Order browsing & Bidding
│   └── PostOrder.tsx     # Order Creation Flow
│
├── services/             # API Integration & State Management
│   └── api.ts            # Axios setup, Mock endpoints (Auth, Orders, Bids)
│
├── types.ts              # TypeScript Interfaces & Enums (User, Order, etc.)
├── App.tsx               # Main Router & Route Guards
├── index.tsx             # Application Entry Point & Providers
└── metadata.json         # Application Configuration
```

## Key Architectural Decisions

1.  **Service Layer (`services/api.ts`)**: Separates data fetching logic from UI components. Uses Axios for HTTP requests.
2.  **Atomic Design (`components/UI.tsx`)**: tailored Tailwind components to ensure UI consistency.
3.  **Centralized Types (`types.ts`)**: Shared interfaces prevent type duplication and ensure data consistency across the app.
4.  **Route Guards (`App.tsx`)**: Higher-order components like `ProtectedRoute` handle authentication checks centrally.
