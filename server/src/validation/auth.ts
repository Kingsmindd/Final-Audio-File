// bcrypt uses at most 72 bytes; validate UTF-8 size rather than just characters.
export const cleanEmail = (value: string): string => value.trim().toLowerCase();
export function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.trim().length <= 254 &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());
}
export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && Buffer.byteLength(value, "utf8") <= 72;
}
