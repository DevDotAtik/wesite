import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const { user, response } = await requireUser(request);
    if (response) return response;

    await connectToDatabase();
    const sourceFlow = await WebFlow.findById(id).lean();

    if (!sourceFlow) {
      return apiError("Source WebFlow not found", 404);
    }

    const isOwner = sourceFlow.userId.toString() === user._id.toString();
    if (!isOwner && sourceFlow.visibility === "private") {
      return apiError("Cannot duplicate a private WebFlow", 403);
    }

    const duplicated = await WebFlow.create({
      userId: user._id,
      name: `Copy of ${sourceFlow.name}`,
      description: sourceFlow.description,
      category: sourceFlow.category,
      tags: sourceFlow.tags || [],
      visibility: "private",
      isTemplate: false,
      nodes: sourceFlow.nodes || [],
      edges: sourceFlow.edges || [],
      variables: sourceFlow.variables || [],
      viewport: sourceFlow.viewport || { x: 0, y: 0, zoom: 1 },
      authorName: user.name || "Wesite User",
      version: 1,
      versions: [
        {
          versionNumber: 1,
          savedAt: new Date(),
          note: `Duplicated from "${sourceFlow.name}"`,
          snapshot: {
            nodes: sourceFlow.nodes || [],
            edges: sourceFlow.edges || [],
            variables: sourceFlow.variables || [],
          },
        },
      ],
    });

    return json({ webflow: serializeDocument(duplicated) }, 201);
  } catch (err) {
    console.error("POST /api/webflows/[id]/duplicate exception:", err);
    return apiError((err as Error).message || "Could not duplicate WebFlow", 500);
  }
}
