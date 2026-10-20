import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { verifyAuthToken, AUTH_COOKIE } from "@/lib/auth";
import Todo from "@/models/Todo";
import User from "@/models/User";
import { generateCalendarFeed } from "@/lib/googleCalendar";

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // 1. Try Bearer token in header
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = verifyAuthToken(authHeader.slice(7).trim());
        userId = payload.userId;
      } catch {}
    }

    // 2. Try cookie
    if (!userId) {
      const cookie = request.cookies.get(AUTH_COOKIE)?.value;
      if (cookie) {
        try {
          const payload = verifyAuthToken(cookie);
          userId = payload.userId;
        } catch {}
      }
    }

    // 3. Try ?token= query parameter (for Google Calendar URL subscriptions)
    if (!userId) {
      const queryToken = request.nextUrl.searchParams.get("token");
      if (queryToken) {
        try {
          const payload = verifyAuthToken(queryToken);
          userId = payload.userId;
        } catch {}
      }
    }

    if (!userId) {
      return new Response("Unauthorized calendar access", { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId).select("_id").lean();
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Fetch all open tasks with deadlines for this user
    const todos = await Todo.find({
      userId: user._id,
      completedAt: null,
      dueAt: { $ne: null },
    })
      .populate("websiteId", "title domain url")
      .populate("folderId", "name color")
      .sort({ dueAt: 1 })
      .lean();

    const formattedTasks = todos.map((t) => {
      const site = t.websiteId as { title?: string; domain?: string; url?: string } | null;
      const folder = t.folderId as { name?: string } | null;
      return {
        id: String(t._id),
        title: t.title,
        dueAt: new Date(t.dueAt!).toISOString(),
        notes: t.notes || "",
        website: site ? { title: site.title, domain: site.domain, url: site.url } : null,
        folder: folder ? { name: folder.name } : null,
      };
    });

    const icsContent = generateCalendarFeed(formattedTasks);

    return new Response(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="wesite-todos.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
}
