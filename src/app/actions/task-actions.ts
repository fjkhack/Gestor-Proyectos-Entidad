"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, actionError, actionSuccess } from "@/lib/actions";

export async function addAction(projectId: string, formData: FormData): Promise<ActionResult> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const dateStr = formData.get("date") as string;
  const participantId = formData.get("participantId") as string;

  if (!title) {
    return actionError("El título de la tarea es obligatorio.");
  }

  try {
    await prisma.action.create({
      data: {
        title,
        description: description || null,
        date: dateStr ? new Date(dateStr) : null,
        participantId: participantId === "none" ? null : participantId || null,
        projectId,
      },
    });
  } catch {
    return actionError("No se pudo crear la tarea.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/calendario");
  return actionSuccess();
}

export async function toggleAction(projectId: string, actionId: string, completed: boolean): Promise<ActionResult> {
  try {
    await prisma.action.update({
      where: { id: actionId },
      data: { completed },
    });
  } catch {
    return actionError("No se pudo actualizar la tarea.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/calendario");
  return actionSuccess();
}

export async function removeAction(projectId: string, actionId: string): Promise<ActionResult> {
  try {
    await prisma.action.delete({
      where: { id: actionId },
    });
  } catch {
    return actionError("No se pudo eliminar la tarea.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/calendario");
  return actionSuccess();
}
