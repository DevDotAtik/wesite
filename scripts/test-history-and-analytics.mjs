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

  console.log("=========================================");
  console.log("RUNNING HISTORY & ANALYTICS AUDIT TEST");
  console.log("=========================================");

  // =========================================================================
  // TEST PART 1: DESKTOP HISTORY PAGE (1280x800)
  // =========================================================================
  console.log("\n[1/4] Testing Desktop History Page (1280x800)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await desktopContext.addCookies([
    { name: "wesite_token", value: token, domain: new URL(BASE_URL).hostname, path: "/" },
  ]);

  const desktopPage = await desktopContext.newPage();
  await desktopPage.addInitScript((t) => localStorage.setItem("wesite_token", t), token);

  const desktopErrors = [];
  desktopPage.on("pageerror", (err) => desktopErrors.push(`[PAGE ERROR] ${err.message}`));
  desktopPage.on("console", (msg) => {
    if (msg.type() === "error") desktopErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });

  await desktopPage.goto(`${BASE_URL}/history`, { waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(2000);

  // Layout verification
  const asideVisible = await desktopPage.locator("main aside").isVisible();
  const mainVisible = await desktopPage.locator("main section").first().isVisible();
  console.log(`  Left column visible: ${asideVisible}, Right column visible: ${mainVisible}`);
  if (!asideVisible || !mainVisible) throw new Error("Expected both left and right columns visible on desktop");

  // Stats bento verification
  const statsCards = await desktopPage.locator("aside p.text-xl").count();
  console.log(`  Stats Bento cards count: ${statsCards}`);

  // Quick presets verification
  const presetCount = await desktopPage.locator("button:has-text('Today'), button:has-text('7 Days'), button:has-text('30 Days')").count();
  console.log(`  Quick presets buttons count: ${presetCount}`);

  // Timeline slider verification
  const sliderPills = await desktopPage.locator("button:has-text('All History'), button:has-text('This Week')").count();
  console.log(`  Timeline slider filter buttons count: ${sliderPills}`);

  // No-scroll verification
  const desktopOverflow = await desktopPage.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    scrollY: window.scrollY,
  }));
  console.log("  Desktop Viewport Metrics:", desktopOverflow);
  if (desktopOverflow.hasHorizontalOverflow) {
    throw new Error(`Desktop has horizontal overflow! scrollWidth=${desktopOverflow.scrollWidth}, innerWidth=${desktopOverflow.innerWidth}`);
  }

  // Ensure a test visit exists to thoroughly test row interaction
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Website = mongoose.models.Website || mongoose.model("Website", new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    title: String,
    url: String,
    domain: String,
    visitCount: Number,
    isTrashed: Boolean,
  }, { strict: false }));
  const Visit = mongoose.models.Visit || mongoose.model("Visit", new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
    visitedAt: Date,
  }, { strict: false }));

  const user = await User.findOne({}).lean();
  let sampleSite = await Website.findOne({ userId: user._id, isTrashed: false });
  if (!sampleSite) {
    sampleSite = await Website.create({
      userId: user._id,
      title: "Google Search",
      url: "https://google.com",
      domain: "google.com",
      visitCount: 1,
      isTrashed: false,
    });
  }
  const testVisit = await Visit.create({
    userId: user._id,
    websiteId: sampleSite._id,
    visitedAt: new Date(),
  });
  await mongoose.disconnect();

  await desktopPage.reload({ waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(1500);

  // Test 3-dots action menu on the newly created visit
  const historyRowMoreBtn = desktopPage.locator('button[aria-label="More options"]').first();
  const hasHistoryRows = await historyRowMoreBtn.isVisible();
  console.log(`  History row with 3-dots menu visible: ${hasHistoryRows}`);
  if (hasHistoryRows) {
    console.log("  Opening 3-dots action menu...");
    await historyRowMoreBtn.click();
    await desktopPage.waitForTimeout(400);

    const deleteBtnVisible = await desktopPage.locator('button:has-text("Delete visit")').isVisible();
    const copyBtnVisible = await desktopPage.locator('button:has-text("Share / Copy link")').isVisible();
    console.log(`  Menu items visible: Delete=${deleteBtnVisible}, Copy=${copyBtnVisible}`);

    // Test Escape to close
    console.log("  Pressing Escape to dismiss menu...");
    await desktopPage.keyboard.press("Escape");
    await desktopPage.waitForTimeout(300);
    const menuStillVisible = await desktopPage.locator('button:has-text("Delete visit")').isVisible();
    console.log(`  Menu closed after Escape: ${!menuStillVisible}`);

    // Test Checkbox Selection & Floating Batch Bar
    console.log("  Testing checkbox selection...");
    const checkboxBtn = desktopPage.locator('button[aria-label="Select visit"]').first();
    await checkboxBtn.click();
    await desktopPage.waitForTimeout(400);
    const batchBarVisible = await desktopPage.locator("text=1 selected").isVisible();
    console.log(`  Floating Batch Bar visible on selection: ${batchBarVisible}`);

    // Deselect
    const closeBatchBtn = desktopPage.locator('button[aria-label="Clear selection"]');
    await closeBatchBtn.click();
    await desktopPage.waitForTimeout(300);
    const batchBarGone = !(await desktopPage.locator("text=1 selected").isVisible());
    console.log(`  Batch bar dismissed: ${batchBarGone}`);
  }

  // Clean up test visit
  await mongoose.connect(MONGODB_URI);
  await Visit.deleteOne({ _id: testVisit._id });
  await mongoose.disconnect();

  // =========================================================================
  // TEST PART 2: MOBILE HISTORY PAGE (390x844)
  // =========================================================================
  console.log("\n[2/4] Testing Mobile History Page (390x844)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  await mobileContext.addCookies([
    { name: "wesite_token", value: token, domain: new URL(BASE_URL).hostname, path: "/" },
  ]);

  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript((t) => localStorage.setItem("wesite_token", t), token);

  await mobilePage.goto(`${BASE_URL}/history`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(2000);

  // Verify mobile tabs
  const historyTabBtn = mobilePage.locator('button:has-text("History")').first();
  const filtersTabBtn = mobilePage.locator('button:has-text("Filters & Stats")');
  console.log(`  Mobile History tab visible: ${await historyTabBtn.isVisible()}`);
  console.log(`  Mobile Filters tab visible: ${await filtersTabBtn.isVisible()}`);

  // Click Filters tab
  console.log("  Switching to Filters & Stats tab on mobile...");
  await filtersTabBtn.click();
  await mobilePage.waitForTimeout(500);
  console.log(`  Left column visible on mobile: ${await mobilePage.locator("aside").isVisible()}`);

  // Switch back to History tab
  console.log("  Switching back to History tab on mobile...");
  await historyTabBtn.click();
  await mobilePage.waitForTimeout(500);
  console.log(`  Right column visible on mobile: ${await mobilePage.locator("main section").first().isVisible()}`);

  const mobileOverflow = await mobilePage.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  console.log("  Mobile Viewport Metrics:", mobileOverflow);
  if (mobileOverflow.hasHorizontalOverflow) {
    throw new Error(`Mobile has horizontal overflow! scrollWidth=${mobileOverflow.scrollWidth}, innerWidth=${mobileOverflow.innerWidth}`);
  }

  // =========================================================================
  // TEST PART 3: ANALYTICS PAGE VERIFICATION (1280x800)
  // =========================================================================
  console.log("\n[3/4] Testing Analytics Page Dashboard & Charts (1280x800)...");
  await desktopPage.goto(`${BASE_URL}/analytics`, { waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(2000);

  const rechartsContainers = await desktopPage.locator(".recharts-responsive-container, .recharts-surface").count();
  console.log(`  Recharts surfaces/containers in Dashboard view: ${rechartsContainers}`);
  if (rechartsContainers < 2) {
    throw new Error(`Expected at least 2 Recharts containers on initial load, found ${rechartsContainers}`);
  }

  const visitsLineChart = await desktopPage.locator('text="Visits Over Time"').first().isVisible();
  const topWebsites = await desktopPage.locator('text="Top Visited Websites"').first().isVisible();
  const categoryBreakdown = await desktopPage.locator('text="Category Breakdown"').first().isVisible();
  console.log(`  Visits Over Time header visible: ${visitsLineChart}`);
  console.log(`  Top Visited Websites header visible: ${topWebsites}`);
  console.log(`  Category Breakdown header visible: ${categoryBreakdown}`);

  // Check Slide mode switch
  console.log("  Switching to Slides Mode...");
  await desktopPage.locator('button:has-text("Slides")').click();
  await desktopPage.waitForTimeout(1000);
  const slide0Recharts = await desktopPage.locator(".recharts-responsive-container, .recharts-surface").count();
  console.log(`  Slide 0 Recharts count: ${slide0Recharts}`);

  // Check Range buttons
  await desktopPage.locator('button:has-text("7D")').first().click();
  await desktopPage.waitForTimeout(500);
  console.log("  Range filter 7D clicked successfully");

  // Switch back to Dashboard
  await desktopPage.locator('button:has-text("Dashboard")').click();
  await desktopPage.waitForTimeout(1000);

  // Check errors
  console.log("\n[4/4] Checking Console and Page Errors...");
  console.log(`  Desktop errors: ${desktopErrors.length}`);
  desktopErrors.forEach((e) => console.log("   - ", e));

  await browser.close();
  if (desktopErrors.length > 0) process.exit(1);

  console.log("\n=========================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO ERRORS.");
  console.log("=========================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
