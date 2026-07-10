# Wesite

Wesite is a macOS Finder-style bookmark and website organizer built with Next.js App Router, TailwindCSS, MongoDB, and Mongoose.

## Stack

- Next.js 16 App Router and route handlers
- TailwindCSS 4
- MongoDB with Mongoose
- JWT auth with HTTP-only cookies
- Recharts, lucide-react, sonner

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

3. Set `MONGODB_URI` and `JWT_SECRET`.

4. Seed demo data:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

Demo login after seeding:

```text
demo@wesite.local
password123
```

## Features

- Email/password auth, profile updates, logout, and basic reset-token flow
- Folder tree with nested folders and drag-to-folder website moves
- Website CRUD, duplicate detection, soft trash, restore, export/import
- Server-side metadata scraping for title, description, favicon, Open Graph image
- Visit tracking, history list, and aggregate website stats
- Analytics dashboard with line, bar, donut, summary cards, and heatmap
- Global search and `Cmd/Ctrl+K` command palette
- Responsive Finder-style layout with mobile sidebar drawer

## Environment

```env
MONGODB_URI=mongodb://127.0.0.1:27017/wesite
JWT_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts

- `npm run dev` starts local development
- `npm run build` creates a production build
- `npm run lint` runs ESLint
- `npm run seed` creates a demo account and sample data
