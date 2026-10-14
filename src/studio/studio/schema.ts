import { z } from 'zod';
import { maxRecessFor, MIN_THICKNESS } from '@/studio/three/outline';
import { COMPONENT_ORDER, defaultDesign, markDefaults, MATERIAL_ORDER, MAX_MARKS } from './presets';
import { FONT_ORDER } from './fonts';
import { sanitizeSvg } from './svg';
import { ASSET_IDS, type AssetId } from './assets';
import type { BrandMark, Design, Project, Variant } from './types';

const num = (min: number, max: number) => z.number().finite().min(min).max(max);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #RRGGBB colour');

const materialSchema = z.object({
  preset: z.enum(MATERIAL_ORDER as [string, ...string[]]),
  color: hex,
  metalness: num(0, 1),
  roughness: num(0, 1),
  reflectivity: num(0, 3),
  direction: num(0, 180),
  brush: num(0, 1),
  grain: num(0, 1),
  clearcoat: num(0, 1),
});

const markSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().max(60),
  kind: z.enum(['text', 'svg', 'image']),
  side: z.enum(['front', 'back']),
  visible: z.boolean(),
  locked: z.boolean(),
  text: z.string().max(40),
  font: z.enum(FONT_ORDER as [string, ...string[]]),
  weight: num(100, 900),
  tracking: num(-10, 40),
  svg: z.string().max(400_000).nullable(),
  svgName: z.string().max(200).nullable(),
  asset: z.enum(ASSET_IDS as [AssetId, ...AssetId[]]).nullable(),
  finish: z.enum(['printed', 'engraved', 'embossed']),
  laser: z.enum(['frost', 'anneal', 'polish']),
  size: num(0.5, 60),
  x: num(-80, 80),
  y: num(-60, 60),
  rotation: num(-180, 180),
  depth: num(0, 0.6),
  color: hex,
});

const compSchema = z.object({ name: z.string().max(60), visible: z.boolean(), locked: z.boolean() });

const designSchema = z.object({
  geometry: z.object({
    width: num(40, 140),
    height: num(25, 100),
    thickness: num(1.2, 10),
    cornerRadius: num(0.5, 14),
    border: num(0.4, 4),
    trim: num(0.2, 3),
    recessDepth: num(0.05, 1.6),
    faceMargin: num(0.1, 2),
    chamfer: num(0.05, 1.2),
    chamferProfile: z.enum(['rounded', 'chamfer']),
    contourDepth: num(0, 4),
    contourLength: num(2, 30),
    contourOffset: num(-30, 30),
    sideDepth: num(0, 4),
    sideLength: num(2, 22),
    connectorPins: num(6, 48),
  }),
  body: materialSchema,
  backFace: z.object({ linked: z.boolean(), color: hex.nullable() }),
  trim: materialSchema,
  marks: z.array(markSchema).max(MAX_MARKS),
  lighting: z.object({
    env: z.enum(['studio', 'softbox', 'overcast', 'noir']),
    intensity: num(0, 6),
    reflection: num(0, 3),
    background: hex,
    shadows: z.boolean(),
    exposure: num(0.2, 3),
  }),
  components: z.object(
    Object.fromEntries(COMPONENT_ORDER.map((id) => [id, compSchema])) as Record<string, typeof compSchema>,
  ),
});

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Fill missing keys from defaults, recursively. Unknown keys are dropped later by zod. */
function mergeDefaults<T>(base: T, incoming: unknown): T {
  if (!isObj(base) || !isObj(incoming)) return (incoming === undefined ? base : incoming) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(base as Record<string, unknown>)) {
    if (key in incoming) out[key] = mergeDefaults((base as Record<string, unknown>)[key], incoming[key]);
  }
  return out as T;
}

export class ProjectImportError extends Error {}

function describe(issue: { path: PropertyKey[]; message: string }) {
  return `${issue.path.map(String).join('.') || 'root'}: ${issue.message}`;
}

/**
 * Format migration: projects saved before multi-mark branding stored a single
 * `branding` object with source 'wordmark' | 'custom' | 'none'. Both its text and its SVG are
 * preserved as separate marks; whichever was not the active source is kept but hidden.
 */
function migrateLegacyBranding(raw: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(raw.marks) || !isObj(raw.branding)) return raw;
  const b = raw.branding;
  const base = {
    finish: b.finish,
    laser: b.laser,
    size: b.size,
    x: b.x,
    y: b.y,
    rotation: b.rotation,
    depth: b.depth,
    color: b.color,
    weight: b.weight,
    tracking: b.tracking,
  };
  const marks: unknown[] = [];
  if (typeof b.text === 'string' && b.text.trim()) {
    marks.push({ ...base, id: 'm-legacy-text', name: 'Wordmark', kind: 'text', text: b.text, visible: b.source === 'wordmark' });
  }
  if (typeof b.svg === 'string' && b.svg) {
    marks.push({
      ...base,
      id: 'm-legacy-svg',
      name: typeof b.svgName === 'string' && b.svgName ? b.svgName.replace(/\.svg$/i, '').slice(0, 60) : 'Logo',
      kind: 'svg',
      svg: b.svg,
      svgName: b.svgName ?? null,
      visible: b.source === 'custom',
    });
  }
  const rest = { ...raw };
  delete rest.branding;
  return { ...rest, marks };
}

