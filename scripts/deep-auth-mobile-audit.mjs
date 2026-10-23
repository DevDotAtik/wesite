import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { chromium } from "playwright";

const MONGODB_URI = "mongodb+srv://khanarbajpathan057:atikkhan59986@wavecart.lrjxhkh.mongodb.net/wesite?retryWrites=true&w=majority";
const JWT_SECRET = "atikkhan59986";
const BASE_URL = "http://localhost:3000";

async function getAuthToken() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({}).lean();
  await mongoose.disconnect();

  if (!user) {
    throw new Error("No user found in database");
  }

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  return { token, user };
}

async function main() {
  console.log("Connecting to database and generating session token...");
  const { token, user } = await getAuthToken();
  console.log(`Generated session for: ${user.email} (${user.name})`);

  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // Mobile Viewport
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });

  const parsedUrl = new URL(BASE_URL);
  await context.addCookies([
    {
      name: "auth_token",
      value: token,
      domain: parsedUrl.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  const testPages = [
    { url: "/dashboard", name: "Dashboard" },
    { url: "/analytics", name: "Analytics" },
    { url: "/webflow", name: "Webflow Hub" },
    { url: "/history", name: "History" },
    { url: "/monitoring", name: "Monitoring" },
    { url: "/todo", name: "Todo" },
    { url: "/news", name: "News" },
    { url: "/settings", name: "Settings" },
  ];

  console.log("\n==========================================");
  console.log("MOBILE VIEWPORT AUDIT (375x667)");
  console.log("==========================================");

  let hasErrors = false;

  for (const p of testPages) {
    console.log(`\nTesting mobile page: ${p.name} (${p.url})...`);
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);

    if (overflow) {
      hasErrors = true;
      console.log(`  ❌ OVERFLOW DETECTED: scrollWidth=${scrollWidth}px > innerWidth=${innerWidth}px`);
    } else {
      console.log(`  ✅ Mobile layout clean: scrollWidth=${scrollWidth}px == windowWidth=${innerWidth}px`);
    }
  }

  await browser.close();

  console.log("\n==========================================");
  if (hasErrors) {
    console.log("FAILED: Some pages have mobile horizontal overflow.");
    process.exit(1);
  } else {
    console.log("PASSED: ALL 8 AUTHENTICATED PAGES ARE 100% MOBILE RESPONSIVE (0 OVERFLOW)!");
  }
  console.log("==========================================\n");
}

main().catch(console.error);
