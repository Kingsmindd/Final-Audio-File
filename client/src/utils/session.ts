export const SESSION_CLEARED_EVENT = "audiophile:session-cleared";

// End authentication without deleting saved account or guest bags.
export function clearClientSession(): void {
  localStorage.removeItem("audiophile-user");
  window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
}
