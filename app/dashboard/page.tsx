import type { Metadata } from "next";
import WesiteApp from "@/components/WesiteApp";

export const metadata: Metadata = {
  title: "Library",
  description: "Browse and organize your saved websites.",
};

export default function DashboardPage() {
  return <WesiteApp />;
}
