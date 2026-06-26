import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { MindMapView } from "@/components/mind-map-view";

export const dynamic = "force-dynamic";

export default async function MindMapPage({
  params,
}: {
  params: Promise<{ courseId: string; mapId: string }>;
}) {
  const { courseId, mapId } = await params;
  const map = await prisma.mindMap.findUnique({ where: { id: mapId } });
  if (!map || map.courseId !== courseId) notFound();

  const data = JSON.parse(map.data) as {
    nodes: { id: string; label: string; group?: string }[];
    edges: { source: string; target: string; label?: string }[];
  };

  return (
    <div className="space-y-4">
      <Link
        href={`/courses/${courseId}`}
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to course
      </Link>
      <PageHeader
        title={map.title}
        description="Click a concept to highlight its connections."
      />
      <Card className="p-2">
        <MindMapView nodes={data.nodes} edges={data.edges} />
      </Card>
    </div>
  );
}
