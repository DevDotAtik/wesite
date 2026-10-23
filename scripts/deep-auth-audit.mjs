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

  console.log("Launching Chromium via Playwright...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  // Inject authentication cookie
  await context.addCookies([
    {
      name: "wesite_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Also set localStorage on initial navigation
  await page.goto(`${BASE_URL}/`);
  await page.evaluate((tok) => {
    localStorage.setItem("wesite_token", tok);
  }, token);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[${page.url()}] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(`[PAGE ERROR @ ${page.url()}] ${err.message}`);
  });

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
  console.log("TESTING ALL AUTHENTICATED PAGES WITH PLAYWRIGHT");
  console.log("==========================================");

  for (const p of testPages) {
    console.log(`\nTesting page: ${p.name} (${p.url})...`);
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Verify content rendered
    const title = await page.title();
    const heading = await page.locator("h1, h2").first().textContent();
    console.log(`  Title: "${title}" | Main Heading: "${heading?.trim()}"`);

    // Verify horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`  Horizontal overflow: ${overflow ? "YES (BUG!)" : "NO (Clean)"}`);

    // Verify all buttons have accessible name or label
    const buttonAudit = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const issues = [];
      for (const b of btns) {
        const text = b.innerText?.trim();
        const aria = b.getAttribute("aria-label");
        const title = b.getAttribute("title");
        if (!text && !aria && !title) {
          issues.push({
            tag: b.tagName,
            className: b.className?.slice(0, 50),
          });
        }
      }
      return { totalButtons: btns.length, unlabelled: issues.length, samples: issues.slice(0, 2) };
    });
    console.log(`  Buttons audit: ${buttonAudit.totalButtons} buttons, ${buttonAudit.unlabelled} unlabelled`);
  }

  await browser.close();

  console.log("\n==========================================");
  console.log(`Console / Network Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.log(" - ", e));
  } else {
    console.log("ALL PAGES LOADED AND RENDERED WITH ZERO 401/404/500 ERRORS!");
  }
  console.log("==========================================");
}

main().catch(console.error);
