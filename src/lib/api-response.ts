import { ActionResponse } from "@/types";

/**
 * Creates a success response for Server Actions.
 */
export function successResponse<T>(data: T, message?: string): ActionResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Creates an error response for Server Actions.
 */
export function errorResponse<T = void>(
  error: string,
  fieldErrors?: Record<string, string>
): ActionResponse<T> {
  return {
    success: false,
    error,
    fieldErrors,
  };
}

/**
 * Catches unknown errors and formats them into a clean string message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
}
