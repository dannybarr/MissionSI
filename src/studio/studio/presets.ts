import type {
  BrandMark,
  CompId,
  CompState,
  Design,
  EnvPreset,
  GeometryParams,
  LightingParams,
  MaterialParams,
  MaterialPreset,
  Project,
  Variant,
  ViewSettings,
} from './types';

export const COMPONENT_ORDER: CompId[] = [
  'chassis',
  'face',
  'recess',
  'perimeter',
  'chamfer',
  'topContour',
  'bottomContour',
  'sideContours',
  'connector',
  'logo',
  'details',
  'back',
];

export const DEFAULT_COMPONENT_NAMES: Record<CompId, string> = {
  chassis: 'Main chassis',
  face: 'Front face',
  recess: 'Inner recessed panel',
  perimeter: 'Outer perimeter',
  chamfer: 'Chamfered edges',
  topContour: 'Top contour',
  bottomContour: 'Bottom contour',
  sideContours: 'Side contours',
  connector: 'USB-C port',
  logo: 'Branding',
  details: 'Surface details',
  back: 'Back face',
};

export const TRIM_COMPONENTS: CompId[] = ['perimeter', 'chamfer', 'chassis'];

export function defaultComponents(): Record<CompId, CompState> {
  const out = {} as Record<CompId, CompState>;
  for (const id of COMPONENT_ORDER) {
    out[id] = { name: DEFAULT_COMPONENT_NAMES[id], visible: true, locked: false };
  }
  return out;
}

export const DEFAULT_GEOMETRY: GeometryParams = {
  width: 86,
  height: 55,
  thickness: 4.4, // thinnest card that hides a 2.6 mm USB-C opening under both recessed faces
  cornerRadius: 3.6,
  border: 1.15,
  trim: 0.85,
  recessDepth: 0.5,
  faceMargin: 0.35,
  chamfer: 0.45,
  chamferProfile: 'rounded',
  contourDepth: 1.55,
  contourLength: 9.5,
  contourOffset: -1.2,
  sideDepth: 1.35,
  sideLength: 8.5,
  connectorPins: 24, // legacy field, unused: the USB-C port has a fixed 2 x 12 contact layout
};

export interface MaterialPresetDef {
  label: string;
  note: string;
  params: Omit<MaterialParams, 'preset'>;
}

export const MATERIALS: Record<MaterialPreset, MaterialPresetDef> = {
  brushedTitanium: {
    label: 'Brushed titanium',
    note: 'Grade 5, linear grain',
    params: { color: '#b4b1aa', metalness: 1, roughness: 0.36, reflectivity: 1, direction: 0, brush: 0.75, grain: 0.15, clearcoat: 0 },
  },
  polishedSteel: {
    label: 'Polished stainless steel',
    note: '316L, mirror lap',
    params: { color: '#d4d6d9', metalness: 1, roughness: 0.07, reflectivity: 1.15, direction: 0, brush: 0.08, grain: 0, clearcoat: 0 },
  },
  satinAluminium: {
    label: 'Satin aluminium',
    note: '6061, bead blast + anodise',
    params: { color: '#c3c4c6', metalness: 1, roughness: 0.44, reflectivity: 1, direction: 0, brush: 0.18, grain: 0.8, clearcoat: 0 },
  },
  matteGraphite: {
    label: 'Matte graphite',
    note: 'Hard anodised, fine blast',
    params: { color: '#3d3f43', metalness: 0.85, roughness: 0.6, reflectivity: 0.9, direction: 0, brush: 0.1, grain: 0.7, clearcoat: 0 },
  },
  blackTitanium: {
    label: 'Black titanium',
    note: 'DLC coated, brushed',
    params: { color: '#232427', metalness: 1, roughness: 0.3, reflectivity: 1.05, direction: 0, brush: 0.6, grain: 0.1, clearcoat: 0.2 },
  },
  gunmetal: {
    label: 'Gunmetal',
    note: 'PVD, satin brush',
    params: { color: '#5b5e63', metalness: 1, roughness: 0.27, reflectivity: 1, direction: 0, brush: 0.45, grain: 0.1, clearcoat: 0 },
  },
  champagne: {
    label: 'Champagne metal',
    note: 'Gold-tone anodise',
    params: { color: '#d6c39f', metalness: 1, roughness: 0.32, reflectivity: 1, direction: 0, brush: 0.4, grain: 0.35, clearcoat: 0 },
  },
  ceramicWhite: {
    label: 'Ceramic white',
    note: 'Zirconia, soft polish',
    params: { color: '#ebe8e1', metalness: 0, roughness: 0.28, reflectivity: 0.8, direction: 0, brush: 0, grain: 0.05, clearcoat: 1 },
  },
  missionBlue: {
    label: 'Mission blue',
    note: 'Deep anodised blue, the card face',
    params: { color: '#17356f', metalness: 0.72, roughness: 0.42, reflectivity: 0.85, direction: 0, brush: 0.12, grain: 0.45, clearcoat: 0.08 },
  },
  matteGrey: {
    label: 'Matte grey',
    note: 'Soft bead-blast grey',
    params: { color: '#8a8884', metalness: 0.9, roughness: 0.62, reflectivity: 0.7, direction: 0, brush: 0.08, grain: 0.85, clearcoat: 0 },
  },
};

