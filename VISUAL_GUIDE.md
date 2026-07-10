# WeSite - Visual Reference & Quick Reference

## 📊 Project Overview at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      WeSite v0.1.0                           │
│    Finder-style Website Bookmark & Organizer               │
└─────────────────────────────────────────────────────────────┘

STATUS: ✅ COMPLETE & FULLY FUNCTIONAL

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Frontend     │ Backend      │ Database     │ DevOps       │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ React 19     │ Next.js 16   │ MongoDB 5.0+ │ TypeScript   │
│ TypeScript   │ Node.js      │ Mongoose 9   │ ESLint       │
│ TailwindCSS  │ 34 APIs      │ 5 Models     │ PostCSS      │
│ Recharts     │ 15+ Routes   │ 15+ Indexes  │              │
│ Sonner       │ JWT Auth     │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 🗺️ User Journey

```
USER
  │
  ├─→ [Register] → [Login] → [Home Page]
  │                              │
  │     ┌─────────────────────┬──┴──┬─────────────────┐
  │     ↓                     ↓     ↓                 ↓
  │  [Add Website]    [Create Folder] [Search] [Cmd+K Palette]
  │     │                     │           │             │
  │     ├─→ [Auto Metadata]   │           │             └─→ [Navigate]
  │     │   (scrape favicon)  │           │
  │     └─→ [Move to Folder]  └─→ [Drag Website]
  │
  ├─→ [Analytics]    → [Charts] [Stats] [Heatmap]
  │     │
  │     └─→ [Visit Tracking] → Auto-recorded on website access
  │
  ├─→ [Todo]         → [Create Task] [Assign to Website] [Mark Done]
  │
  ├─→ [History]      → [All Visits] [Timestamps]
  │
  └─→ [Settings]     → [Profile] [Theme] [Logout]
```

---

## 🔄 Data Flow

```
┌────────────┐
│  Browser   │
│ (React UI) │
└─────┬──────┘
      │
      │ HTTP Requests
      │ (Fetch API)
      ↓
┌────────────────────────────────────────────┐
│      Next.js Server (API Routes)           │
│  ┌──────────────────────────────────────┐  │
│  │ 1. Check JWT Token (requireUser)     │  │
│  │ 2. Validate Input (Zod)              │  │
│  │ 3. Process Request                   │  │
│  │ 4. Database Query (Mongoose)         │  │
│  │ 5. Return JSON Response              │  │
│  └──────────────────────────────────────┘  │
└─────┬──────────────────────────────────────┘
      │
      │ Database Queries
      │ (Mongoose ODM)
      ↓
┌────────────────────────────────────────────┐
│          MongoDB Database                   │
│  ┌──────────────────────────────────────┐  │
│  │ Collections:                         │  │
│  │ • users (auth, profiles)            │  │
│  │ • websites (bookmarks, metadata)    │  │
│  │ • folders (hierarchy)               │  │
│  │ • todos (tasks)                     │  │
│  │ • visits (tracking)                 │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## 🎯 Feature Map

```
WeSite Features
│
├─ 🔐 AUTHENTICATION
│  ├─ Register (email/password)
│  ├─ Login (JWT token)
│  ├─ Logout
│  ├─ Forgot Password
│  ├─ Reset Password
│  └─ Profile Management
│
├─ 📌 WEBSITES (Bookmarks)
│  ├─ Add Website
│  ├─ Auto-scrape Metadata (title, favicon, description)
│  ├─ Edit Website
│  ├─ Delete (soft - can restore)
│  ├─ Restore from Trash
│  ├─ Favorite/Unfavorite
│  ├─ Tag & Notes
│  ├─ Export as JSON
│  └─ Import from JSON
│
├─ 📁 FOLDERS
│  ├─ Create Folder
│  ├─ Nested Hierarchy
│  ├─ Custom Color & Icon
│  ├─ Drag-to-Folder Website Move
│  ├─ Edit Folder
│  └─ Delete Folder
│
├─ ✅ TODOS
│  ├─ Create Task
│  ├─ Assign to Website (optional)
│  ├─ Set Due Date
│  ├─ Mark Complete/Incomplete
│  ├─ Delete Task
│  ├─ Filter (Open, Completed, All)
│  └─ Search Tasks
│
├─ 📊 ANALYTICS
│  ├─ Summary Stats (total websites, folders, visits)
│  ├─ Visit Trends (30-day line chart)
│  ├─ Top Websites (bar chart)
│  ├─ Folder Distribution (pie chart)
│  ├─ Daily Activity Heatmap
│  └─ Favorite Websites Count
│
├─ 🔍 SEARCH & NAVIGATION
│  ├─ Global Search (all fields)
│  ├─ Command Palette (Cmd+K)
│  ├─ Filter by Folder
│  ├─ Filter by Tag
│  ├─ Sort Options (recent, visited, loved)
│  └─ Browse History
│
└─ 🌙 PERSONALIZATION
   ├─ Light Mode
   ├─ Dark Mode
   ├─ System Preference Detection
   ├─ Avatar Upload
   ├─ Profile Name & Email
   └─ Theme Preference Saved
