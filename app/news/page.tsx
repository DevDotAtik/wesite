import type { Metadata } from "next";
import NewsPage from "@/components/NewsPage";

export const metadata: Metadata = {
  title: "News Feed",
  description: "Latest news and articles from your saved websites.",
};

export default function NewsPageRoute() {
  return <NewsPage />;
}
