import type { NextRequest } from "next/server";
import { apiError, json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    await connectToDatabase();

    const userWebflows = await WebFlow.find({ userId: user._id })
      .select("name visibility forkCount likeCount nodes updatedAt")
      .lean();

    const totalWebflows = userWebflows.length;
    const publicWebflows = userWebflows.filter((w) => w.visibility === "public").length;
    const totalRemixes = userWebflows.reduce((sum, w) => sum + (w.forkCount || 0), 0);
    const totalLikes = userWebflows.reduce((sum, w) => sum + (w.likeCount || 0), 0);

    // Count website usages
    const siteUsageMap = new Map<string, { count: number; name: string; url?: string; domain?: string; favicon?: string }>();

    userWebflows.forEach((flow) => {
      (flow.nodes || []).forEach((node: any) => {
        if (node.data?.kind === "website" && (node.data.websiteId || node.data.websiteUrl)) {
          const key = node.data.websiteId ? node.data.websiteId.toString() : node.data.websiteUrl;
          const current = siteUsageMap.get(key) || {
            count: 0,
            name: node.data.websiteTitle || node.data.label || "Website",
            url: node.data.websiteUrl,
            domain: node.data.websiteDomain,
            favicon: node.data.websiteFaviconUrl,
          };
          current.count += 1;
          siteUsageMap.set(key, current);
        }
      });
    });

    const sortedTools = Array.from(siteUsageMap.values()).sort((a, b) => b.count - a.count);
    const topTool = sortedTools[0] || null;

    return json({
      stats: {
        totalWebflows,
        publicWebflows,
        totalRemixes,
        totalLikes,
        topTool,
        popularTools: sortedTools.slice(0, 5),
      },
    });
  } catch (err) {
    console.error("GET /api/webflows/stats exception:", err);
    return apiError((err as Error).message || "Could not fetch WebFlow stats", 500);
  }
}