function normalizeMarks(raw: unknown, where: string): BrandMark[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length > MAX_MARKS) throw new ProjectImportError(`Invalid ${where} — more than ${MAX_MARKS} branding marks.`);
  const seen = new Set<string>();
  return raw.map((m, i) => {
    const filled = mergeDefaults(markDefaults(), m);
    let id = typeof filled.id === 'string' && filled.id ? filled.id.slice(0, 40) : `m-import-${i}`;
    if (seen.has(id) || id === 'm-default') id = `m-import-${i}-${seen.size}`;
    seen.add(id);
    let svg = filled.svg;
    if (typeof svg === 'string' && svg) {
      try {
        svg = sanitizeSvg(svg); // never trust stored/imported markup: previews inject it into the DOM
      } catch (e) {
        throw new ProjectImportError(`Invalid ${where} — mark ${i + 1} SVG: ${e instanceof Error ? e.message : 'unreadable'}`);
      }
    }
    const asset = typeof filled.asset === 'string' && (ASSET_IDS as string[]).includes(filled.asset) ? (filled.asset as AssetId) : null;
    const kind = (filled.kind === 'svg' && !svg) || (filled.kind === 'image' && !asset) ? 'text' : filled.kind;
    return { ...filled, id, svg: svg || null, asset, kind } as BrandMark;
  });
}

export function normalizeDesign(raw: unknown, where = 'design'): Design {
  const migrated = isObj(raw) ? migrateLegacyBranding(raw) : raw;
  const merged = mergeDefaults(defaultDesign(), migrated);
  if (isObj(migrated) && Array.isArray(migrated.marks)) merged.marks = normalizeMarks(migrated.marks, where);
  const res = designSchema.safeParse(merged);
  if (!res.success) {
    const first = res.error.issues[0];
    throw new ProjectImportError(`Invalid ${where} — ${describe(first)}`);
  }
  const d = res.data as Design;
  // the edge connector strip became a USB-C socket: older saves migrate automatically
  if (d.geometry.thickness < MIN_THICKNESS) d.geometry = { ...d.geometry, thickness: MIN_THICKNESS };
  if (d.geometry.recessDepth > maxRecessFor(d.geometry.thickness)) d.geometry = { ...d.geometry, recessDepth: +maxRecessFor(d.geometry.thickness).toFixed(2) };
  if (/^(edge )?connector$/i.test(d.components.connector.name.trim())) d.components.connector = { ...d.components.connector, name: 'USB-C port' };
  return d;
}

export function normalizeProject(raw: unknown): Project {
  if (!isObj(raw)) throw new ProjectImportError('File is not a Mission Studio project (expected a JSON object).');
  if (raw.app !== undefined && raw.app !== 'mission-studio') {
    throw new ProjectImportError(`This file was created by "${String(raw.app)}", not Mission Studio.`);
  }
  const body = isObj(raw.project) ? raw.project : raw;
  if (!Array.isArray(body.variants) || body.variants.length === 0) {
    throw new ProjectImportError('Project contains no design variants.');
  }
  if (body.variants.length > 64) throw new ProjectImportError('Project has more than 64 variants.');
  const seen = new Set<string>();
  const variants: Variant[] = body.variants.map((v: unknown, i: number) => {
    if (!isObj(v)) throw new ProjectImportError(`Variant ${i + 1} is malformed.`);
    let id = typeof v.id === 'string' && v.id ? v.id.slice(0, 40) : `v-import-${i}`;
    if (seen.has(id)) id = `${id}-${i}`;
    seen.add(id);
    return {
      id,
      name: typeof v.name === 'string' && v.name.trim() ? v.name.slice(0, 60) : `Variant ${i + 1}`,
      note: typeof v.note === 'string' ? v.note.slice(0, 120) : '',
      design: normalizeDesign(v.design, `variant "${String(v.name ?? i + 1)}"`),
      updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : Date.now(),
    };
  });
  const active = typeof body.activeVariantId === 'string' && seen.has(body.activeVariantId) ? body.activeVariantId : variants[0].id;
  return {
    version: 1,
    name: typeof body.name === 'string' && body.name.trim() ? body.name.slice(0, 80) : 'Imported project',
    variants,
    activeVariantId: active,
    savedAt: typeof body.savedAt === 'number' ? body.savedAt : null,
  };
}

export function serializeProject(project: Project): string {
  return JSON.stringify({ app: 'mission-studio', format: 1, exportedAt: new Date().toISOString(), project }, null, 2);
}
