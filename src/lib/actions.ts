// ──────────────────────────────────────────────
// Tipo de resultado para Server Actions
// ──────────────────────────────────────────────

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

export function actionError(message: string): ActionResult {
  return { success: false, error: message, message: message };
}

export function actionSuccess<T = unknown>(message?: string, data?: T): ActionResult<T> {
  return { success: true, message, data };
}
