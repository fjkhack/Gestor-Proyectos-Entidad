import { prisma } from "@/lib/prisma";
import { ParticipantesClient } from "./ParticipantesClient";

export default async function ParticipantesPage() {
  const participants = await prisma.participant.findMany({
    include: { project: true },
    orderBy: { name: "asc" }
  });

  const serialized = participants.map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    email: p.email,
    phone: p.phone,
    projectId: p.projectId,
    projectTitle: p.project.title,
  }));

  return <ParticipantesClient participants={serialized} />;
}
