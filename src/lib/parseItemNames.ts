// Lets a comma-separated paste ("Zelt, Erste-Hilfe-Set, Grill") become
// several individual packing items instead of one item with commas in it.
export function parseItemNames(raw: string): string[] {
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
