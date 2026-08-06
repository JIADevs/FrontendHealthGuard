import { isApiError } from "./errors";

const DELEGATION_INVITE_ERROR_MESSAGES: Record<string, string> = {
    "User with the specified email not found":
        "No hay ninguna cuenta registrada con ese correo.",
    "You cannot delegate to yourself":
        "No puedes invitarte a ti mismo.",
    "A delegation request already exists between these users":
        "Ya existe una invitación pendiente o activa con esa persona.",
};

/** Maps backend delegation invite errors to user-facing Spanish copy. */
export function getDelegationInviteErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return DELEGATION_INVITE_ERROR_MESSAGES[error.message] ?? error.message;
    }
    if (error instanceof Error && error.message) {
        return DELEGATION_INVITE_ERROR_MESSAGES[error.message] ?? error.message;
    }
    return "Intenta de nuevo";
}
