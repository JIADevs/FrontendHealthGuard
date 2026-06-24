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
