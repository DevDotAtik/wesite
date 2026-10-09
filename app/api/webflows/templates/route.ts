import type { NextRequest } from "next/server";
import { apiError, json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";
import { BUILT_IN_TEMPLATES } from "@/lib/webflow/templates";

export async function GET() {
  return json({ templates: BUILT_IN_TEMPLATES });
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const templateId = body.templateId || body.templateKey || body.id;

    if (!templateId) {
      return apiError("Missing template ID", 400);
    }

    const template = BUILT_IN_TEMPLATES.find(
      (t) =>
        t.id === templateId ||
        t.name.toLowerCase() === String(templateId).toLowerCase()
    );
    if (!template) {
      return apiError(`Template "${templateId}" not found`, 404);
    }

    await connectToDatabase();

    const created = await WebFlow.create({
      userId: user._id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      visibility: "private",
      isTemplate: false,
      nodes: template.nodes,
      edges: template.edges,
      variables: template.variables,
      authorName: user.name || "Wesite User",
      version: 1,
      versions: [
        {
          versionNumber: 1,
          savedAt: new Date(),
          note: `Created from "${template.name}" template`,
          snapshot: {
            nodes: template.nodes,
            edges: template.edges,
            variables: template.variables,
          },
        },
      ],
    });

    return json({ webflow: serializeDocument(created) }, 201);
  } catch (err) {
    console.error("POST /api/webflows/templates exception:", err);
    return apiError((err as Error).message || "Could not instantiate template", 500);
  }
}
