# WeSite - Full Architecture & Working Guide

**WeSite** is a modern bookmark and website organizer inspired by macOS Finder, built with **Next.js 16**, **MongoDB**, **Mongoose**, and **TailwindCSS**.

---

## 📋 Project Overview

WeSite helps users:
- ✅ Organize websites into nested folders
- ✅ Track website visits and analytics
- ✅ Create and manage todos linked to websites
- ✅ View browsing history and statistics
- ✅ Search and command palette for quick navigation
- ✅ Export/Import bookmarks
- ✅ Dark/Light theme support

---

## 🏗️ Full Project Structure

```
d:\projects\WeSite/
├── app/                                    # Next.js App Router (Main Application)
│   ├── layout.tsx                          # Root layout with theme & toaster
│   ├── page.tsx                            # Home page (renders WesiteApp)
│   ├── globals.css                         # Global styles & CSS variables
│   ├── global-error.tsx                    # Global error boundary
│   ├── not-found.tsx                       # 404 page
│   │
│   ├── api/                                # API Route Handlers (Backend)
│   │   ├── auth/
│   │   │   ├── login/route.ts              # POST - User login
│   │   │   ├── register/route.ts           # POST - User registration
│   │   │   ├── logout/route.ts             # POST - User logout
│   │   │   ├── me/route.ts                 # GET/PATCH - Current user info & profile update
│   │   │   ├── forgot-password/route.ts    # POST - Request password reset
│   │   │   └── reset-password/route.ts     # POST - Complete password reset
│   │   │
│   │   ├── websites/
│   │   │   ├── route.ts                    # GET (list) / POST (create) websites
│   │   │   ├── export/route.ts             # GET - Export websites as JSON
│   │   │   ├── import/route.ts             # POST - Import websites from JSON
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET/PATCH/DELETE single website
│   │   │       ├── visit/route.ts          # POST - Record a visit
│   │   │       ├── restore/route.ts        # PATCH - Restore from trash
│   │   │       └── permanent/route.ts      # DELETE - Permanently delete
│   │   │
│   │   ├── folders/
│   │   │   ├── route.ts                    # GET (list) / POST (create) folders
│   │   │   └── [id]/route.ts               # GET/PATCH/DELETE single folder
│   │   │
│   │   ├── todos/
│   │   │   ├── route.ts                    # GET (list) / POST (create) todos
│   │   │   └── [id]/route.ts               # PATCH/DELETE single todo
│   │   │
│   │   ├── history/
│   │   │   ├── route.ts                    # GET - List all visits
│   │   │   └── [id]/route.ts               # GET - Single visit details
│   │   │
│   │   ├── metadata/
│   │   │   └── fetch/route.ts              # POST - Scrape metadata from URL
│   │   │
│   │   └── analytics/
│   │       ├── summary/route.ts            # GET - Overall stats (visits, folders, todos)
│   │       ├── top-websites/route.ts       # GET - Most visited websites
│   │       ├── visits-over-time/route.ts   # GET - Visit trends
│   │       ├── heatmap/route.ts            # GET - Activity heatmap data
│   │       └── folder-distribution/route.ts # GET - Pie chart data
│   │
│   ├── analytics/page.tsx                  # Analytics dashboard page
│   ├── history/page.tsx                    # Browse history page
│   ├── login/page.tsx                      # Login form
│   ├── register/page.tsx                   # Registration form
│   ├── todo/page.tsx                       # Todo management page
│   └── settings/page.tsx                   # User profile & settings
│
├── components/                             # React Components
│   ├── WesiteApp.tsx                       # Main app component (auth check, folder tree)
│   ├── navbar.tsx                          # Top navigation bar
│   ├── AuthForm.tsx                        # Reusable auth form
│   │
│   ├── command-palette/
│   │   └── CommandPalette.tsx              # Cmd+K search & navigation
│   │
│   ├── grid/
│   │   ├── FolderCard.tsx                  # Folder display card
│   │   └── WebsiteCard.tsx                 # Website display card
│   │
│   ├── charts/
│   │   ├── VisitsLineChart.tsx             # Line chart for visit trends
│   │   ├── TopWebsitesBarChart.tsx         # Bar chart for top sites
│   │   ├── FolderDistributionPieChart.tsx  # Pie chart for folder stats
│   │   └── ActivityHeatmap.tsx             # Heatmap activity grid
│   │
│   ├── modals/
│   │   ├── AddWebsiteModal.tsx             # Modal for adding/editing websites
│   │   └── FolderModal.tsx                 # Modal for creating/editing folders
│   │
│   ├── sidebar/
│   │   └── MacSidebar.tsx                  # Folder tree sidebar (Finder-style)
│   │
│   ├── navbar/ (empty)                     # Navbar sub-components location
│   │
│   └── theme/
│       ├── ThemeProvider.tsx               # Theme provider component
│       └── ThemeToggle.tsx                 # Light/dark toggle
│
├── lib/                                    # Utility & Helper Functions
│   ├── db.ts                               # MongoDB connection (with caching)
│   ├── auth.ts                             # JWT auth, password hashing, token verification
│   ├── api.ts                              # API helpers (auth, parsing, serialization)
│   ├── theme.ts                            # Theme utilities
│   ├── folder-icons.tsx                    # Folder icon mapping
│   ├── scrapeMetadata.ts                   # URL metadata scraping (cheerio)
│   └── validators/
│       └── schemas.ts                      # Zod validation schemas
│
├── models/                                 # MongoDB Mongoose Schemas
│   ├── User.ts                             # User model
│   ├── Website.ts                          # Website bookmark model
│   ├── Folder.ts                           # Folder structure model
│   ├── Todo.ts                             # Todo/task model
│   └── Visit.ts                            # Website visit tracking model
│
├── public/                                 # Static assets (public files)
│
├── scripts/
│   └── seed.mjs                            # Database seeding script
│
├── Configuration Files
│   ├── package.json                        # Dependencies & scripts
│   ├── next.config.ts                      # Next.js configuration
│   ├── tsconfig.json                       # TypeScript configuration
│   ├── eslint.config.mjs                   # ESLint rules
│   ├── tailwind.config.mjs (implied)       # Tailwind CSS configuration
│   ├── postcss.config.mjs                  # PostCSS configuration
│   └── .env.local                          # Environment variables
│
└── Documentation
    ├── README.md                           # Basic setup guide
    ├── ARCHITECTURE.md                     # This file
    ├── AGENTS.md                           # Custom agent rules
    └── CLAUDE.md                           # Claude-specific instructions
```

