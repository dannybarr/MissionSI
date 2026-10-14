import type { CompId, GeometryParams, MarkSide, MaterialSlot } from './types';
import type { InspectorTab } from './store';

export type GeoKey = { [K in keyof GeometryParams]: GeometryParams[K] extends number ? K : never }[keyof GeometryParams];

export interface Capability {
  /** inspector tabs that actually affect this component (in MissionCard mesh mapping) */
  tabs: InspectorTab[];
  geo: GeoKey[];
  /** edge profile (chamferProfile) drives this mesh's bevel */
  profile: boolean;
  /** shared material slot this mesh renders with, or null if not user-editable here */
  slot: MaterialSlot | null;
  /** default side for new marks when branding is opened from this component */
  side?: MarkSide;
  /** short contextual disclosure */
  note?: string;
}

/** Mapping verified against three/MissionCard.tsx: trimMat = chassis/perimeter/chamfer/detail ring; bodyMat = face/back;
 * recess tone derived from trim colour; the USB-C port has its own fixed steel / gold contact materials. */
export const CAPS: Record<CompId, Capability> = {
  chassis: { tabs: ['geometry', 'material'], geo: ['width', 'height', 'thickness', 'cornerRadius', 'chamfer'], profile: true, slot: 'trim' },
  perimeter: { tabs: ['geometry', 'material'], geo: ['border', 'chamfer'], profile: true, slot: 'trim' },
  chamfer: { tabs: ['geometry', 'material'], geo: ['trim', 'chamfer'], profile: true, slot: 'trim' },
  recess: { tabs: ['geometry'], geo: ['recessDepth'], profile: false, slot: null, note: 'Recess tone is derived from the Rims & chassis colour (darkened). Edit it from a rim component.' },
  face: { tabs: ['geometry', 'material', 'branding'], geo: ['recessDepth', 'faceMargin'], profile: false, slot: 'body', side: 'front' },
  back: { tabs: ['material', 'branding'], geo: [], profile: false, slot: 'body', side: 'back', note: 'Back plate follows the card outline; it has no own dimensions.' },
  topContour: { tabs: ['geometry'], geo: ['contourDepth', 'contourLength', 'contourOffset'], profile: false, slot: null, note: 'Linked: top and bottom contours share these values.' },
  bottomContour: { tabs: ['geometry'], geo: ['contourDepth', 'contourLength', 'contourOffset'], profile: false, slot: null, note: 'Linked: top and bottom contours share these values.' },
  sideContours: { tabs: ['geometry'], geo: ['sideDepth', 'sideLength'], profile: false, slot: null, note: 'Both side cuts are mirrored and change together.' },
  connector: { tabs: ['geometry'], geo: [], profile: false, slot: null, note: 'Female USB-C socket (about 8.4 x 2.6 mm opening) centred on the right edge. Fixed size, hidden inside the edge (card is at least 4.4 mm thick); it follows the card when you resize. Hiding it hides the shell, tongue and contacts; the opening in the rim stays.' },
  logo: { tabs: ['branding'], geo: [], profile: false, slot: null },
  details: {
    tabs: [],
    geo: [],
    profile: false,
    slot: null,
    note: 'Micro-text and indicator ring have no adjustable parameters. Micro-text tone follows the body colour; the ring uses the Rims & chassis material. Use visibility and lock above.',
  },
};

export const ALL_TABS: InspectorTab[] = ['geometry', 'material', 'branding', 'lighting'];

export function tabsFor(sel: CompId | null): InspectorTab[] {
  return sel ? CAPS[sel].tabs : ALL_TABS;
}

/** Synchronous fallback: keep the current tab if supported, else the first supported one. */
export function resolveTab(sel: CompId | null, tab: InspectorTab): InspectorTab | null {
  const t = tabsFor(sel);
  return t.includes(tab) ? tab : (t[0] ?? null);
}

export const SLOT_USERS: Record<MaterialSlot, string> = {
  body: 'Front face, Back face, engraved marks and micro-text tone',
  trim: 'Main chassis, Outer perimeter, Chamfered edges, indicator ring and recess tone',
};
