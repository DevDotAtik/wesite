# WeSite - Developer Guide

This guide shows you how to extend WeSite with new features using established patterns.

---

## 🏗️ Adding a New Feature

Let's walk through adding a **"Collections"** feature as an example.

### Scenario
Add Collections (groups of websites with shared properties).

---

## Step 1: Create Database Model

Create `models/Collection.ts`:

```typescript
import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const collectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    websiteIds: [{ type: Schema.Types.ObjectId, ref: "Website" }],
    color: { type: String, default: "#3b82f6" },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

collectionSchema.index({ userId: 1, name: 1 });

export type CollectionDocument = InferSchemaType<typeof collectionSchema> & {
  _id: Types.ObjectId;
};

const Collection =
  (mongoose.models.Collection as Model<CollectionDocument>) ||
  mongoose.model<CollectionDocument>("Collection", collectionSchema);

export default Collection;
```

---

## Step 2: Add Validation Schema

Update `lib/validators/schemas.ts`:

```typescript
export const collectionCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  color: z.string().max(32).optional(),
  isPublic: z.boolean().optional(),
});

export const collectionPatchSchema = collectionCreateSchema.partial();

export const collectionAddWebsiteSchema = z.object({
  websiteId: objectIdSchema,
});
```

---

## Step 3: Create API Routes

### Create `app/api/collections/route.ts`:

```typescript
import type { NextRequest } from "next/server";
import { json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { collectionCreateSchema } from "@/lib/validators/schemas";
import Collection from "@/models/Collection";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  await connectToDatabase();

  const collections = await Collection.find({ userId: auth.user._id })
    .populate("websiteIds", "title domain faviconUrl url")
    .sort({ createdAt: -1 })
    .lean();

  return json({
    collections: serializeDocument(collections),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, collectionCreateSchema);
  if (error) return error;

  await connectToDatabase();

  const collection = await Collection.create({
    userId: auth.user._id,
    ...data,
  });

  return json({ collection: serializeDocument(collection) }, 201);
}
```

### Create `app/api/collections/[id]/route.ts`:

```typescript
import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument, isValidObjectId } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { collectionPatchSchema } from "@/lib/validators/schemas";
import Collection from "@/models/Collection";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return apiError("Invalid collection ID", 400);
  }

  const { data, error } = await parseBody(request, collectionPatchSchema);
  if (error) return error;

  await connectToDatabase();

  const collection = await Collection.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    data,
    { new: true }
  );

  if (!collection) {
    return apiError("Collection not found", 404);
  }

  return json({ collection: serializeDocument(collection) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return apiError("Invalid collection ID", 400);
  }

  await connectToDatabase();

  const result = await Collection.deleteOne({ _id: id, userId: auth.user._id });

  if (!result.deletedCount) {
    return apiError("Collection not found", 404);
  }

  return json({ success: true });
}
```

### Create `app/api/collections/[id]/websites/route.ts`:

```typescript
import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { collectionAddWebsiteSchema } from "@/lib/validators/schemas";
import Collection from "@/models/Collection";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const { data, error } = await parseBody(request, collectionAddWebsiteSchema);
  if (error) return error;

  await connectToDatabase();

  const collection = await Collection.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $addToSet: { websiteIds: data.websiteId } },
    { new: true }
  ).populate("websiteIds");

  if (!collection) {
    return apiError("Collection not found", 404);
  }

  return json({ collection: serializeDocument(collection) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const websiteId = searchParams.get("websiteId");

  if (!websiteId) {
    return apiError("websiteId parameter required", 400);
  }

  await connectToDatabase();

  const collection = await Collection.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $pull: { websiteIds: websiteId } },
    { new: true }
  );

  if (!collection) {
    return apiError("Collection not found", 404);
  }

  return json({ collection: serializeDocument(collection) });
}
```

---

## Step 4: Create React Component

Create `components/CollectionsModal.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Folder, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Collection = {
  _id: string;
  name: string;
  description: string;
  color: string;
  websiteIds: { _id: string; title: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (collection: Collection) => void;
};

export default function CollectionsModal({ open, onClose, onCreated }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#3b82f6" });

  useEffect(() => {
    if (open) loadCollections();
  }, [open]);

  async function loadCollections() {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections);
      }
    } catch (error) {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      const { collection } = await res.json();
      setCollections([collection, ...collections]);
      setForm({ name: "", description: "", color: "#3b82f6" });
      toast.success("Collection created");
      onCreated?.(collection);
    } catch {
      toast.error("Failed to create collection");
    }
  }

  async function deleteCollection(id: string) {
    if (!window.confirm("Delete this collection?")) return;

    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      setCollections(collections.filter((c) => c._id !== id));
      toast.success("Collection deleted");
    } catch {
      toast.error("Failed to delete collection");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Collections</h2>
          <button onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={createCollection} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Collection name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="h-10 w-20 rounded-lg border"
          />
          <button
            type="submit"
            disabled={!form.name.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="mr-2 inline size-4" />
            Create
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : collections.length === 0 ? (
            <p className="text-sm text-zinc-500">No collections yet</p>
          ) : (
            collections.map((collection) => (
              <div
                key={collection._id}
                className="flex items-center justify-between rounded-lg border border-zinc-300 p-3 dark:border-zinc-600"
              >
                <div className="flex items-center gap-2">
                  <Folder
                    className="size-4"
                    style={{ color: collection.color }}
                  />
                  <div>
                    <p className="font-medium">{collection.name}</p>
                    <p className="text-xs text-zinc-500">
                      {collection.websiteIds.length} websites
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteCollection(collection._id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Step 5: Integrate into Main App

Update `components/WesiteApp.tsx`:

```typescript
import CollectionsModal from "@/components/CollectionsModal";

