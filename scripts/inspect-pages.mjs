import { chromium } from "playwright";

async function main() {
  console.log("Launching browser with chrome...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/");
  const title = await page.title();
  console.log("Page title:", title);
  await browser.close();
  console.log("Playwright test success!");
}

main().catch((err) => {
  console.error("Playwright error:", err);
  process.exit(1);
});
