import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/wesite";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    avatarUrl: String,
    themePreference: String,
  },
  { timestamps: true },
);

const folderSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    parentFolderId: mongoose.Schema.Types.ObjectId,
    color: String,
    icon: String,
    order: Number,
  },
  { timestamps: true },
);

const websiteSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    folderId: mongoose.Schema.Types.ObjectId,
    url: String,
    normalizedUrl: String,
    domain: String,
    title: String,
    description: String,
    faviconUrl: String,
    ogImageUrl: String,
    tags: [String],
    notes: String,
    customIconUrl: String,
    isFavorite: Boolean,
    isTrashed: Boolean,
    trashedAt: Date,
    visitCount: Number,
    firstVisitedAt: Date,
    lastVisitedAt: Date,
  },
  { timestamps: true },
);

const visitSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  websiteId: mongoose.Schema.Types.ObjectId,
  visitedAt: Date,
});

const User = mongoose.models.User ?? mongoose.model("User", userSchema);
const Folder = mongoose.models.Folder ?? mongoose.model("Folder", folderSchema);
const Website = mongoose.models.Website ?? mongoose.model("Website", websiteSchema);
const Visit = mongoose.models.Visit ?? mongoose.model("Visit", visitSchema);

await mongoose.connect(uri);
await Promise.all([User.deleteMany({ email: "demo@wesite.local" })]);

const user = await User.create({
  name: "Demo User",
  email: "demo@wesite.local",
  passwordHash: await bcrypt.hash("password123", 12),
  avatarUrl: "",
  themePreference: "system",
});

const work = await Folder.create({ userId: user._id, name: "Work", color: "#2563eb", icon: "folder", order: 1 });
const design = await Folder.create({ userId: user._id, name: "Design", color: "#0f766e", icon: "folder", order: 2 });
const clients = await Folder.create({ userId: user._id, name: "Client Projects", parentFolderId: work._id, color: "#9333ea", icon: "folder", order: 1 });

const websites = await Website.insertMany([
  {
    userId: user._id,
    folderId: work._id,
    url: "https://nextjs.org",
    normalizedUrl: "https://nextjs.org",
    domain: "nextjs.org",
    title: "Next.js",
    description: "The React framework for the web.",
    faviconUrl: "https://nextjs.org/favicon.ico",
    ogImageUrl: "",
    tags: ["react", "docs"],
    isFavorite: true,
    isTrashed: false,
    visitCount: 9,
  },
  {
    userId: user._id,
    folderId: design._id,
    url: "https://www.figma.com",
    normalizedUrl: "https://www.figma.com",
    domain: "figma.com",
    title: "Figma",
    description: "Collaborative interface design tool.",
    faviconUrl: "https://www.figma.com/favicon.ico",
    ogImageUrl: "",
    tags: ["design"],
    isFavorite: true,
    isTrashed: false,
    visitCount: 6,
  },
  {
    userId: user._id,
    folderId: clients._id,
    url: "https://vercel.com",
    normalizedUrl: "https://vercel.com",
    domain: "vercel.com",
    title: "Vercel",
    description: "Frontend cloud platform.",
    faviconUrl: "https://vercel.com/favicon.ico",
    ogImageUrl: "",
    tags: ["deploy"],
    isFavorite: false,
    isTrashed: false,
    visitCount: 3,
  },
]);

const now = new Date();
const visits = [];

for (const [index, website] of websites.entries()) {
  for (let count = 0; count < website.visitCount; count += 1) {
    const visitedAt = new Date(now);
    visitedAt.setDate(now.getDate() - ((count + index) % 20));
    visits.push({ userId: user._id, websiteId: website._id, visitedAt });
  }
}

await Visit.insertMany(visits);

for (const website of websites) {
  const websiteVisits = visits.filter((visit) => String(visit.websiteId) === String(website._id));
  website.firstVisitedAt = new Date(Math.min(...websiteVisits.map((visit) => visit.visitedAt.getTime())));
  website.lastVisitedAt = new Date(Math.max(...websiteVisits.map((visit) => visit.visitedAt.getTime())));
  await website.save();
}

console.log("Seeded Wesite demo account: demo@wesite.local / password123");
await mongoose.disconnect();
