import { prisma } from "@/lib/prisma";
import { GastosClient } from "./GastosClient";

export default async function GastosPage() {
  const expenses = await prisma.expense.findMany({
    include: { project: true },
    orderBy: { date: "desc" }
  });

  const serialized = expenses.map(e => ({
    id: e.id,
    concept: e.concept,
    amount: e.amount,
    date: e.date.toISOString(),
    invoiceNum: e.invoiceNum,
    category: e.category,
    projectId: e.projectId,
    projectTitle: e.project.title,
  }));

  return <GastosClient expenses={serialized} />;
}
