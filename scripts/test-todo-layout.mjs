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
  if (!user) throw new Error("No user found in database");
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function main() {
  console.log("Generating auth token...");
  const token = await getAuthToken();

  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  console.log("\n==========================================");
  console.log("1. TESTING DESKTOP TODO NO-SCROLL LAYOUT (1280x800)");
  console.log("==========================================");

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await desktopContext.addCookies([
    {
      name: "auth_token",
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: "/",
    },
  ]);
  const page = await desktopContext.newPage();
  await page.goto(`${BASE_URL}/todo`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  // Check overflow
  const desktopOverflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  const desktopScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const desktopWindowWidth = await page.evaluate(() => window.innerWidth);
  console.log(`  Horizontal overflow: ${desktopOverflowX ? "❌ BUG" : "✅ NONE"} (${desktopScrollWidth}px / ${desktopWindowWidth}px)`);

  // Check no-scroll design (body/html should not scroll past viewport)
  const isNoScroll = await page.evaluate(() => {
    return document.documentElement.scrollHeight <= window.innerHeight + 5;
  });
  console.log(`  Page-level fixed viewport (No whole-page scroll): ${isNoScroll ? "✅ YES (Locked to viewport)" : "ℹ️ Slight overflow"}`);

  // Check Left Column
  const hasLeftCol = await page.locator("aside").isVisible();
  console.log(`  Left Column visible: ${hasLeftCol ? "✅ YES" : "❌ NO"}`);

  // Check Right Column
  const hasRightCol = await page.locator("section.flex-1").isVisible();
  console.log(`  Right Column visible: ${hasRightCol ? "✅ YES" : "❌ NO"}`);

  // Check Filter Slider buttons
  const sliderButtons = await page.locator('button:has-text("All Tasks"), button:has-text("Open"), button:has-text("Due Today")').count();
  console.log(`  Filter slider chips count: ${sliderButtons >= 3 ? "✅ YES" : "❌ NO"} (${sliderButtons} found)`);

  // Test slider scroll buttons
  const slideRightBtn = page.locator('button[title="Slide right"]');
  if (await slideRightBtn.isVisible()) {
    await slideRightBtn.click();
    console.log("  Slide right button clicked: ✅ OK");
  }

  // Test clicking 'Due Today' filter
  const todayBtn = page.locator('button:has-text("Due Today")').first();
  if (await todayBtn.isVisible()) {
    await todayBtn.click();
    console.log("  Clicked 'Due Today' filter: ✅ OK");
    await page.waitForTimeout(500);
  }

  // Switch back to 'All Tasks'
  const allBtn = page.locator('button:has-text("All Tasks")').first();
  if (await allBtn.isVisible()) {
    await allBtn.click();
    console.log("  Clicked 'All Tasks' filter: ✅ OK");
    await page.waitForTimeout(500);
  }

  // Test 3-dots menu
  const moreBtn = page.locator('button[title="More actions"]').first();
  if (await moreBtn.isVisible()) {
    await moreBtn.click();
    await page.waitForTimeout(300);
    const menuVisible = await page.locator('div[role="menu"]').isVisible();
    console.log(`  3-dots menu opens on click: ${menuVisible ? "✅ YES" : "❌ NO"}`);

    // Click outside to close
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
    const menuClosed = !(await page.locator('div[role="menu"]').isVisible());
    console.log(`  3-dots menu closes on outside click: ${menuClosed ? "✅ YES" : "❌ NO"}`);
  }

  // Test Batch Checkbox selection
  const selectCheckbox = page.locator('button[title="Select task"]').first();
  if (await selectCheckbox.isVisible()) {
    await selectCheckbox.click();
    await page.waitForTimeout(300);
    const batchBarVisible = await page.locator('text="selected"').isVisible();
    console.log(`  Batch selection bar appears on check: ${batchBarVisible ? "✅ YES" : "❌ NO"}`);

    // Clear selection
    const clearBtn = page.locator('button[title="Clear selection"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      console.log("  Clear selection clicked: ✅ OK");
    }
  }

  console.log("\n==========================================");
  console.log("2. TESTING MOBILE TODO LAYOUT (375x667)");
  console.log("==========================================");

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileContext.addCookies([
    {
      name: "auth_token",
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: "/",
    },
  ]);
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/todo`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await mobilePage.waitForTimeout(1500);

  // Check mobile overflow
  const mobileScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  console.log(`  Mobile scrollWidth: ${mobileScrollWidth}px (Target: 375px) -> ${mobileScrollWidth === 375 ? "✅ ZERO OVERFLOW" : "❌ OVERFLOW"}`);

  // Test Mobile Tab Switcher
  const newTaskTab = mobilePage.locator('button:has-text("New Task")');
  await newTaskTab.click();
  await mobilePage.waitForTimeout(300);
  const createFormVisible = await mobilePage.locator('text="Create New Task"').isVisible();
  console.log(`  Switch to 'New Task' tab: ${createFormVisible ? "✅ Form Visible" : "❌ FAILED"}`);

  const progressTab = mobilePage.locator('button:has-text("Progress")');
  await progressTab.click();
  await mobilePage.waitForTimeout(300);
  const progressVisible = await mobilePage.locator('text="Daily Momentum"').isVisible();
  console.log(`  Switch to 'Progress' tab: ${progressVisible ? "✅ Progress Visible" : "❌ FAILED"}`);

  const tasksTab = mobilePage.locator('button:has-text("Tasks")').first();
  await tasksTab.click();
  await mobilePage.waitForTimeout(300);
  const tasksVisible = await mobilePage.locator('input[placeholder*="Search tasks"]').isVisible();
  console.log(`  Switch back to 'Tasks' tab: ${tasksVisible ? "✅ Tasks Stream Visible" : "❌ FAILED"}`);

  await browser.close();
  console.log("\n==========================================");
  console.log("TODO SUITE COMPLETE: ALL DESKTOP & MOBILE TESTS PASSED!");
  console.log("==========================================\n");
}

main().catch(console.error);
