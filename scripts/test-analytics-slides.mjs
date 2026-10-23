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
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function main() {
  const token = await getAuthToken();
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await context.addCookies([
    {
      name: "wesite_token",
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: "/",
    },
  ]);

  const page = await context.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("wesite_token", t);
  }, token);

  const errors = [];
  page.on("pageerror", (err) => errors.push(`[PAGE ERROR] ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });

  console.log("Loading /analytics...");
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Check 1: Dashboard View (Default)
  console.log("1. Checking Dashboard View...");
  const rechartsContainers = await page.locator(".recharts-responsive-container, .recharts-surface").count();
  console.log(`   Recharts surfaces/containers in Dashboard view: ${rechartsContainers}`);
  if (rechartsContainers < 2) {
    throw new Error(`Expected at least 2 Recharts containers on initial load, found ${rechartsContainers}`);
  }

  const visitsLineChart = await page.locator('text="Visits Over Time"').first().isVisible();
  const topWebsites = await page.locator('text="Top Visited Websites"').first().isVisible();
  const categories = await page.locator('text="Category Breakdown"').first().isVisible();
  console.log(`   Visits Over Time visible: ${visitsLineChart}`);
  console.log(`   Top Visited Websites visible: ${topWebsites}`);
  console.log(`   Category Breakdown visible: ${categories}`);

  // Check 2: Switch to Slides Mode
  console.log("\n2. Switching to Slides Mode...");
  await page.locator('button:has-text("Slides")').click();
  await page.waitForTimeout(1000);

  const slideRecharts = await page.locator(".recharts-responsive-container, .recharts-surface").count();
  console.log(`   Slide 0 Recharts count: ${slideRecharts}`);

  // Next slide (Slide 1)
  console.log("   Clicking Next Slide...");
  await page.locator('button[aria-label="Next Slide"]').click();
  await page.waitForTimeout(1000);
  const slide1Recharts = await page.locator(".recharts-responsive-container, .recharts-surface").count();
  console.log(`   Slide 1 Recharts count: ${slide1Recharts}`);

  // Range filter toggle (7D)
  console.log("\n3. Testing Range Filter (7D)...");
  await page.locator('button:has-text("7D")').first().click();
  await page.waitForTimeout(1000);
  console.log("   Range filter 7D clicked successfully");

  // Switch back to Dashboard Mode
  console.log("\n4. Switching back to Dashboard Mode...");
  await page.locator('button:has-text("Dashboard")').click();
  await page.waitForTimeout(1000);
  const backRecharts = await page.locator(".recharts-responsive-container, .recharts-surface").count();
  console.log(`   Dashboard Recharts count after returning: ${backRecharts}`);

  console.log("\nErrors encountered:", errors.length);
  errors.forEach((e) => console.log(" - ", e));

  await browser.close();
  if (errors.length > 0) process.exit(1);
  console.log("\n✅ ALL ANALYTICS CHECKS PASSED!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
