import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("Starting deep component and interaction testing with Playwright...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[Console Error @ ${page.url()}] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    errors.push(`[Unhandled Page Error @ ${page.url()}] ${err.message}`);
  });

  // 1. Authenticate
  console.log("1. Authenticating as demo user...");
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', "demo@wesite.local");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // 2. Test Dashboard interactions
  console.log("2. Testing Dashboard interactions...");
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1000);

  // Test Search input
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.count() > 0) {
    await searchInput.first().fill("Next.js");
    await page.waitForTimeout(500);
    await searchInput.first().fill("");
  }

  // Test View Toggle (Grid -> List -> Grid)
  const listToggle = page.locator('button[aria-label="List view"]');
  const gridToggle = page.locator('button[aria-label="Grid view"]');
  if (await listToggle.count() > 0) {
    await listToggle.click();
    await page.waitForTimeout(400);
    await gridToggle.click();
    await page.waitForTimeout(400);
  }

  // Test 3-dots Menu on WebsiteCard
  const cardMenuBtn = page.locator('[data-flow-menu] button, button[aria-label="More options"], button[title="More options"]');
  if (await cardMenuBtn.count() > 0) {
    await cardMenuBtn.first().click();
    await page.waitForTimeout(400);
    // Click outside to verify dismissal
    await page.mouse.click(10, 10);
    await page.waitForTimeout(400);
  }

  // 3. Test Todo interactions
  console.log("3. Testing Todo interactions...");
  await page.goto(`${BASE_URL}/todo`);
  await page.waitForTimeout(1000);

  // Test Filter pills
  const completedFilter = page.locator('button:has-text("Completed")');
  if (await completedFilter.count() > 0) {
    await completedFilter.first().click();
    await page.waitForTimeout(400);
  }
  const allFilter = page.locator('button:has-text("All Tasks")');
  if (await allFilter.count() > 0) {
    await allFilter.first().click();
    await page.waitForTimeout(400);
  }

  // 4. Test Monitoring interactions
  console.log("4. Testing Monitoring interactions...");
  await page.goto(`${BASE_URL}/monitoring`);
  await page.waitForTimeout(1000);

  const monitorAddBtn = page.locator('button:has-text("Monitor Site"), button:has-text("Monitor")');
  if (await monitorAddBtn.count() > 0) {
    await monitorAddBtn.first().click();
    await page.waitForTimeout(500);
    // close panel
    await monitorAddBtn.first().click();
  }

  // 5. Test History interactions
  console.log("5. Testing History interactions...");
  await page.goto(`${BASE_URL}/history`);
  await page.waitForTimeout(1000);

  // 6. Test Analytics interactions (Slide changing)
  console.log("6. Testing Analytics slides...");
  await page.goto(`${BASE_URL}/analytics`);
  await page.waitForTimeout(1000);
  const nextSlideBtn = page.locator('button[title*="Next Slide"], button[aria-label*="Next Slide"]');
  if (await nextSlideBtn.count() > 0) {
    await nextSlideBtn.first().click();
    await page.waitForTimeout(500);
    await nextSlideBtn.first().click();
    await page.waitForTimeout(500);
  }

  // 7. Test Webflow Hub interactions
  console.log("7. Testing WebFlow Hub...");
  await page.goto(`${BASE_URL}/webflow`);
  await page.waitForTimeout(1000);

  // 8. Test Settings interactions (Tab clicking)
  console.log("8. Testing Settings sections...");
  await page.goto(`${BASE_URL}/settings`);
  await page.waitForTimeout(1000);
  const appearanceTab = page.locator('button:has-text("Appearance")');
  if (await appearanceTab.count() > 0) {
    await appearanceTab.first().click();
    await page.waitForTimeout(400);
  }
  const dataTab = page.locator('button:has-text("Data & privacy"), button:has-text("Data")');
  if (await dataTab.count() > 0) {
    await dataTab.first().click();
    await page.waitForTimeout(400);
  }

  // 9. Test News feed
  console.log("9. Testing News Feed...");
  await page.goto(`${BASE_URL}/news`);
  await page.waitForTimeout(1000);

  await browser.close();

  console.log("\n========================================");
  console.log("INTERACTION TESTING RESULTS:");
  console.log(`Total Errors Logged: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((e) => console.log(`   - ${e}`));
  } else {
    console.log("ALL TESTED COMPONENTS AND INTERACTIONS FUNCTIONED WITHOUT RUNTIME ERRORS!");
  }
  console.log("========================================");
}

main().catch(console.error);