export const MATERIAL_ORDER = Object.keys(MATERIALS) as MaterialPreset[];

export function materialFromPreset(preset: MaterialPreset): MaterialParams {
  return { preset, ...MATERIALS[preset].params };
}

/** Polished trim counterpart for a body finish. */
export function trimFor(preset: MaterialPreset): MaterialParams {
  const base = materialFromPreset(preset);
  const darker = shade(base.color, preset === 'ceramicWhite' ? -0.06 : -0.18);
  return {
    ...base,
    color: darker,
    roughness: preset === 'ceramicWhite' ? 0.18 : 0.1,
    brush: 0.05,
    grain: 0,
    reflectivity: base.reflectivity * 1.1,
  };
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r);
  g = f(g);
  b = f(b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function newMarkId(): string {
  return 'm-' + uid();
}

/** Baseline values for every mark field; also used to fill fields missing from older files. */
export function markDefaults(): BrandMark {
  return {
    id: 'm-default',
    name: 'Wordmark',
    kind: 'text',
    side: 'front',
    visible: true,
    locked: false,
    text: 'Mission',
    font: 'geist',
    weight: 400,
    tracking: -2,
    svg: null,
    svgName: null,
    asset: null,
    finish: 'printed',
    laser: 'frost',
    size: 6.2,
    x: -22.5,
    y: 15.2,
    rotation: 0,
    depth: 0.12,
    color: '#f4f3ef',
  };
}

export function defaultMarks(): BrandMark[] {
  return [{ ...markDefaults(), id: 'm-wordmark' }];
}

/** Hard cap so localStorage stays within quota and the scene stays responsive. */
export const MAX_MARKS = 24;

export const ENV_PRESETS: Record<EnvPreset, { label: string; note: string }> = {
  studio: { label: 'Product studio', note: 'Overhead softbox, front fill' },
  softbox: { label: 'Twin softbox', note: 'Crisp edge highlights' },
  overcast: { label: 'Overcast', note: 'Flat, even, low contrast' },
  noir: { label: 'Noir strip', note: 'Single strip, deep falloff' },
};

export const DEFAULT_LIGHTING: LightingParams = {
  env: 'studio',
  intensity: 1.6,
  reflection: 1,
  background: '#eeeeec',
  shadows: true,
  exposure: 1.05,
};

/** Effective Back face material: shares every body parameter, with an optional own colour. */
export function backMaterial(d: Design): MaterialParams {
  return d.backFace.linked || !d.backFace.color ? d.body : { ...d.body, color: d.backFace.color };
}

/** Material that a mark on `side` sits on. */
export function faceMaterial(d: Design, side: 'front' | 'back'): MaterialParams {
  return side === 'back' ? backMaterial(d) : d.body;
}

export function defaultDesign(): Design {
  return {
    geometry: { ...DEFAULT_GEOMETRY },
    body: materialFromPreset('satinAluminium'),
    backFace: { linked: true, color: null },
    trim: { ...trimFor('polishedSteel'), color: '#8f9297' },
    marks: defaultMarks(),
    lighting: { ...DEFAULT_LIGHTING },
    components: defaultComponents(),
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function initialVariants(): Variant[] {
  const silver = defaultDesign();

  const graphite = defaultDesign();
  graphite.body = materialFromPreset('matteGraphite');
  graphite.trim = trimFor('gunmetal');
  graphite.marks = graphite.marks.map((m) => ({ ...m, color: '#d9d7d2', finish: 'engraved' as const, laser: 'frost' as const }));
  graphite.lighting = { ...graphite.lighting, background: '#e7e6e3' };

  const champagne = defaultDesign();
  champagne.body = materialFromPreset('champagne');
  champagne.trim = trimFor('champagne');
  champagne.marks = champagne.marks.map((m) => ({ ...m, color: '#fbf7ee', finish: 'printed' as const }));
  champagne.geometry = { ...champagne.geometry, cornerRadius: 4.4, contourDepth: 1.9 };
  champagne.lighting = { ...champagne.lighting, background: '#f0eee9', env: 'softbox' };

  const now = Date.now();
  return [
    { id: 'v-silver', name: 'Mission / Silver', note: 'Bead-blasted aluminium, polished rim', design: silver, updatedAt: now },
    { id: 'v-graphite', name: 'Mission / Graphite', note: 'Hard anodised, laser frosted mark', design: graphite, updatedAt: now },
    { id: 'v-champagne', name: 'Mission / Champagne', note: 'Gold-tone, deeper contours', design: champagne, updatedAt: now },
  ];
}

export function defaultProject(): Project {
  const variants = initialVariants();
  return {
    version: 1,
    name: 'Mission / Concept 001',
    variants,
    activeVariantId: variants[0].id,
    savedAt: null,
  };
}

export const DEFAULT_VIEW: ViewSettings = {
  camera: 'perspective',
  preset: 'front',
  grid: false,
  guides: false,
  axes: false,
  ao: true,
  shading: 'accurate',
};
