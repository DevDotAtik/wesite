import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { webflowUpdateSchema } from "@/lib/validators/webflow-schemas";
import WebFlow from "@/models/WebFlow";
import WebFlowInteraction from "@/models/WebFlowInteraction";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectToDatabase();
    const webflow = await WebFlow.findById(id).lean();

    if (!webflow) {
      return apiError("WebFlow not found", 404);
    }

    const auth = await requireUser(request).catch(() => ({ user: null }));
    const currentUserId = auth.user?._id?.toString();
    const isOwner = Boolean(currentUserId && webflow.userId.toString() === currentUserId);

    if (!isOwner && webflow.visibility === "private") {
      return apiError("This WebFlow is private", 403);
    }

    // Atomically increment views if viewed by a non-owner
    if (!isOwner) {
      await WebFlow.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    }

    let isLiked = false;
    let isBookmarked = false;

    if (currentUserId) {
      const interactions = await WebFlowInteraction.find({
        userId: currentUserId,
        webFlowId: webflow._id,
      }).lean();

      interactions.forEach((item) => {
        if (item.type === "like") isLiked = true;
        if (item.type === "bookmark") isBookmarked = true;
      });
    }

    return json({
      webflow: {
        ...serializeDocument(webflow),
        isLiked,
        isBookmarked,
      },
      isOwner,
    });
  } catch (err) {
    console.error("GET /api/webflows/[id] exception:", err);
    return apiError((err as Error).message || "Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const { user, response } = await requireUser(request);
    if (response) return response;

    const { data, error } = await parseBody(request, webflowUpdateSchema);
    if (error) return error;

    await connectToDatabase();
    const webflow = await WebFlow.findOne({ _id: id, userId: user._id });

    if (!webflow) {
      return apiError("WebFlow not found or access denied", 404);
    }

    if (data.name !== undefined) webflow.name = data.name;
    if (data.description !== undefined) webflow.description = data.description;
    if (data.category !== undefined) webflow.category = data.category;
    if (data.tags !== undefined) webflow.tags = data.tags;
    if (data.visibility !== undefined) webflow.visibility = data.visibility;
    if (data.isTemplate !== undefined) webflow.isTemplate = data.isTemplate;
    if (data.nodes !== undefined) webflow.nodes = data.nodes as unknown as typeof webflow.nodes;
    if (data.edges !== undefined) webflow.edges = data.edges as unknown as typeof webflow.edges;
    if (data.variables !== undefined) webflow.variables = data.variables as unknown as typeof webflow.variables;
    if (data.viewport !== undefined) webflow.viewport = data.viewport;

    // Handle manual or important version creation
    if (data.saveVersionNote) {
      const nextVersion = (webflow.version || 1) + 1;
      webflow.version = nextVersion;
      if (!webflow.versions) (webflow as unknown as { versions: unknown[] }).versions = [];
      (webflow.versions as unknown as unknown[]).push({
        versionNumber: nextVersion,
        savedAt: new Date(),
        note: data.saveVersionNote,
        snapshot: {
          nodes: (webflow.nodes || []) as unknown as typeof webflow.nodes,
          edges: (webflow.edges || []) as unknown as typeof webflow.edges,
          variables: (webflow.variables || []) as unknown as typeof webflow.variables,
        },
      });
    }

    await webflow.save();

    return json({ webflow: serializeDocument(webflow) });
  } catch (err) {
    console.error("PATCH /api/webflows/[id] exception:", err);
    return apiError((err as Error).message || "Could not update WebFlow", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const { user, response } = await requireUser(request);
    if (response) return response;

    await connectToDatabase();
    const webflow = await WebFlow.findOneAndDelete({ _id: id, userId: user._id });

    if (!webflow) {
      return apiError("WebFlow not found or access denied", 404);
    }

    await WebFlowInteraction.deleteMany({ webFlowId: webflow._id });

    return json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/webflows/[id] exception:", err);
    return apiError((err as Error).message || "Could not delete WebFlow", 500);
  }
}
