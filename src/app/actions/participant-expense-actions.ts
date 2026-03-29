"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, actionError, actionSuccess } from "@/lib/actions";

export async function addParticipant(projectId: string, formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const role = formData.get("role") as string;
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name) return actionError("El nombre es obligatorio.");
  if (!role) return actionError("El rol es obligatorio.");

  try {
    await prisma.participant.create({
      data: {
        name,
        role,
        email: email || null,
        phone: phone || null,
        projectId,
      },
    });
  } catch {
    return actionError("No se pudo crear el participante.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/participantes");
  return actionSuccess();
}

export async function removeParticipant(projectId: string, participantId: string): Promise<ActionResult> {
  try {
    await prisma.participant.delete({
      where: { id: participantId },
    });
  } catch {
    return actionError("No se pudo eliminar el participante.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/participantes");
  return actionSuccess();
}

export async function addExpense(projectId: string, formData: FormData): Promise<ActionResult> {
  const concept = (formData.get("concept") as string)?.trim();
  const amountStr = formData.get("amount") as string;
  const dateStr = formData.get("date") as string;
  const invoiceNum = (formData.get("invoiceNum") as string)?.trim();
  const category = formData.get("category") as string;

  if (!concept) return actionError("El concepto es obligatorio.");
  if (!amountStr) return actionError("El importe es obligatorio.");
  if (!dateStr) return actionError("La fecha es obligatoria.");

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return actionError("El importe debe ser un número positivo.");

  try {
    await prisma.expense.create({
      data: {
        concept,
        amount,
        date: new Date(dateStr),
        invoiceNum: invoiceNum || null,
        category: category || "OTRO",
        projectId,
      },
    });
  } catch {
    return actionError("No se pudo registrar el gasto.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/gastos");
  return actionSuccess();
}

export async function removeExpense(projectId: string, expenseId: string): Promise<ActionResult> {
  try {
    await prisma.expense.delete({
      where: { id: expenseId },
    });
  } catch {
    return actionError("No se pudo eliminar el gasto.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/gastos");
  return actionSuccess();
}
