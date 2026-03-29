"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionResult, actionError, actionSuccess } from "@/lib/actions";

export async function createProject(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const idea = (formData.get("idea") as string)?.trim();
  const need = (formData.get("need") as string)?.trim();
  const objectives = (formData.get("objectives") as string)?.trim();
  const budgetStr = formData.get("budget") as string;

  if (!title) {
    throw new Error("El título es obligatorio");
  }

  const budget = budgetStr !== null && budgetStr !== "" ? parseFloat(budgetStr) : null;

  const project = await prisma.project.create({
    data: {
      title,
      idea: idea || null,
      need: need || null,
      objectives: objectives || null,
      budget: budget !== null && !isNaN(budget) ? budget : null,
      status: "IDEA",
    },
  });

  revalidatePath("/");
  revalidatePath("/proyectos");
  redirect(`/proyectos/${project.id}`);
}

export async function updateProject(id: string, formData: FormData): Promise<ActionResult> {
  const title = (formData.get("title") as string)?.trim();
  const idea = (formData.get("idea") as string)?.trim();
  const need = (formData.get("need") as string)?.trim();
  const objectives = (formData.get("objectives") as string)?.trim();
  const budgetStr = formData.get("budget") as string;

  if (!title) {
    return actionError("El título es obligatorio.");
  }

  const budget = budgetStr !== null && budgetStr !== "" ? parseFloat(budgetStr) : null;

  try {
    await prisma.project.update({
      where: { id },
      data: {
        title,
        idea: idea || null,
        need: need || null,
        objectives: objectives || null,
        budget: budget !== null && !isNaN(budget) ? budget : null,
      },
    });
  } catch {
    return actionError("No se pudo actualizar el proyecto.");
  }

  revalidatePath("/");
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
  return actionSuccess();
}

export async function updateProjectStatus(id: string, newStatus: string): Promise<ActionResult> {
  try {
    await prisma.project.update({
      where: { id },
      data: { status: newStatus },
    });
  } catch {
    return actionError("No se pudo cambiar el estado del proyecto.");
  }

  revalidatePath("/");
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
  return actionSuccess();
}

export async function updateProjectDates(id: string, formData: FormData) {
  const data: Record<string, Date | null> = {};
  const dateFields = [
    "callDate", "presentationDate", "resolutionDate",
    "startDate", "endDate", "publicityDate", "justificationDate"
  ];

  for (const field of dateFields) {
    const val = formData.get(field) as string;
    data[field] = val ? new Date(val) : null;
  }

  try {
    await prisma.project.update({
      where: { id },
      data,
    });
  } catch {
    throw new Error("No se pudieron guardar las fechas.");
  }

  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath(`/proyectos/${id}`);
  redirect(`/proyectos/${id}`);
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  if (!projectId) {
    return actionError("ID de proyecto no proporcionado.");
  }

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
  } catch {
    return actionError("No se pudo eliminar el proyecto.");
  }

  revalidatePath("/");
  revalidatePath("/proyectos");
  revalidatePath("/calendario");
  revalidatePath("/gastos");
  revalidatePath("/ingresos");
  revalidatePath("/participantes");
  revalidatePath("/documentos");
  return actionSuccess();
}
