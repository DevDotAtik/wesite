import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Monitor from "@/models/Monitor";
import { createHash } from "crypto";

const USER_AGENT = "Mozilla/5.0 (compatible; WesiteMonitor/1.0)";

function intervalToMs(interval: string): number {
  switch (interval) {
    case "hourly": return 60 * 60 * 1000;
    case "daily": return 24 * 60 * 60 * 1000;
    case "weekly": return 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function extractContent(html: string): { title: string; description: string; hash: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);

  const title = titleMatch?.[1]?.trim() || "";
  const description = metaMatch?.[1]?.trim() || "";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch?.[1]?.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";
  const hash = createHash("sha256").update(bodyContent).digest("hex").slice(0, 32);

  return { title, description, hash };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();

  const monitors = await Monitor.find({ userId: auth.user._id, enabled: true });
  const now = new Date();
  let checked = 0;
  let changed = 0;

  for (const monitor of monitors) {
    const intervalMs = intervalToMs(monitor.interval);
    if (monitor.lastCheckedAt && (now.getTime() - monitor.lastCheckedAt.getTime()) < intervalMs) {
      continue;
    }

    checked++;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(monitor.url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        redirect: "follow",
      });
      clearTimeout(timer);

      if (!response.ok) {
        await Monitor.findByIdAndUpdate(monitor._id, { lastCheckedAt: now });
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        await Monitor.findByIdAndUpdate(monitor._id, { lastCheckedAt: now });
        continue;
      }

      const html = await response.text();
      const { title, description, hash } = extractContent(html);
      const hasChanged = monitor.lastContentHash && hash !== monitor.lastContentHash;

      if (hasChanged) {
        changed++;
        await Monitor.findByIdAndUpdate(monitor._id, {
          $set: {
            lastCheckedAt: now,
            lastContentHash: hash,
            lastTitle: title || monitor.lastTitle,
            lastDescription: description || monitor.lastDescription,
          },
          $inc: { changeCount: 1 },
          $push: {
            changes: {
              $each: [{
                detectedAt: now,
                title,
                description,
                httpStatus: response.status,
                contentHash: hash,
              }],
              $slice: -100,
            },
          },
        });
      } else {
        await Monitor.findByIdAndUpdate(monitor._id, {
          $set: {
            lastCheckedAt: now,
            lastContentHash: hash,
            lastTitle: title || monitor.lastTitle,
            lastDescription: description || monitor.lastDescription,
          },
        });
      }
    } catch {
      await Monitor.findByIdAndUpdate(monitor._id, { lastCheckedAt: now });
    }
  }

  return json({ checked, changed, total: monitors.length });
}
