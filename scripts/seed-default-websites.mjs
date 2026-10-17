import mongoose from "mongoose";

const baseUri = process.env.MONGODB_URI;
if (!baseUri) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

const DEFAULT_PREADDED_WEBSITES = [
  {
    url: "https://github.com",
    normalizedUrl: "https://github.com",
    domain: "github.com",
    title: "GitHub",
    description: "Platform for software development, collaboration, and version control.",
    faviconUrl: "https://github.githubassets.com/favicons/favicon.svg",
    ogImageUrl: "https://github.githubassets.com/images/modules/open_graph/github-logo.png",
    tags: ["Code", "Git", "Developer", "Open Source"],
  },
  {
    url: "https://opencode.ai",
    normalizedUrl: "https://opencode.ai",
    domain: "opencode.ai",
    title: "OpenCode",
    description: "AI coding assistant and modern workspace for developers and teams.",
    faviconUrl: "https://opencode.ai/favicon-96x96-v3.png",
    ogImageUrl: "https://opencode.ai/social-share.png",
    tags: ["AI", "Coding", "Assistant", "Productivity"],
  },
  {
    url: "https://code.visualstudio.com",
    normalizedUrl: "https://code.visualstudio.com",
    domain: "code.visualstudio.com",
    title: "Visual Studio Code",
    description: "Free, open source code editor refined and optimized for modern web and cloud applications.",
    faviconUrl: "https://code.visualstudio.com/favicon.ico",
    ogImageUrl: "https://code.visualstudio.com/opengraphimg/opengraph-home.png",
    tags: ["Editor", "IDE", "Developer", "Microsoft"],
  },
  {
    url: "https://figma.com",
    normalizedUrl: "https://figma.com",
    domain: "figma.com",
    title: "Figma",
    description: "The collaborative interface design tool for modern product teams and creators.",
    faviconUrl: "https://static.figma.com/app/icon/1/favicon.ico",
    ogImageUrl: "https://s0.wp.com/mshots/v1/https%3A%2F%2Ffigma.com?w=800",
    tags: ["Design", "UI", "UX", "Prototyping"],
  },
  {
    url: "https://nextjs.org",
    normalizedUrl: "https://nextjs.org",
    domain: "nextjs.org",
    title: "Next.js",
    description: "The React framework for the web by Vercel, enabling fast full-stack applications.",
    faviconUrl: "https://nextjs.org/favicon.ico",
    ogImageUrl: "https://h8dxkfmaphn8o0p3.public.blob.vercel-storage.com/nextjs/twitter-card.png",
    tags: ["React", "Framework", "Fullstack", "Web"],
  },
];

async function seedDb(targetDb) {
  console.log(`\n========================================`);
  console.log(`Seeding database: ${targetDb}`);
  console.log(`========================================`);

  const uri = baseUri.replace(/\/([^/?]+)(\?|$)/, `/${targetDb}$2`);
  const conn = await mongoose.createConnection(uri).asPromise();

  const User = conn.model(
    "User",
    new mongoose.Schema({ email: String, name: String }, { strict: false })
  );
  const Website = conn.model(
    "Website",
    new mongoose.Schema(
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        url: String,
        normalizedUrl: String,
        domain: String,
        title: String,
        description: String,
        faviconUrl: String,
        ogImageUrl: String,
        tags: [String],
        isFavorite: Boolean,
        isTrashed: Boolean,
        visitCount: Number,
        folderId: mongoose.Schema.Types.ObjectId,
      },
      { timestamps: true, strict: false }
    )
  );

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users in ${targetDb}:`, users.map((u) => u.email));

  for (const user of users) {
    const existing = await Website.find({
      userId: user._id,
      isTrashed: false,
    }).select("normalizedUrl").lean();

    const existingUrls = new Set(existing.map((w) => w.normalizedUrl));
    console.log(`User ${user.email} (${user._id}) has ${existing.length} active websites.`);

    const toInsert = DEFAULT_PREADDED_WEBSITES.filter(
      (site) => !existingUrls.has(site.normalizedUrl)
    ).map((site) => ({
      userId: user._id,
      url: site.url,
      normalizedUrl: site.normalizedUrl,
      domain: site.domain,
      title: site.title,
      description: site.description,
      faviconUrl: site.faviconUrl,
      ogImageUrl: site.ogImageUrl,
      tags: site.tags,
      isFavorite: false,
      isTrashed: false,
      visitCount: 0,
      folderId: null,
    }));

    if (toInsert.length > 0) {
      await Website.insertMany(toInsert, { ordered: false });
      console.log(`✅ Seeded ${toInsert.length} websites for ${user.email}: ${toInsert.map((s) => s.title).join(", ")}`);
    } else {
      console.log(`ℹ️ User ${user.email} already has all default websites.`);
    }
  }

  await conn.close();
}

async function run() {
  try {
    await seedDb("wesite");
    await seedDb("test");
    console.log("\n🚀 All database seeding completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

run();
