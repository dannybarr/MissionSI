import type { AssetId } from './assets';
export type CompId =
  | 'chassis'
  | 'face'
  | 'recess'
  | 'perimeter'
  | 'chamfer'
  | 'topContour'
  | 'bottomContour'
  | 'sideContours'
  | 'connector'
  | 'logo'
  | 'details'
  | 'back';

export interface CompState {
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface GeometryParams {
  width: number; // mm
  height: number;
  thickness: number;
  cornerRadius: number;
  border: number; // outer perimeter rim width
  trim: number; // stepped inner trim width
  recessDepth: number;
  faceMargin: number; // gap between trim and face
  chamfer: number; // edge bevel radius
  chamferProfile: 'rounded' | 'chamfer';
  contourDepth: number; // top/bottom notch depth
  contourLength: number; // half length of top/bottom notch
  contourOffset: number; // mm offset of notch centre from card centre
  sideDepth: number;
  sideLength: number;
  connectorPins: number;
}

export type MaterialPreset =
  | 'brushedTitanium'
  | 'polishedSteel'
  | 'satinAluminium'
  | 'matteGraphite'
  | 'blackTitanium'
  | 'gunmetal'
  | 'champagne'
  | 'ceramicWhite';

export interface MaterialParams {
  preset: MaterialPreset;
  color: string;
  metalness: number;
  roughness: number;
  reflectivity: number; // env intensity multiplier
  direction: number; // degrees
  brush: number; // 0..1
  grain: number; // 0..1 bead-blast grain
  clearcoat: number;
}

export type MarkKind = 'text' | 'svg' | 'image';
export type MarkSide = 'front' | 'back';
export type LogoFinish = 'printed' | 'engraved' | 'embossed';
export type LaserFinish = 'frost' | 'anneal' | 'polish';
export type FontId =
  | 'geist'
  | 'geistMono'
  | 'instrumentSerif'
  | 'fraunces'
  | 'spaceGrotesk'
  | 'syne'
  | 'bricolage'
  | 'unbounded'
  | 'playfair'
  | 'cormorant'
  | 'jetbrainsMono';

/**
 * One branding mark (wordmark or SVG artwork). Coordinates are millimetres from the
 * face centre AS SEEN BY A VIEWER LOOKING AT THAT SIDE: +x is the viewer's right,
 * +y is up, rotation is counter-clockwise for that viewer. Back marks are mirrored
 * into model space only at render time.
 */
export interface BrandMark {
  id: string;
  name: string;
  kind: MarkKind;
  side: MarkSide;
  visible: boolean;
  locked: boolean;
  text: string;
  font: FontId;
  weight: number;
  tracking: number; // em * 100
  svg: string | null;
  svgName: string | null;
  /** Built-in photographic asset (kind 'image'); full natural colour, never recoloured. */
  asset: AssetId | null;
  finish: LogoFinish;
  laser: LaserFinish;
  size: number; // mm height
  x: number;
  y: number;
  rotation: number; // degrees
  depth: number; // emboss height mm
  color: string;
}

export type EnvPreset = 'studio' | 'softbox' | 'overcast' | 'noir';

export interface LightingParams {
  env: EnvPreset;
  intensity: number;
  reflection: number;
  background: string;
  shadows: boolean;
  exposure: number;
}

export interface BackFace {
  linked: boolean;
  color: string | null;
}

export interface Design {
  geometry: GeometryParams;
  body: MaterialParams;
  /** Back face colour override. Linked by default (and for older saves); `color` is kept while re-linked so toggling never loses a choice. null = never customised. */
  backFace: BackFace;
  trim: MaterialParams;
  marks: BrandMark[];
  lighting: LightingParams;
  components: Record<CompId, CompState>;
}

export interface Variant {
  id: string;
  name: string;
  note: string;
  design: Design;
  updatedAt: number;
}

export interface Project {
  version: 1;
  name: string;
  variants: Variant[];
  activeVariantId: string;
  savedAt: number | null;
}

export type CameraMode = 'perspective' | 'orthographic';
export type ViewPreset = 'front' | 'back' | 'side' | 'top' | 'iso';

export interface ViewSettings {
  camera: CameraMode;
  preset: ViewPreset;
  grid: boolean;
  guides: boolean;
  axes: boolean;
  ao: boolean;
  /** 'accurate' = unlit sRGB surfaces showing the exact chosen hex; 'studio' = PBR lighting. */
  shading: ShadingMode;
}

export type ShadingMode = 'accurate' | 'studio';

export type MaterialSlot = 'body' | 'trim';
