# WeSite - Quick Start Guide

## ✅ Setup Checklist

This guide will get WeSite running in less than 5 minutes.

---

## Step 1: Environment Configuration

### Create `.env.local` file
Copy the template and fill in your values:

```env
# MongoDB connection string
# For local: mongodb://127.0.0.1:27017/wesite
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/wesite?retryWrites=true&w=majority
MONGODB_URI=mongodb://127.0.0.1:27017/wesite

# JWT secret for token signing (use a long random string, min 32 chars)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=replace-with-a-very-long-random-secret-key-32-chars-minimum

# Application URL (for next image optimization)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Verify `.env.local` is in `.gitignore`
```bash
echo ".env.local" >> .gitignore
```

---

## Step 2: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 450+ packages in ~45s
```

---

## Step 3: Start MongoDB

### Option A: Local MongoDB (Docker)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option B: Local MongoDB (System)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Windows - MongoDB Service should auto-start
# Linux
sudo systemctl start mongod
```

### Option C: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free tier cluster
3. Get connection string
4. Set `MONGODB_URI` in `.env.local`

---

## Step 4: Seed Demo Data

This creates a demo user and sample websites/folders/todos:

```bash
npm run seed
```

**Output:**
```
Seeded Wesite demo account: demo@wesite.local / password123
```

**Demo Account Credentials:**
- Email: `demo@wesite.local`
- Password: `password123`

---

## Step 5: Run Development Server

```bash
npm run dev
```

**Output:**
```
  ▲ Next.js 16.2.10
  - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

Open **http://localhost:3000** in your browser

---

## 🎯 First Steps in App

1. **Login**
   - Click "Login" on home page
   - Use `demo@wesite.local` / `password123`

2. **Add a Website**
   - Click "+ Add Website" button
   - Enter URL: https://github.com
   - Metadata will auto-fill
   - Click "Save"

3. **Create a Folder**
   - Click "New Folder" in sidebar
   - Name: "Development"
   - Pick a color

4. **Move Website to Folder**
   - Drag website card onto folder
   - Or use the move option in website modal

5. **Track Visit**
   - Click the website card
   - Click "Visit" to record visit time

6. **Create a Todo**
   - Go to "Todo" page (sidebar)
   - Create task
   - Assign to website (optional)
   - Mark complete when done

7. **View Analytics**
   - Go to "Analytics" page
   - See visit trends, top sites, stats

---

## 📦 Verify Installation

Run these commands to verify everything works:

```bash
# Check TypeScript compilation
npm run build

# Check ESLint
npm run lint

# Test database connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wesite')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ Connection failed:', err.message))
"
```

---

## 🚀 Common Commands

```bash
# Start development with hot reload
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Seed demo data
npm run seed

# Rebuild database from scratch
npm run seed  # (clears and recreates)
```

---

## 🔌 API Testing with cURL

After starting the server, test the API:

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@wesite.local","password":"password123"}' \
  -c cookies.txt
```

### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### List Websites
```bash
curl http://localhost:3000/api/websites \
  -b cookies.txt
```

### Create Website
```bash
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "url": "https://nextjs.org",
    "title": "Next.js",
    "description": "React framework",
    "folderId": null
  }'
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
**Error:** `MONGODB_URI is not configured` or connection timeout

**Solution:**
1. Ensure MongoDB is running: `mongo --version` and service started
2. Check `.env.local` has correct `MONGODB_URI`
3. If using MongoDB Atlas, whitelist your IP

### Port 3000 Already in Use
```bash
# macOS/Linux: Find and kill process
lsof -i :3000
kill -9 <PID>

# Or run on different port
PORT=3001 npm run dev
```

### Seed Script Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run seed
```

### Login Doesn't Work
1. Verify MongoDB has demo user: `db.users.find()` in MongoDB client
2. Check cookies are enabled in browser
3. Clear browser cookies and cache
4. Try incognito/private mode

### Metadata Scraping Fails
- Ensure internet connection is active
- URL must be valid and publicly accessible
- Some sites block scrapers (try a different site)

### Theme Not Changing
1. Clear localStorage: `localStorage.clear()` in console
2. Hard refresh browser: `Ctrl+Shift+R`
3. Restart development server

---

## 📚 Useful Resources

- **Next.js Docs:** https://nextjs.org/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Mongoose Docs:** https://mongoosejs.com
- **TailwindCSS:** https://tailwindcss.com
- **TypeScript:** https://www.typescriptlang.org

---

## 💡 Pro Tips

1. **Generate Strong JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Monitor Database:**
   ```bash
   # MongoDB Atlas: https://cloud.mongodb.com
   # Local: Use MongoDB Compass - https://www.mongodb.com/products/compass
   ```

3. **Debug API Routes:**
   Add `console.log()` statements in route handlers
   Output shows in terminal running `npm run dev`

4. **Hot Reload:**
   Edit `.tsx` or `.ts` files → browser auto-refreshes
   No need to restart dev server

5. **Performance:**
   - Open DevTools Network tab
   - Check API response times
   - Use "Slow 3G" throttling to test

---

## 🎓 Learning Paths

### Want to understand the codebase?
1. Start with `ARCHITECTURE.md` (full structure)
2. Read `app/page.tsx` → `components/WesiteApp.tsx` (main flow)
3. Explore API routes: `app/api/websites/route.ts` (GET/POST patterns)
4. Check database models: `models/Website.ts` (schema examples)

### Want to add a feature?
1. Define database schema in `models/`
2. Create API route in `app/api/`
3. Build React component in `components/`
4. Add validation schema in `lib/validators/schemas.ts`
5. Test with cURL or PostMan

### Want to fix a bug?
1. Identify error in browser console or terminal
2. Check `get_errors` for TypeScript issues
3. Look at API response status (200, 400, 401, 404, 500)
4. Add console.log for debugging
5. Check MongoDB for data issues

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Backend Routes | 30+ |
| React Components | 15+ |
| Database Models | 5 |
| API Endpoints | 25+ |
| Lines of Code | 3000+ |
| TypeScript Coverage | 100% |

---

## 🔐 Security Notes

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens in HTTP-only cookies
- ✅ All routes require authentication
- ✅ Input validation with Zod
- ✅ CORS not needed (same-origin)

---

## ⚡ Next Steps

1. ✅ Complete the checklist above
2. 📖 Read `ARCHITECTURE.md` for full details
3. 🧪 Create test website, folder, todo
4. 📊 Check analytics dashboard
5. 🔧 Explore `app/api/` route structure
6. 💻 Try modifying a component
7. 🚀 Deploy to production (Vercel recommended)

---

**Have questions?** Check the ARCHITECTURE.md or explore the source code!

Generated: 2026-07-10 | WeSite v0.1.0
