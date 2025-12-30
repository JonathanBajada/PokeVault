# 🎮 PlayVault - Frontend

**PlayVault** frontend is a Next.js application providing a beautiful and responsive interface for browsing and searching trading cards.

## 🛠️ Tech Stack

-  **Next.js 16** - React framework with App Router
-  **TypeScript** - Type-safe development
-  **Tailwind CSS 4** - Utility-first CSS framework
-  **React Query (TanStack Query)** - Data fetching and caching
-  **React 19** - Latest React features

## 🚀 Getting Started

### Prerequisites

-  Node.js (v18 or higher)
-  Backend server running on `http://localhost:4000`

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

-  `npm run dev` - Start Next.js development server
-  `npm run build` - Build for production
-  `npm run start` - Start production server
-  `npm run lint` - Run ESLint
-  `npm run typecheck` - Type check TypeScript files

## 🎨 Features

### Pages

-  **Home** (`/`) - Landing page
-  **Cards** (`/cards`) - Browse and search cards
-  **Search** (`/search`) - Advanced search page

### Components

-  **Card** - Individual card display component
-  **CardModal** - Expanded card view modal
-  **Navbar** - Navigation bar with login button

### Key Features

-  Responsive grid layout for cards
-  Real-time search with debouncing
-  Set filtering dropdown
-  Pagination with page navigation
-  Card modal for expanded view
-  Dark mode support
-  Mobile-responsive design

## 📁 Project Structure

```
web/
├── app/                 # Next.js App Router
│   ├── cards/          # Cards page
│   ├── search/         # Search page
│   ├── layout.tsx      # Root layout
│   └── provider.tsx    # React Query provider
├── components/         # React components
│   ├── Card.tsx
│   ├── CardModal.tsx
│   └── Navbar.tsx
├── lib/                # Utilities
│   └── api/            # API clients
│       └── cards.ts
└── public/             # Static assets
```

## 🎨 Styling

The application uses Tailwind CSS 4 with:

-  Custom color scheme (indigo/purple gradient)
-  Dark mode support
-  Responsive breakpoints
-  Smooth animations and transitions

## 🔌 API Integration

The frontend communicates with the backend API at `http://localhost:4000`:

-  `GET /cards` - Fetch paginated cards
-  `GET /cards/sets` - Fetch all unique sets

## 🚀 Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm run build
```

For more deployment options, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
