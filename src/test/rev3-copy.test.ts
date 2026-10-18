import { describe, expect, it } from "vitest";
import { CAPTURE_TABS } from "@/landing/sections/captures";
import { OPEN_PARTS } from "@/landing/sections/open-parts";

describe("revision 3 copy", () => {
  it("does not state a shipped storage capacity", () => {
    const text = JSON.stringify(OPEN_PARTS) + JSON.stringify(CAPTURE_TABS);
    expect(text).not.toMatch(/1\s?TB/i);
    expect(text).not.toMatch(/kioxia/i);
    const flash = OPEN_PARTS.find((p) => p.id === "flash");
    expect(flash?.note.toLowerCase()).toContain("concept");
    expect(flash?.note.toLowerCase()).toContain("engineering");
  });

  it("lists the internals and the capture subjects", () => {
    expect(OPEN_PARTS.map((p) => p.id)).toEqual([
      "nfc",
      "gnss",
      "mic",
      "haptics",
      "flash",
      "bluetooth",
      "usbc",
      "battery",
      "processor",
    ]);
    expect(CAPTURE_TABS.map((t) => t.label)).toEqual(["Digital", "Life", "Health"]);
    const icons = CAPTURE_TABS.flatMap((t) => t.items.map((i) => i.id));
    expect(icons.sort()).toEqual([
      "calendar",
      "email",
      "files",
      "fitness",
      "knowledge",
      "location",
      "notes",
      "voice",
    ]);
  });
});
