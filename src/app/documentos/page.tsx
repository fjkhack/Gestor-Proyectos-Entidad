import { prisma } from "@/lib/prisma";
import { DocumentosClient } from "./DocumentosClient";

export default async function DocumentosPage() {
  const documents = await prisma.document.findMany({
    include: { project: true },
    orderBy: { uploadDate: "desc" }
  });

  const serialized = documents.map(d => ({
    id: d.id,
    name: d.name,
    url: d.url,
    uploadDate: d.uploadDate.toISOString(),
    projectId: d.projectId,
    projectTitle: d.project.title,
  }));

  return <DocumentosClient documents={serialized} />;
}