---

## 🗄️ Database Models

### 1. **User Model** (`models/User.ts`)
```typescript
{
  _id: ObjectId,
  name: String,                    // Display name
  email: String (unique),          // Login email
  passwordHash: String,            // Bcrypt hashed password
  avatarUrl: String,               // Profile picture URL
  resetTokenHash: String,          // For password reset (nullable)
  resetTokenExpiresAt: Date,       // Reset token expiration
  themePreference: 'light'|'dark'|'system',
  timestamps: { createdAt, updatedAt }
}
```

### 2. **Folder Model** (`models/Folder.ts`)
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,                    // Folder name
  parentFolderId: ObjectId,        // For nested folders (nullable)
  color: String,                   // Folder color hex
  icon: String,                    // Icon identifier
  order: Number,                   // Sort order
  timestamps: { createdAt, updatedAt }
}
```

### 3. **Website Model** (`models/Website.ts`)
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  folderId: ObjectId,              // Parent folder (nullable)
  url: String,
  normalizedUrl: String,           // For duplicate detection
  domain: String,
  title: String,                   // Scraped metadata
  description: String,             // Scraped metadata
  faviconUrl: String,              // Scraped favicon
  ogImageUrl: String,              // Open Graph image
  tags: [String],
  notes: String,
  customIconUrl: String,           // User-uploaded icon
  isFavorite: Boolean,
  isTrashed: Boolean,              // Soft delete
  trashedAt: Date,
  visitCount: Number,              // Total visits
  firstVisitedAt: Date,            // First visit timestamp
  lastVisitedAt: Date,             // Most recent visit
  timestamps: { createdAt, updatedAt }
}
```

### 4. **Todo Model** (`models/Todo.ts`)
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  websiteId: ObjectId,             // Linked website (nullable)
  title: String,                   // Task title
  notes: String,                   // Task description
  dueAt: Date,                     // Due date (nullable)
  completedAt: Date,               // Completion timestamp (nullable)
  timestamps: { createdAt, updatedAt }
}
```

### 5. **Visit Model** (`models/Visit.ts`)
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  websiteId: ObjectId (ref: Website),
  visitedAt: Date,                 // Visit timestamp
  // Note: No timestamps on this model (lightweight)
}
```

---

## 🔌 API Endpoints

### **Authentication Routes** (`/api/auth`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/login` | Authenticate user, return JWT token |
| POST | `/register` | Create new account |
| POST | `/logout` | Clear auth cookie |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update user profile |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Complete password reset |

### **Website Routes** (`/api/websites`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List websites (with search, filter, sort) |
| POST | `/` | Create new website |
| GET | `/:id` | Get single website |
| PATCH | `/:id` | Update website |
| DELETE | `/:id` | Soft delete (move to trash) |
| PATCH | `/:id/restore` | Restore from trash |
| DELETE | `/:id/permanent` | Permanently delete |
| POST | `/:id/visit` | Record a visit |
| GET | `/export` | Export all websites as JSON |
| POST | `/import` | Import websites from JSON |

