/**
 * Assert that the authenticated user owns the resource
 * Throws an error if ownership check fails
 */
export function assertOwnership(userId: string, resourceOwnerId: string): void {
  if (userId !== resourceOwnerId) {
    throw new Error("Acesso não autorizado: você não é o dono deste recurso.");
  }
}

/**
 * Check ownership without throwing (returns boolean)
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}