```

---

## 📁 Route Map

```
/                    → Home Page (WesiteApp - main interface)
/login               → Login Form
/register            → Registration Form
/analytics           → Analytics Dashboard
/history             → Browse History
/todo                → Todo Management
/settings            → User Settings & Profile

API Routes (/api):

  /auth/
    POST    /login               → Authenticate user
    POST    /register            → Create account
    POST    /logout              → Clear session
    GET     /me                  → Get current user
    PATCH   /me                  → Update profile
    POST    /forgot-password     → Send reset email
    POST    /reset-password      → Complete reset

  /websites/
    GET     /                    → List websites
    POST    /                    → Create website
    GET     /:id                 → Get one website
    PATCH   /:id                 → Update website
    DELETE  /:id                 → Soft delete
    PATCH   /:id/restore         → Restore from trash
    DELETE  /:id/permanent       → Permanently delete
    POST    /:id/visit           → Record visit
    GET     /export              → Export JSON
    POST    /import              → Import JSON

  /folders/
    GET     /                    → List folders
    POST    /                    → Create folder
    PATCH   /:id                 → Update folder
    DELETE  /:id                 → Delete folder

  /todos/
    GET     /                    → List todos
    POST    /                    → Create todo
    PATCH   /:id                 → Update todo
    DELETE  /:id                 → Delete todo

  /history/
    GET     /                    → List all visits
    GET     /:id                 → Get visit details

  /analytics/
    GET     /summary             → Overall stats
    GET     /top-websites        → Top 10 websites
    GET     /visits-over-time    → 30-day trends
    GET     /heatmap             → Activity heatmap
    GET     /folder-distribution → Folder stats

  /metadata/
    POST    /fetch               → Scrape URL metadata
```

---

## 💾 Database Schema

```
User Collection
├── _id: ObjectId (primary key)
├── name: String
├── email: String (unique)
├── passwordHash: String (bcrypt)
├── avatarUrl: String
├── resetTokenHash: String (nullable)
├── resetTokenExpiresAt: Date (nullable)
├── themePreference: 'light' | 'dark' | 'system'
└── timestamps: { createdAt, updatedAt }

Website Collection
├── _id: ObjectId
├── userId: ObjectId (ref: User) [indexed]
├── folderId: ObjectId (ref: Folder)
├── url: String
├── normalizedUrl: String (for dedup)
├── domain: String
├── title: String (scraped)
├── description: String (scraped)
├── faviconUrl: String (scraped)
├── ogImageUrl: String (scraped)
├── tags: [String]
├── notes: String
├── customIconUrl: String
├── isFavorite: Boolean
├── isTrashed: Boolean (soft delete)
├── trashedAt: Date
├── visitCount: Number
├── firstVisitedAt: Date
├── lastVisitedAt: Date
└── timestamps: { createdAt, updatedAt }

Folder Collection
├── _id: ObjectId
├── userId: ObjectId (ref: User) [indexed]
├── name: String
├── parentFolderId: ObjectId (nullable, for nesting)
├── color: String
├── icon: String
├── order: Number (sort order)
└── timestamps: { createdAt, updatedAt }

Todo Collection
├── _id: ObjectId
├── userId: ObjectId (ref: User) [indexed]
├── websiteId: ObjectId (ref: Website, nullable)
├── title: String
├── notes: String
├── dueAt: Date (nullable)
├── completedAt: Date (nullable, null = open)
└── timestamps: { createdAt, updatedAt }

Visit Collection
├── _id: ObjectId
├── userId: ObjectId (ref: User) [indexed]
├── websiteId: ObjectId (ref: Website) [indexed]
├── visitedAt: Date
└── (no timestamps for lightweight tracking)
```

---

## 🔐 Security Architecture

```
Request comes in
    ↓
[HTTP-only Cookie with JWT]
    ↓
[Verify Token Signature]
    ↓
[Token Still Valid? (30-day expiration)]
    ↓
[Extract user ID from JWT]
    ↓
[Load user from database]
    ↓
[User available in route handler]
    ↓
[Validate input with Zod schema]
    ↓
[Filter database queries by userId]
    ↓
[Return serialized response (no passwords/tokens)]
```

---

## 🎯 Component Hierarchy

```
RootLayout
├── ThemeProvider
├── Global Styles & CSS Variables
└── Toaster (Sonner notifications)
    │
    └── Pages (route specific)
        │
        ├── /page.tsx (Home)
        │   └── WesiteApp
        │       ├── Navbar
        │       │   └── Search, Add Website, View Toggle, Menu
        │       ├── MacSidebar
        │       │   └── Folder Tree
        │       ├── Main Grid
        │       │   ├── FolderCard
        │       │   └── WebsiteCard
        │       ├── CommandPalette (Cmd+K)
        │       ├── AddWebsiteModal
        │       └── FolderModal
        │
        ├── /analytics/page.tsx
        │   ├── Summary Cards
        │   ├── VisitsLineChart
        │   ├── TopWebsitesBarChart
        │   ├── FolderDistributionPieChart
        │   └── ActivityHeatmap
        │
        ├── /history/page.tsx
        │   └── Visit History List
        │
        ├── /todo/page.tsx
        │   ├── Todo Form
        │   └── Todo List (Open/Completed)
        │
        └── /settings/page.tsx
            ├── Profile Form
            ├── Theme Toggle
            └── Logout Button
