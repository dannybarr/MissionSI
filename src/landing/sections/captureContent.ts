/** What Mission captures. Original subjects — not Ghost's icon set. */

export type CaptureId =
  "email" | "calendar" | "files" | "knowledge" | "location" | "notes" | "voice" | "fitness";

export interface CaptureItem {
  id: CaptureId;
  label: string;
  /** Where it sits around the centred card, as percentages of the stage. */
  x: string;
  y: string;
}

export interface CaptureTab {
  id: "digital" | "life" | "health";
  label: string;
  caption: string;
  items: CaptureItem[];
}

export const CAPTURE_TABS: CaptureTab[] = [
  {
    id: "digital",
    label: "Digital",
    caption: "Captures the mail, dates, files, and notes you choose to keep.",
    items: [
      { id: "email", label: "Email", x: "14%", y: "24%" },
      { id: "calendar", label: "Calendar", x: "18%", y: "68%" },
      { id: "files", label: "Files", x: "84%", y: "22%" },
      { id: "knowledge", label: "Knowledge", x: "80%", y: "66%" },
    ],
  },
  {
    id: "life",
    label: "Life",
    caption: "Captures where you are, what was said, and the voice you record.",
    items: [
      { id: "location", label: "Location", x: "16%", y: "30%" },
      { id: "notes", label: "Notes", x: "82%", y: "28%" },
      { id: "voice", label: "Voice", x: "78%", y: "70%" },
    ],
  },
  {
    id: "health",
    label: "Health",
    caption: "Captures movement and recovery when you connect a tracker.",
    items: [{ id: "fitness", label: "Fitness", x: "18%", y: "42%" }],
  },
];
