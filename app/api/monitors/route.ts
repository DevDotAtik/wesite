import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Monitor from "@/models/Monitor";
import Website from "@/models/Website";
import { z } from "zod";

const createMonitorSchema = z.object({
  websiteId: z.string().min(1),
  interval: z.enum(["hourly", "daily", "weekly"]).default("daily"),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const monitors = await Monitor.find({ userId: auth.user._id })
    .populate("websiteId", "title url domain faviconUrl")
    .sort({ createdAt: -1 })
    .lean();

  return json({ monitors: serializeDocument(monitors) });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, createMonitorSchema);

  if (error) return error;

  await connectToDatabase();

  const website = await Website.findOne({ _id: data.websiteId, userId: auth.user._id, isTrashed: false }).lean();
  if (!website) return apiError("Website not found", 404);

  const existing = await Monitor.findOne({ userId: auth.user._id, websiteId: data.websiteId });
  if (existing) return apiError("Already monitoring this website", 409);

  const monitor = await Monitor.create({
    userId: auth.user._id,
    websiteId: data.websiteId,
    url: website.url,
    title: website.title,
    interval: data.interval,
  });

  return json({ monitor: serializeDocument(monitor) }, 201);
}
