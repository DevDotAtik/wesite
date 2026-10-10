import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { webflowAddWebsiteSchema } from "@/lib/validators/webflow-schemas";
import WebFlow from "@/models/WebFlow";
import Website from "@/models/Website";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const { user, response } = await requireUser(request);
    if (response) return response;

    const { data, error } = await parseBody(request, webflowAddWebsiteSchema);
    if (error) return error;

    await connectToDatabase();

    const [webflow, website] = await Promise.all([
      WebFlow.findOne({ _id: id, userId: user._id }),
      Website.findOne({ _id: data.websiteId, userId: user._id }).lean(),
    ]);

    if (!webflow) return apiError("WebFlow not found or access denied", 404);
    if (!website) return apiError("Website not found in your saved library", 404);

    // Compute intelligent canvas placement
    let x = 100;
    let y = 150;

    if (data.position) {
      x = data.position.x;
      y = data.position.y;
    } else if (webflow.nodes && webflow.nodes.length > 0) {
      const maxX = Math.max(...webflow.nodes.map((n) => (n.position ? n.position.x : 0)));
      const lastNode = webflow.nodes[webflow.nodes.length - 1];
      x = maxX + 300;
      y = (lastNode && lastNode.position) ? lastNode.position.y : 150;
    }

    const newNodeId = `node_site_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "websiteNode",
      position: { x, y },
      data: {
        label: website.title || website.domain || "Website Tool",
        kind: "website",
        description: website.description || "",
        websiteId: website._id.toString(),
        websiteUrl: website.url,
        websiteTitle: website.title,
        websiteDomain: website.domain,
        websiteFaviconUrl: website.faviconUrl || website.customIconUrl,
        websiteThumbnailUrl: website.ogImageUrl || (website.url ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(website.url.startsWith("http") ? website.url : "https://" + website.url)}?w=800` : undefined),
        action: data.action || "Open and use website",
        status: "configured",
      },
    };

    webflow.nodes.push(newNode as unknown as (typeof webflow.nodes)[number]);
    await webflow.save();

    return json({
      node: newNode,
      webflow: serializeDocument(webflow),
    }, 201);
  } catch (err) {
    console.error("POST /api/webflows/[id]/add-website exception:", err);
    return apiError((err as Error).message || "Could not add website to WebFlow", 500);
  }
}
