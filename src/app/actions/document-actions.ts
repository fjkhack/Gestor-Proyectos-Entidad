"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, actionError, actionSuccess } from "@/lib/actions";

export async function addDocument(projectId: string, formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();

  if (!name) return actionError("El nombre del documento es obligatorio.");
  if (!url) return actionError("La URL es obligatoria.");

  try {
    await prisma.document.create({
      data: {
        name,
        url,
        projectId,
      },
    });
  } catch {
    return actionError("No se pudo registrar el documento.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/documentos");
  return actionSuccess();
}

export async function removeDocument(projectId: string, documentId: string): Promise<ActionResult> {
  try {
    await prisma.document.delete({
      where: { id: documentId },
    });
  } catch {
    return actionError("No se pudo eliminar el documento.");
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/documentos");
  return actionSuccess();
}
