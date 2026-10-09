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
    const webflow = await WebFlow.findById(id);
    if (!webflow) return apiError("WebFlow not found", 404);

    const existing = await WebFlowInteraction.findOne({
      userId: user._id,
      webFlowId: webflow._id,
      type: "like",
    });

    let liked = false;
    if (existing) {
      await WebFlowInteraction.findByIdAndDelete(existing._id);
      webflow.likeCount = Math.max(0, (webflow.likeCount || 1) - 1);
      liked = false;
    } else {
      await WebFlowInteraction.create({
        userId: user._id,
        webFlowId: webflow._id,
        type: "like",
      });
      webflow.likeCount = (webflow.likeCount || 0) + 1;
      liked = true;
    }

    await webflow.save();

    return json({ liked, likeCount: webflow.likeCount });
  } catch (err) {
    console.error("POST /api/webflows/[id]/like exception:", err);
    return apiError((err as Error).message || "Could not toggle like", 500);
  }
}
