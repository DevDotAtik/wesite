import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, parsePagination, requireUser, serializeDocument, escapeRegex } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { todoCreateSchema } from "@/lib/validators/schemas";
import Todo from "@/models/Todo";
import Website from "@/models/Website";
import Folder from "@/models/Folder";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const searchParams = request.nextUrl.searchParams;
  const { limit, page } = parsePagination(searchParams, 100, 100);
  const status = searchParams.get("status") ?? "open";
  const websiteId = searchParams.get("websiteId");
  const folderId = searchParams.get("folderId");
  const search = searchParams.get("search");
  const baseQuery: Record<string, unknown> = { userId: auth.user._id };
  const query: Record<string, unknown> = { userId: auth.user._id };

  if (status === "completed") {
    query.completedAt = { $ne: null };
  } else if (status === "open") {
    query.completedAt = null;
  }

  if (websiteId && websiteId !== "all") {
    const websiteFilter = websiteId === "unassigned" ? null : websiteId;
    if (websiteFilter && !isValidObjectId(websiteFilter)) return invalidIdResponse();
    query.websiteId = websiteFilter;
    baseQuery.websiteId = websiteFilter;
  }

  if (folderId && folderId !== "all") {
    const folderFilter = folderId === "unassigned" ? null : folderId;
    if (folderFilter && !isValidObjectId(folderFilter)) return invalidIdResponse();
    query.folderId = folderFilter;
    baseQuery.folderId = folderFilter;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { notes: { $regex: safeSearch, $options: "i" } },
    ];
    baseQuery.$or = query.$or;
  }

  const [todos, allTotal, openTotal, completedTotal] = await Promise.all([
    Todo.find(query)
      .populate("websiteId", "title domain url faviconUrl folderId")
      .populate("folderId", "name color icon")
      .sort({ completedAt: 1, dueAt: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Todo.countDocuments(baseQuery),
    Todo.countDocuments({ ...baseQuery, completedAt: null }),
    Todo.countDocuments({ ...baseQuery, completedAt: { $ne: null } }),
  ]);

  return json({
    todos: serializeDocument(todos),
    pagination: { page, limit },
    totals: {
      all: allTotal,
      open: openTotal,
      completed: completedTotal,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, todoCreateSchema);

  if (error) return error;

  await connectToDatabase();

  let resolvedFolderId = data.folderId ?? null;

  if (data.folderId) {
    const folder = await Folder.findOne({ _id: data.folderId, userId: auth.user._id }).select("_id").lean();
    if (!folder) {
      return apiError("Folder not found", 404);
    }
  }

  if (data.websiteId) {
    const website = await Website.findOne({ _id: data.websiteId, userId: auth.user._id }).select("_id folderId").lean();
    if (!website) {
      return apiError("Website not found", 404);
    }
    // Auto-inherit folder from website if not explicitly specified
    if (!resolvedFolderId && website.folderId) {
      resolvedFolderId = website.folderId.toString();
    }
  }

  const todoDoc = await Todo.create({
    userId: auth.user._id,
    title: data.title,
    notes: data.notes ?? "",
    folderId: resolvedFolderId,
    websiteId: data.websiteId ?? null,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
  });

  const todo = await Todo.findById(todoDoc._id)
    .populate("websiteId", "title domain url faviconUrl folderId")
    .populate("folderId", "name color icon")
    .lean();

  return json({ todo: serializeDocument(todo) }, 201);
}