### **Folder Routes** (`/api/folders`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all folders |
| POST | `/` | Create folder |
| GET | `/:id` | Get folder details |
| PATCH | `/:id` | Update folder |
| DELETE | `/:id` | Delete folder |

### **Todo Routes** (`/api/todos`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List todos (filter by status) |
| POST | `/` | Create todo |
| PATCH | `/:id` | Update todo (mark complete) |
| DELETE | `/:id` | Delete todo |

### **History Routes** (`/api/history`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all visits |
| GET | `/:id` | Get visit details |

### **Analytics Routes** (`/api/analytics`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/summary` | Overall stats |
| GET | `/top-websites` | Most visited sites |
| GET | `/visits-over-time` | Visit trends (30 days) |
| GET | `/heatmap` | Activity heatmap data |
| GET | `/folder-distribution` | Folder stats |

### **Metadata Routes** (`/api/metadata`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/fetch` | Scrape URL metadata |

---

## 🎨 Frontend Pages

### **Home Page** (`app/page.tsx`)
- Main app interface
- Folder sidebar (left)
- Website grid/list (center)
- Command palette (Cmd+K)
- Add website modal
- Responsive Finder-style layout

### **Analytics Page** (`app/analytics/page.tsx`)
- Summary cards (total websites, folders, visits)
- Visit line chart (30-day trend)
- Top websites bar chart
- Folder distribution pie chart
- Activity heatmap

### **History Page** (`app/history/page.tsx`)
- Chronological list of all visits
- Filter by date, website, folder
- Quick access to visit timestamps

### **Todo Page** (`app/todo/page.tsx`)
- Create new tasks
- Assign tasks to websites
- Mark tasks complete/incomplete
- Filter: Open, Completed, All
- Due date tracking

### **Settings Page** (`app/settings/page.tsx`)
- Edit profile (name, email, avatar)
- Change password
- Theme preference (Light/Dark/System)
- Logout button

### **Auth Pages** (`app/login`, `app/register`)
- Email/password forms
- Validation feedback
- Link to other auth flows

---

## 🔐 Authentication Flow

1. **Registration**
   - User submits email & password
   - Password hashed with bcrypt (12 rounds)
   - User created in MongoDB
   - Redirect to login

2. **Login**
   - Email & password verified
   - JWT token signed (30-day expiration)
   - Token stored in HTTP-only cookie (`wesite_token`)
   - Redirect to home

3. **Protected Routes**
   - Middleware checks cookie for token
   - Token verified with JWT_SECRET
   - User attached to request context
   - Unauthorized requests return 401

4. **Password Reset**
   - User requests reset by email
   - Reset token generated & hashed
   - Token expires in 1 hour
   - User clicks link & sets new password

---

## 🎯 Key Features Implementation

### **Folder Tree Navigation**
- **Nested folders** supported via `parentFolderId` reference
- **Drag-to-folder** implemented in `FolderCard.tsx`
- **Folder hierarchy** flattened for display in `MacSidebar.tsx`

### **Website Management**
- **Duplicate detection** via `normalizedUrl` unique index
- **Soft delete** with `isTrashed` flag (restoreable)
- **Metadata scraping** with cheerio for title, description, favicon, Open Graph
- **Visit tracking** with `Visit` model
- **Export/Import** as JSON for backup/migration

### **Todo System**
- **Link to websites** via `websiteId` (optional)
- **Due dates** with timestamp storage
- **Completion tracking** via `completedAt` field
- **Filter by status** (open, completed, all)

### **Analytics Dashboard**
- **Summary stats** (totals, averages, activity today)
- **Visit trends** aggregated by date
- **Top websites** by visit count
- **Folder distribution** pie chart
- **Activity heatmap** showing daily activity grid

### **Search & Command Palette**
- **Global search** across titles, descriptions, domains, tags
- **Cmd+K command palette** for quick navigation
- **Fuzzy matching** for relevance

### **Theme System**
- **CSS variables** for light/dark colors
- **System preference detection** (prefers-color-scheme)
- **User preference storage** in `themePreference` field

---

## 🚀 Setup & Running

### **Prerequisites**
- Node.js 18+
- MongoDB 5.0+ (local or Atlas)
- npm or yarn

