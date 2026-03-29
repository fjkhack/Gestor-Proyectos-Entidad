// ──────────────────────────────────────────────
// Constantes compartidas del proyecto
// ──────────────────────────────────────────────

// Estados de proyecto
export const PROJECT_STATUSES = {
  IDEA: { label: "💡 En Idea", shortLabel: "En Idea", color: "bg-purple-100 text-purple-700 border-purple-200" },
  EN_PROCESO: { label: "⚙️ En Proceso", shortLabel: "En Proceso", color: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETADO: { label: "✅ Completado", shortLabel: "Completado", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELADO: { label: "❌ Cancelado", shortLabel: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUSES;

export function getStatusInfo(status: string) {
  return PROJECT_STATUSES[status as ProjectStatus] ?? {
    label: status,
    shortLabel: status,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  };
}

// Tipos de ingreso
export const INCOME_TYPES = {
  SUBVENCION: { label: "Subvención", style: "bg-blue-100 text-blue-700" },
  COLABORACION: { label: "Colaboración", style: "bg-purple-100 text-purple-700" },
  VENTA: { label: "Venta / Actividad", style: "bg-orange-100 text-orange-700" },
  OTRO: { label: "Otro", style: "bg-gray-100 text-gray-700" },
} as const;

export type IncomeType = keyof typeof INCOME_TYPES;

export function getIncomeTypeInfo(type: string) {
  return INCOME_TYPES[type as IncomeType] ?? INCOME_TYPES.OTRO;
}

// Categorías de gastos
export const EXPENSE_CATEGORIES = {
  PERSONAL: { label: "Personal", style: "bg-blue-100 text-blue-700" },
  MATERIAL: { label: "Material", style: "bg-amber-100 text-amber-700" },
  SERVICIOS: { label: "Servicios Externos", style: "bg-purple-100 text-purple-700" },
  TRANSPORTE: { label: "Transporte / Viajes", style: "bg-emerald-100 text-emerald-700" },
  ALQUILER: { label: "Alquiler / Espacio", style: "bg-rose-100 text-rose-700" },
  COMUNICACION: { label: "Comunicación / Difusión", style: "bg-cyan-100 text-cyan-700" },
  OTRO: { label: "Otro", style: "bg-gray-100 text-gray-700" },
} as const;

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES;

export function getExpenseCategoryInfo(category: string) {
  return EXPENSE_CATEGORIES[category as ExpenseCategory] ?? EXPENSE_CATEGORIES.OTRO;
}

// Roles de participante
export const PARTICIPANT_ROLES = {
  PROFESIONAL: "Profesional",
  VOLUNTARIO: "Voluntario",
  ENTIDAD_COLABORADORA: "Entidad Colaboradora",
} as const;

// Campos de fecha del proyecto
export const PROJECT_DATE_FIELDS = [
  { key: "callDate", label: "Publicación Convocatoria" },
  { key: "presentationDate", label: "Límite Presentación" },
  { key: "resolutionDate", label: "Resolución" },
  { key: "startDate", label: "Inicio Ejecución" },
  { key: "endDate", label: "Fin Ejecución" },
  { key: "publicityDate", label: "Publicidad / Difusión" },
  { key: "justificationDate", label: "Límite Justificación" },
] as const;

// Formato de moneda
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €";
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}
