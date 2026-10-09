import type { NextRequest } from "next/server";
import { apiError, escapeRegex, json, parseBody, parsePagination, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { webflowCreateSchema } from "@/lib/validators/webflow-schemas";
import WebFlow from "@/models/WebFlow";
import Website from "@/models/Website";
import WebFlowInteraction from "@/models/WebFlowInteraction";
import { BUILT_IN_TEMPLATES } from "@/lib/webflow/templates";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const scope = searchParams.get("scope") || "my"; // "my" | "explore" | "templates"
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const websiteId = searchParams.get("websiteId");
    const { limit, page } = parsePagination(searchParams, 24, 60);

    const query: Record<string, unknown> = {};

    if (scope === "templates") {
      let templates = BUILT_IN_TEMPLATES;
      if (category && category !== "All") {
        templates = templates.filter((t) => t.category === category);
      }
      if (search) {
        const lower = search.toLowerCase();
        templates = templates.filter(
          (t) =>
            t.name.toLowerCase().includes(lower) ||
            t.description.toLowerCase().includes(lower) ||
            t.tags.some((tag) => tag.toLowerCase().includes(lower)),
        );
      }
      return json({
        webflows: templates,
        total: templates.length,
        page: 1,
        totalPages: 1,
      });
    }

    if (scope === "explore") {
      query.visibility = "public";
    } else {
      // "my" scope requires authenticated user
      const { user, response } = await requireUser(request);
      if (response) return response;
      query.userId = user._id;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (websiteId) {
      query["nodes.data.websiteId"] = websiteId;
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: rx }, { description: rx }, { tags: rx }, { category: rx }];
    }

    const [rawWebflows, total] = await Promise.all([
      WebFlow.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WebFlow.countDocuments(query),
    ]);

    // Check likes / bookmarks if authenticated
    const authUser = await requireUser(request).then((r) => r.user).catch(() => null);
    let interactionsMap = new Map<string, { liked?: boolean; bookmarked?: boolean }>();

    if (authUser && rawWebflows.length > 0) {
      const flowIds = rawWebflows.map((w) => w._id);
      const interactions = await WebFlowInteraction.find({
        userId: authUser._id,
        webFlowId: { $in: flowIds },
      }).lean();

      interactions.forEach((item) => {
        const idStr = item.webFlowId.toString();
        const current = interactionsMap.get(idStr) || {};
        if (item.type === "like") current.liked = true;
        if (item.type === "bookmark") current.bookmarked = true;
        interactionsMap.set(idStr, current);
      });
    }

    const webflows = rawWebflows.map((flow) => {
      const interaction = interactionsMap.get(flow._id.toString());
      return {
        ...serializeDocument(flow),
        isLiked: Boolean(interaction?.liked),
        isBookmarked: Boolean(interaction?.bookmarked),
      };
    });

    return json({
      webflows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error("GET /api/webflows exception:", err);
    return apiError((err as Error).message || "Could not fetch WebFlows", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    const { data, error } = await parseBody(request, webflowCreateSchema);
    if (error) return error;

    await connectToDatabase();

    const nodes = data.nodes ? [...data.nodes] : [];
    const edges = data.edges ? [...data.edges] : [];

    // If initialized from a saved website
    if (data.initialWebsiteId) {
      const site = await Website.findOne({ _id: data.initialWebsiteId, userId: user._id }).lean();
      if (site) {
        nodes.push({
          id: `node_site_${Date.now()}`,
          type: "websiteNode",
          position: { x: 100, y: 150 },
          data: {
            label: site.title || site.domain || "Website Tool",
            kind: "website",
            description: site.description || "",
            websiteId: site._id.toString(),
            websiteUrl: site.url,
            websiteTitle: site.title,
            websiteDomain: site.domain,
            websiteFaviconUrl: site.faviconUrl || site.customIconUrl,
            websiteThumbnailUrl: site.ogImageUrl || (site.url ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(site.url.startsWith("http") ? site.url : "https://" + site.url)}?w=800` : undefined),
            action: "Open and use website",
            status: "configured",
          },
        });
      }
    }

    const webflow = await WebFlow.create({
      userId: user._id,
      name: data.name,
      description: data.description || "",
      category: data.category || "Productivity",
      tags: data.tags || [],
      visibility: data.visibility || "private",
      isTemplate: Boolean(data.isTemplate),
      nodes,
      edges,
      variables: data.variables || [],
      authorName: user.name || "Wesite User",
      version: 1,
      versions: [
        {
          versionNumber: 1,
          savedAt: new Date(),
          note: "Initial creation",
          snapshot: {
            nodes,
            edges,
            variables: data.variables || [],
          },
        },
      ],
    });

    return json({ webflow: serializeDocument(webflow) }, 201);
  } catch (err) {
    console.error("POST /api/webflows exception:", err);
    return apiError((err as Error).message || "Could not create WebFlow", 500);
  }
}
