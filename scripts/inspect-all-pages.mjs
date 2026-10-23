import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

const PAGES = [
  { path: "/", name: "Landing Page" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/analytics", name: "Analytics" },
  { path: "/webflow", name: "Webflow Hub" },
  { path: "/history", name: "History" },
  { path: "/monitoring", name: "Monitoring" },
  { path: "/todo", name: "Todo" },
  { path: "/news", name: "News" },
  { path: "/settings", name: "Settings" },
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
];

const VIEWPORTS = [
  { name: "Desktop", width: 1280, height: 800 },
  { name: "Mobile", width: 375, height: 667 },
];

async function main() {
  console.log("Starting Playwright Deep Page Inspector...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[Console Error] ${msg.text()}`);
    }
  });

  // 1. Attempt login so authenticated pages have live state
  console.log("Logging in as demo@wesite.local...");
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    if (await emailInput.count() > 0) {
      await emailInput.first().fill("demo@wesite.local");
      await passwordInput.first().fill("password123");
      await submitBtn.first().click();
      await page.waitForTimeout(1500);
      console.log("Logged in successfully. Current URL:", page.url());
    }
  } catch (err) {
    console.warn("Login step skipped or failed:", err.message);
  }

  const inspectionReport = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const p of PAGES) {
      const url = `${BASE_URL}${p.path}`;
      const pageErrors = [];
      const pageWarnings = [];

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(800);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const maxScrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const innerWidth = window.innerWidth;
          const isOverflowing = maxScrollWidth > innerWidth + 2;

          // Find which element specifically overflows
          let culprit = null;
          if (isOverflowing) {
            const allElements = document.querySelectorAll("*");
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 5) {
                culprit = {
                  tag: el.tagName,
                  className: el.className?.toString?.()?.slice(0, 80) || "",
                  right: rect.right,
                  text: el.textContent?.trim()?.slice(0, 40) || "",
                };
                break;
              }
            }
          }

          return { isOverflowing, maxScrollWidth, innerWidth, culprit };
        });

        if (overflow.isOverflowing) {
          pageWarnings.push(
            `Horizontal overflow detected! scrollWidth: ${overflow.maxScrollWidth}px vs window: ${overflow.innerWidth}px. Culprit: <${overflow.culprit?.tag} class="${overflow.culprit?.className}"> "${overflow.culprit?.text}"`
          );
        }

        // Check for broken buttons (buttons without text, aria-label, or title)
        const unlabelledButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          return buttons
            .filter((b) => {
              const text = b.innerText?.trim();
              const aria = b.getAttribute("aria-label");
              const title = b.getAttribute("title");
              return !text && !aria && !title;
            })
            .map((b) => ({
              tag: b.tagName,
              className: b.className?.slice(0, 50),
              parent: b.parentElement?.tagName,
            }));
        });

        if (unlabelledButtons.length > 0) {
          pageWarnings.push(
            `Found ${unlabelledButtons.length} unlabelled button(s) with no text, title or aria-label: ${JSON.stringify(unlabelledButtons.slice(0, 3))}`
          );
        }

        // Check for transparent dropdowns or sticky menus
        const transparentDropdowns = await page.evaluate(() => {
          const popovers = Array.from(document.querySelectorAll("[data-flow-menu], [data-monitor-menu], [role='menu'], .dropdown-menu"));
          const issues = [];
          for (const pop of popovers) {
            const bg = window.getComputedStyle(pop).backgroundColor;
            if (bg.includes("rgba") && bg.endsWith(", 0)") || bg === "transparent") {
              issues.push({ class: pop.className?.slice(0, 50), bg });
            }
          }
          return issues;
        });

        if (transparentDropdowns.length > 0) {
          pageWarnings.push(`Found transparent dropdowns: ${JSON.stringify(transparentDropdowns)}`);
        }

        console.log(`[${vp.name}] ${p.name} (${p.path}) -> ${pageWarnings.length === 0 ? "PASSED" : "ISSUES FOUND: " + pageWarnings.length}`);
        if (pageWarnings.length > 0) {
          pageWarnings.forEach((w) => console.log(`   - ${w}`));
        }

        inspectionReport.push({
          page: p.name,
          path: p.path,
          viewport: vp.name,
          warnings: pageWarnings,
        });

      } catch (err) {
        console.error(`[${vp.name}] Failed visiting ${p.path}:`, err.message);
        inspectionReport.push({
          page: p.name,
          path: p.path,
          viewport: vp.name,
          error: err.message,
        });
      }
    }
  }

  await browser.close();

  console.log("\n========================================");
  console.log("PLAYWRIGHT INSPECTION COMPLETE");
  console.log("========================================");
}

main().catch(console.error);
