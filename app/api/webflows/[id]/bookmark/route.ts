import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";
import WebFlowInteraction from "@/models/WebFlowInteraction";

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
    const webflow = await WebFlow.findById(id).lean();
    if (!webflow) return apiError("WebFlow not found", 404);

    const existing = await WebFlowInteraction.findOne({
      userId: user._id,
      webFlowId: webflow._id,
      type: "bookmark",
    });

    let bookmarked = false;
    if (existing) {
      await WebFlowInteraction.findByIdAndDelete(existing._id);
      bookmarked = false;
    } else {
      await WebFlowInteraction.create({
        userId: user._id,
        webFlowId: webflow._id,
        type: "bookmark",
      });
      bookmarked = true;
    }

    return json({ bookmarked });
  } catch (err) {
    console.error("POST /api/webflows/[id]/bookmark exception:", err);
    return apiError((err as Error).message || "Could not toggle bookmark", 500);
  }
}
