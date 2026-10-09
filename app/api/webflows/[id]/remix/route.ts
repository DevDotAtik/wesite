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
    const original = await WebFlow.findById(id);

    if (!original) {
      return apiError("Original WebFlow not found", 404);
    }

    if (original.visibility === "private" && original.userId.toString() !== user._id.toString()) {
      return apiError("Cannot remix a private WebFlow", 403);
    }

    // Increment forkCount on original
    original.forkCount = (original.forkCount || 0) + 1;
    await original.save();

    const remixed = await WebFlow.create({
      userId: user._id,
      name: `${original.name} (Remix)`,
      description: original.description,
      category: original.category,
      tags: original.tags || [],
      visibility: "private",
      isTemplate: false,
      nodes: original.nodes || [],
      edges: original.edges || [],
      variables: original.variables || [],
      viewport: original.viewport || { x: 0, y: 0, zoom: 1 },
      forkedFromId: original._id,
      authorName: user.name || "Wesite User",
      version: 1,
      versions: [
        {
          versionNumber: 1,
          savedAt: new Date(),
          note: `Remixed from "${original.name}" by ${original.authorName || "author"}`,
          snapshot: {
            nodes: original.nodes || [],
            edges: original.edges || [],
            variables: original.variables || [],
          },
        },
      ],
    });

    return json({ webflow: serializeDocument(remixed) }, 201);
  } catch (err) {
    console.error("POST /api/webflows/[id]/remix exception:", err);
    return apiError((err as Error).message || "Could not remix WebFlow", 500);
  }
}
