import type { DelegationRelationship } from "./schemas";

/** Whether the current user is the invitee who may accept or reject this request. */
export function isDelegationInbound(
    delegation: { inviteeEmail?: string },
    userEmail: string,
): boolean {
    const normalizedUser = userEmail.trim().toLowerCase();
    if (!normalizedUser) return false;

    const invitee = delegation.inviteeEmail?.trim().toLowerCase() ?? "";
    return invitee.length > 0 && invitee === normalizedUser;
}

type DelegationWithProfiles = {
    inviteeEmail?: string;
    dependent?: { email?: string } | null;
    manager?: { email?: string } | null;
};

/** Infers invite direction from invitee email vs manager/dependent profiles. */
export function inferDelegationRelationship(
    delegation: DelegationWithProfiles,
    currentUserEmail?: string,
): DelegationRelationship | null {
    const invitee = delegation.inviteeEmail?.trim().toLowerCase() ?? "";
    if (!invitee) return null;

    const dependentEmail = delegation.dependent?.email?.trim().toLowerCase();
    if (dependentEmail && invitee === dependentEmail) {
        return "I_WANT_TO_MANAGE_THEM";
    }

    const managerEmail = delegation.manager?.email?.trim().toLowerCase();
    if (managerEmail && invitee === managerEmail) {
        return "THEY_WILL_MANAGE_ME";
    }

    const userEmail = currentUserEmail?.trim().toLowerCase() ?? "";
    if (!userEmail) return null;

    const hasDependent = Boolean(delegation.dependent);
    const hasManager = Boolean(delegation.manager);

    if (invitee === userEmail && hasManager && !hasDependent) {
        return "I_WANT_TO_MANAGE_THEM";
    }
    if (invitee === userEmail && hasDependent && !hasManager) {
        return "THEY_WILL_MANAGE_ME";
    }
    if (invitee !== userEmail && hasDependent && !hasManager) {
        return "I_WANT_TO_MANAGE_THEM";
    }
    if (invitee !== userEmail && hasManager && !hasDependent) {
        return "THEY_WILL_MANAGE_ME";
    }

    return null;
}

/** Role of the person on the card, from the current user's perspective. */
export function getDelegationRoleLabel(
    relationship: DelegationRelationship,
    perspective: "inbound" | "outbound",
): "Paciente" | "Cuidador" {
    if (perspective === "outbound") {
        return relationship === "I_WANT_TO_MANAGE_THEM" ? "Paciente" : "Cuidador";
    }
    return relationship === "I_WANT_TO_MANAGE_THEM" ? "Cuidador" : "Paciente";
}

export type DelegationRelationshipLabels = {
    shortLabel: string;
    description: string;
};

/** User-facing copy for pending delegation cards (inbound invitee vs outbound inviter). */
export function getDelegationRelationshipLabels(
    relationship: DelegationRelationship,
    perspective: "inbound" | "outbound",
): DelegationRelationshipLabels {
    const shortLabel = getDelegationRoleLabel(relationship, perspective);

    if (relationship === "I_WANT_TO_MANAGE_THEM") {
        return {
            shortLabel,
            description:
                perspective === "outbound" ? "" : "Te invitaron como dependiente",
        };
    }

    return {
        shortLabel,
        description:
            perspective === "outbound" ? "" : "Te invitaron como cuidador",
    };
}
