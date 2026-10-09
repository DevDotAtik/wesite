import { WebFlowEditor } from "@/components/webflow/WebFlowEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "WebFlow Editor | Wesite",
  description: "Visual node-based workflow designer, documenter, and AI agent exporter.",
};

export default async function WebFlowEditorPage({ params }: PageProps) {
  const { id } = await params;
  return <WebFlowEditor id={id} />;
}
