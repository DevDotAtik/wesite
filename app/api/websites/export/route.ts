import type { NextRequest } from "next/server";
import { requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Folder from "@/models/Folder";
import Website from "@/models/Website";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const [folders, websites] = await Promise.all([
    Folder.find({ userId: auth.user._id }).sort({ name: 1 }).lean(),
    Website.find({ userId: auth.user._id, isTrashed: false }).sort({ title: 1 }).lean(),
  ]);

  if (request.nextUrl.searchParams.get("format") === "html") {
    const links = websites
      .map(
        (website) =>
          `<DT><A HREF="${escapeHtml(website.url)}">${escapeHtml(website.title || website.domain)}</A>`,
      )
      .join("\n");
    return new Response(`<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<TITLE>Wesite Export</TITLE>\n<DL><p>\n${links}\n</DL><p>`, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": 'attachment; filename="wesite-bookmarks.html"',
      },
    });
  }

  return Response.json(
    { folders: serializeDocument(folders), websites: serializeDocument(websites) },
    {
      headers: {
        "Content-Disposition": 'attachment; filename="wesite-export.json"',
      },
    },
  );
}
