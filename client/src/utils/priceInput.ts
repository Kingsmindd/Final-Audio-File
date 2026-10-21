// Keep the editable decimal text intact; add grouping only for display.
export function formatPriceInput(value: string): string {
  if (!value) return "";
  const [integer, fraction] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : grouped + "." + fraction;
}
export function parsePriceInput(value: string): string | null {
  const raw = value.replace(/[,₦\s]/g, "");
  if (!/^\d*(?:\.\d{0,2})?$/.test(raw)) return null;
  if (!raw) return "";
  const normalized = raw.startsWith(".") ? "0" + raw : raw;
  return normalized.replace(/^0+(?=\d)/, "");
}