```

---

## 🚀 Development Workflow

```
1. SETUP
   npm install
   npm run seed
   npm run dev
   → Visit http://localhost:3000

2. DEVELOPMENT
   Edit .tsx/.ts files
   → Hot reload auto-updates
   → Check console for errors
   → Use browser DevTools

3. TYPE CHECKING
   npm run build
   → Verifies TypeScript
   → Checks for errors

4. LINTING
   npm run lint
   → Checks code style
   → ESLint rules

5. TESTING
   Manual: Browser testing
   → Login, add website, create folder
   → Use DevTools Network tab
   → Check API responses

6. PRODUCTION
   npm run build
   npm start
   → Ready for deployment
```

---

## 📊 Performance Metrics

```
Database:
  • 15+ indexes for fast queries
  • Connection pooling (reused per request)
  • Lean queries for read-only data
  • Aggregation pipelines for analytics

Frontend:
  • React component memoization
  • Debounced search input
  • Lazy modal loading
  • CSS-in-JS with TailwindCSS

API:
  • Pagination support (max 100 per page)
  • Query optimization
  • Response serialization
  • Error boundary handling

Build:
  • TypeScript compilation
  • Code splitting
  • CSS minification
  • Tree shaking
```

---

## 🛠️ Tech Stack Summary

```
Frontend Layer
├── React 19 (UI framework)
├── TypeScript (type safety)
├── TailwindCSS 4 (styling)
├── Recharts (charting)
├── Lucide React (icons)
└── Sonner (notifications)

Backend Layer
├── Next.js 16 (framework)
├── Node.js (runtime)
├── Mongoose 9 (MongoDB ODM)
├── Zod (validation)
├── JWT (authentication)
├── Bcrypt (hashing)
└── Cheerio (HTML parsing)

Data Layer
├── MongoDB 5.0+ (database)
├── Atlas or Local (hosting options)
└── Mongoose Models (schema)

DevOps
├── TypeScript (build)
├── ESLint (linting)
├── PostCSS (CSS)
├── Vercel (deployment)
└── Docker (optional)
```

---

## 📋 Essential Files Reference

```
KEY FILES TO KNOW:

Setup
  .env.local                          Environment variables
  
Configuration  
  next.config.ts                      Next.js config
  tsconfig.json                       TypeScript config
  tailwind.config.mjs                 TailwindCSS config
  
Database
  lib/db.ts                           MongoDB connection
  models/*.ts                         Schemas (5 files)
  
Authentication
  lib/auth.ts                         JWT, Bcrypt utilities
  app/api/auth/*.ts                   Auth routes
  
Core API
  app/api/websites/route.ts           Website CRUD
  app/api/folders/route.ts            Folder CRUD
  app/api/todos/route.ts              Todo CRUD
  app/api/analytics/*.ts              Analytics endpoints
  
Core Components
  components/WesiteApp.tsx            Main app
  components/MacSidebar.tsx           Folder tree
  components/modals/*.tsx             Add/Edit modals
  components/charts/*.tsx             Analytics charts
  
Pages
  app/page.tsx                        Home
  app/analytics/page.tsx              Analytics
  app/todo/page.tsx                   Todos
  app/settings/page.tsx               Settings
```

---

## ✅ Verification Quick Check

```bash
# 1. TypeScript ✅
npm run build
# Should complete without errors

# 2. Linting ✅
npm run lint
# Should pass all rules

# 3. Database ✅
npm run seed
# Should output: "Seeded Wesite demo account"

# 4. Server ✅
npm run dev
# Should output: "ready started server on 0.0.0.0:3000"

# 5. App ✅
Open http://localhost:3000
# Should load home page with login button

# 6. Login ✅
demo@wesite.local / password123
# Should log in successfully

# 7. Features ✅
- Add website → should scrape metadata
- Create folder → should appear in sidebar
- View analytics → should show charts
- Create todo → should save to database
```

---

## 🎓 Next Action

**Choose one:**

- 🚀 **Quick Start**: Go to [QUICKSTART.md](QUICKSTART.md)
- 📖 **Full Reference**: Go to [ARCHITECTURE.md](ARCHITECTURE.md)
- 🧠 **How to Extend**: Go to [DEVELOPER.md](DEVELOPER.md)
- 📋 **Documentation Index**: Go to [DOCS.md](DOCS.md)

---

Generated: 2026-07-10 | WeSite v0.1.0
