"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, actionError, actionSuccess } from "@/lib/actions";

export async function addIncome(projectId: string, formData: FormData): Promise<ActionResult> {
  const concept = (formData.get("concept") as string)?.trim();
  const amountStr = formData.get("amount") as string;
  const dateStr = formData.get("date") as string;
  const type = formData.get("type") as string;
  const contributor = (formData.get("contributor") as string)?.trim();

  if (!concept) return actionError("El concepto es obligatorio.");
  if (!amountStr) return actionError("El importe es obligatorio.");
  if (!dateStr) return actionError("La fecha es obligatoria.");
  if (!type) return actionError("El tipo de ingreso es obligatorio.");

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return actionError("El importe debe ser un número positivo.");

  try {
    await prisma.income.create({
      data: {
        concept,
        amount,
        date: new Date(dateStr),
        type,
        contributor: contributor || null,
        projectId,
      },
    });
  } catch {
    return actionError("No se pudo registrar el ingreso.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/ingresos");
  return actionSuccess();
}

export async function removeIncome(projectId: string, incomeId: string): Promise<ActionResult> {
  try {
    await prisma.income.delete({ where: { id: incomeId } });
  } catch {
    return actionError("No se pudo eliminar el ingreso.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/ingresos");
  return actionSuccess();
}
