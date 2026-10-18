/**
 * Concept internals for the opened card. Matches the callouts on card-internals.png.
 * Flash is a concept only — never a shipped capacity.
 */

export type PartId =
  "nfc" | "gnss" | "mic" | "haptics" | "flash" | "bluetooth" | "usbc" | "battery" | "processor";

export interface OpenPart {
  id: PartId;
  /** Callout title, as on the reference board. */
  name: string;
  /** One-line callout under the title. */
  note: string;
  /** Extra cells in the Ghost-style strip under the product. */
  cells: string[];
  /** Which poster column the callout sits in. Flash is the centre inset. */
  column: "left" | "right" | "center";
}

export const OPEN_PARTS: OpenPart[] = [
  {
    id: "nfc",
    name: "NFC",
    note: "Contactless interface",
    cells: ["Contactless interface", "Coil on the board"],
    column: "left",
  },
  {
    id: "gnss",
    name: "Location",
    note: "GNSS receiver + antenna",
    cells: ["GNSS receiver", "Antenna on the board"],
    column: "left",
  },
  {
    id: "mic",
    name: "Microphone",
    note: "Miniature MEMS microphone",
    cells: ["Miniature MEMS microphone", "On the board"],
    column: "left",
  },
  {
    id: "haptics",
    name: "Haptics",
    note: "Tactile feedback actuator",
    cells: ["Tactile feedback actuator", "Coin motor"],
    column: "left",
  },
  {
    id: "flash",
    name: "Flash storage",
    note: "Concept — subject to engineering",
    cells: ["Concept — subject to engineering", "Not a shipped capacity"],
    column: "center",
  },
  {
    id: "bluetooth",
    name: "Bluetooth",
    note: "Low-energy wireless connectivity",
    cells: ["Low-energy wireless", "Connectivity"],
    column: "right",
  },
  {
    id: "usbc",
    name: "USB-C",
    note: "Wired laptop connection",
    cells: ["Wired laptop connection", "Built into the shell"],
    column: "right",
  },
  {
    id: "battery",
    name: "Power",
    note: "Thin rechargeable battery",
    cells: ["Thin rechargeable battery", "Under the board"],
    column: "right",
  },
  {
    id: "processor",
    name: "Processor",
    note: "System control + USB interface",
    cells: ["System control", "USB interface"],
    column: "right",
  },
];

export const OPEN_PART_BY_ID = Object.fromEntries(OPEN_PARTS.map((p) => [p.id, p])) as Record<
  PartId,
  OpenPart
>;

/** Shell finishes splitting, then focus walks the parts. */
export function partIndex(progress: number) {
  if (progress < 0.4) return -1;
  const t = Math.min(0.999, (progress - 0.4) / 0.55);
  return Math.floor(t * OPEN_PARTS.length);
}

export const CONCEPT_LINE = "Concept component layout · final integration subject to engineering";