### **Environment Setup**
Create `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/wesite
JWT_SECRET=your-very-long-random-secret-key-32-chars-min
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Installation**
```bash
npm install
```

### **Database Seeding**
```bash
npm run seed
```
Creates demo user:
- Email: `demo@wesite.local`
- Password: `password123`
- Includes sample folders, websites, visits, todos

### **Development**
```bash
npm run dev
```
Open http://localhost:3000

### **Production Build**
```bash
npm run build
npm start
```

### **Linting**
```bash
npm run lint
```

---

## 📦 Dependencies

### **Core Framework**
- `next` (16.2.10) - React framework
- `react` (19.2.4), `react-dom` (19.2.4)

### **Database**
- `mongoose` (9.7.4) - MongoDB ODM
- `mongodb` (implicit)

### **Authentication**
- `bcryptjs` (3.0.3) - Password hashing
- `jsonwebtoken` (9.0.3) - JWT signing

### **UI & Styling**
- `tailwindcss` (4.x) - Utility CSS
- `@tailwindcss/postcss` (4.x) - PostCSS plugin
- `lucide-react` (1.24.0) - Icon library

### **Data & Charts**
- `recharts` (3.9.2) - React charting library
- `zod` (4.4.3) - Schema validation
- `cheerio` (1.2.0) - HTML parsing for scraping

### **Notifications**
- `sonner` (2.0.7) - Toast notifications

### **Dev Tools**
- `typescript` (5.x) - Type safety
- `eslint` (9.x) - Linting
- `postcss` (implicit)

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ React Components (WesiteApp, Pages, Modals, Charts)   │ │
│  │ - Fetch from /api/...                                  │ │
│  │ - Send to /api/...                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Server                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ API Routes (/api/...)                                  │ │
│  │ - Auth (login, register, me)                          │ │
│  │ - Websites (CRUD, visit, export/import)              │ │
│  │ - Folders (CRUD)                                      │ │
│  │ - Todos (CRUD, filter)                               │ │
│  │ - Analytics (summary, trends, heatmap)               │ │
│  │ - History (list visits)                              │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Utilities                                              │ │
│  │ - Auth: JWT, password hashing, cookies               │ │
│  │ - DB: Connection pooling                             │ │
│  │ - Metadata: URL scraping with cheerio                │ │
│  │ - Validators: Zod schemas                            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Collections                                            │ │
│  │ - users (auth, profiles)                             │ │
│  │ - folders (nested structure)                         │ │
│  │ - websites (bookmarks, metadata)                     │ │
│  │ - todos (tasks, linked to websites)                 │ │
│  │ - visits (visit tracking, analytics)                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Measures

1. **Password Security**
   - Bcrypt hashing (12 rounds)
   - Never stored in plain text

2. **JWT Authentication**
   - HTTP-only cookies (prevent XSS)
   - 30-day expiration
   - Signed with JWT_SECRET

3. **Authorization**
   - All routes require authentication
   - User can only access their own data
   - `userId` indexed for efficient filtering

4. **Input Validation**
   - Zod schemas for all endpoints
   - Type-safe request bodies
   - 422 response on validation failure

5. **Sensitive Data**
   - Passwords excluded from serialized responses
   - Reset tokens hashed before storage
   - No sensitive fields in JWT payload

---

## 📊 Performance Optimizations

1. **Database Indexing**
   - Compound indexes on commonly filtered fields
   - Partial indexes for soft-delete
   - Full-text search indexes

2. **Connection Pooling**
   - MongoDB connection cached globally
   - Reused across requests

3. **Pagination**
   - Websites endpoint supports limit/page
   - Default limit: 60, max: 100

4. **Query Optimization**
   - Lean queries for read-only data
   - Lean + populate for relationships
   - Sorting at database level

5. **Client-Side**
   - React memoization for components
   - Debounced search input
   - Lazy loading for modals

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "MONGODB_URI is not configured" | Set `MONGODB_URI` in `.env.local` |
| "JWT_SECRET is not configured" | Set `JWT_SECRET` in `.env.local` |
| Auth cookie not persisting | Ensure cookies enabled, domain/path correct |
| Metadata scraping fails | Check internet connection, URL validity |
| Duplicate website allowed | Restart app, clear browser cache |
| Theme not applying | Clear localStorage, refresh browser |

---

## 📝 Next Steps & Improvements

   Potential enhancements:
   - [ ] Email notifications for password resets
   - [ ] Browser extension for quick saving
   - [ ] Collaborative folders (share with other users)
   - [ ] Tags autocomplete
   - [ ] Bulk operations (delete, move folders)
   - [ ] Webhooks for integrations
   - [ ] Mobile app (React Native)
   - [ ] OAuth login (Google, GitHub)
   - [ ] Two-factor authentication
   - [ ] Website monitoring/change detection
   - [ ] Browser-based archive/screenshot
   - [ ] Custom domain support

---

## 📚 Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code standards
- **Zod** - Runtime validation
- **Mongoose** - Type-safe schemas

---

## 📄 License

Your project license (update as needed)

---

Generated: 2026-07-10 | WeSite v0.1.0
