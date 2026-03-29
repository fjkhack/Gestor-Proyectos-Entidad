import { prisma } from "@/lib/prisma";
import { IngresosClient } from "./IngresosClient";

export default async function IngresosPage() {
  const incomes = await prisma.income.findMany({
    include: { project: true },
    orderBy: { date: "desc" }
  });

  const serialized = incomes.map(i => ({
    id: i.id,
    concept: i.concept,
    amount: i.amount,
    date: i.date.toISOString(),
    type: i.type,
    contributor: i.contributor,
    projectId: i.projectId,
    projectTitle: i.project.title,
  }));

  return <IngresosClient incomes={serialized} />;
}