export default function WesiteApp() {
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  return (
    <>
      {/* ... existing JSX ... */}
      <button
        onClick={() => setCollectionsOpen(true)}
        className="...button classes..."
      >
        Collections
      </button>

      <CollectionsModal
        open={collectionsOpen}
        onClose={() => setCollectionsOpen(false)}
      />
    </>
  );
}
```

---

## 📝 Common Patterns

### Pattern 1: Protected API Route

```typescript
import { requireUser } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response; // Returns 401 if not authed

  // Auth passed, auth.user is available
}
```

### Pattern 2: Input Validation

```typescript
import { parseBody } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, schema);
  if (error) return error; // Returns 422 with validation errors
}
```

### Pattern 3: Database Query with User Filter

```typescript
await Model.find({ userId: auth.user._id })
  .populate("relationshipField")
  .sort({ createdAt: -1 })
  .lean();
```

### Pattern 4: Modal Component

```typescript
"use client";

type Props = { open: boolean; onClose: () => void };

export default function MyModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900">
        {/* Content */}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

### Pattern 5: Fetch with Error Handling

```typescript
try {
  const res = await fetch("/api/endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    toast.error(error.error ?? "Failed");
    return;
  }

  const result = await res.json();
  toast.success("Success");
} catch (error) {
  toast.error("Network error");
}
```

---

## 🔍 Debugging Tips

### API Route Issues
```typescript
// Add logging
export async function GET(request: NextRequest) {
  console.log("Query params:", request.nextUrl.searchParams);
  console.log("Body:", await request.json());
  // Returns in terminal running `npm run dev`
}
```

### Component State Issues
```typescript
// Use React DevTools browser extension
// Or add console logs
useEffect(() => {
  console.log("websites updated:", websites);
}, [websites]);
```

### Database Issues
```bash
# Check MongoDB directly
mongosh  # or mongo for older versions
db.websites.find({ userId: ObjectId("...") }).pretty()
db.websites.countDocuments()
```

### API Response Issues
```bash
# Use cURL with pretty-print
curl http://localhost:3000/api/endpoint -s | jq

# Or use VS Code REST Client extension
# Create file: test.http
### Get data
GET http://localhost:3000/api/websites
```

---

## ✅ Testing Checklist

Before deploying new features:

```bash
# 1. TypeScript checks
npm run build

# 2. Linting
npm run lint

# 3. Manual testing
npm run dev
# Test in browser, check console for errors

# 4. API testing
curl -X GET http://localhost:3000/api/endpoint

# 5. Database verification
# Check MongoDB directly

# 6. Error cases
# Test with invalid input
# Test without authentication
# Test with non-existent resources
```

---

## 🚀 Deployment Checklist

Before pushing to production:

```bash
# 1. Update .env.local for production
MONGODB_URI=...your-atlas-uri...
JWT_SECRET=...long-random-string...
NODE_ENV=production

# 2. Build and test
npm run build
npm start

# 3. Run type checks
npm run lint

# 4. Test key flows
# - Register new account
# - Login
# - Create/update/delete resources
# - Check analytics

# 5. Deploy
# Vercel: git push origin main
# Other: Follow your deployment guide
```

---

## 📚 Useful Code Snippets

### Add admin check
```typescript
async function isAdmin(userId: string) {
  const admin = await AdminUser.findOne({ userId }).lean();
  return !!admin;
}

// In route:
if (!(await isAdmin(auth.user._id))) {
  return apiError("Admin only", 403);
}
```

### Search multiple fields
```typescript
query.$or = [
  { field1: { $regex: search, $options: "i" } },
  { field2: { $regex: search, $options: "i" } },
  { "nested.field": { $regex: search, $options: "i" } },
];
```

### Pagination
```typescript
const limit = Math.min(Number(params.limit ?? 20), 100);
const page = Math.max(Number(params.page ?? 1), 1);
const skip = (page - 1) * limit;

const results = await Model.find(query)
  .skip(skip)
  .limit(limit)
  .lean();

const total = await Model.countDocuments(query);
const totalPages = Math.ceil(total / limit);
```

### Batch operations
```typescript
await Promise.all([
  Model1.find(query1),
  Model2.find(query2),
  Model3.find(query3),
]);
```

---

**Now you know how to extend WeSite!** 🎉

Check `ARCHITECTURE.md` for full API reference and `QUICKSTART.md` for setup.

Generated: 2026-07-10 | WeSite v0.1.0
