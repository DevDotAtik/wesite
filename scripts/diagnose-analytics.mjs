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
    {
      name: "auth_token",
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: "/",
    },
  ]);

  const page = await context.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("wesite_token", t);
  }, token);

  const consoleLogs = [];
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  const failedRequests = [];
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  page.on("response", async (res) => {
    if (res.url().includes("/api/")) {
      const status = res.status();
      console.log(`API Response: ${res.status()} ${res.url()}`);
      if (status >= 400) {
        try {
          const body = await res.text();
          console.log(`  Error Body: ${body}`);
        } catch {}
      }
    }
  });

  console.log("Navigating to /analytics...");
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(3000);

  // Check heading and content
  const heading = await page.locator("h1, h2").first().textContent();
  console.log(`Main heading: ${heading}`);

  // Check chart elements
  const svgs = await page.locator("svg").count();
  const canvases = await page.locator("canvas").count();
  console.log(`SVG elements found: ${svgs}, Canvas elements found: ${canvases}`);

  // Check for recharts or custom charts
  const rechartsWrappers = await page.locator(".recharts-responsive-container, .recharts-wrapper").count();
  console.log(`Recharts containers: ${rechartsWrappers}`);

  // Check text on page
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  console.log("Page text sample:\n", bodyText.slice(0, 400));

  console.log("\nConsole Logs (filtered):");
  consoleLogs.filter(l => l.includes("error") || l.includes("warn") || l.includes("Error") || l.includes("fetch")).forEach(l => console.log(l));

  console.log("\nFailed Network Requests:", failedRequests);

  await browser.close();
}

main().catch(console.error);
