import { clampFeature, FEATURE_BY_ID, featureIdFromSvgName, featureSvgName, FEATURES, type FeatureId } from '@/shared/card-features';
import { markDefaults } from './presets';
import type { BrandMark } from './types';

export const STATUS_DIM = '#4a4b50';
export const STATUS_LIT = '#eef6ff';

/** A hardware module as a branding mark: rendered, dragged and exported like any other mark. */
export function featureMark(id: FeatureId, x?: number, y?: number): Omit<BrandMark, 'id'> {
  const f = FEATURE_BY_ID[id];
  const at = clampFeature(id, x ?? f.home.x, y ?? f.home.y);
  const light = id === 'status';
  return {
    ...markDefaults(),
    name: f.label,
    kind: 'svg',
    svg: f.svg,
    svgName: featureSvgName(id),
    text: '',
    size: f.h,
    x: at.x,
    y: at.y,
    finish: light ? 'printed' : 'engraved',
    laser: 'frost',
    color: light ? STATUS_LIT : '#dfe3ea',
  };
}

export function wordmarkMark(x: number, y: number): Omit<BrandMark, 'id'> {
  return { ...markDefaults(), name: 'Wordmark', text: 'Mission', x, y, size: 6.2, color: '#f4f3ef' };
}

export function earthMark(x: number, y: number): Omit<BrandMark, 'id'> {
  return { ...markDefaults(), name: 'Earth', kind: 'image', asset: 'nasa-earth', text: '', svg: null, finish: 'printed', size: 10, x, y };
}

export function initialsMark(x: number, y: number): Omit<BrandMark, 'id'> {
  return { ...markDefaults(), name: 'Initials', text: 'DB', weight: 500, size: 7.2, color: '#d5d3cc', x, y };
}

export function featureOf(m: BrandMark): FeatureId | null {
  return m.kind === 'svg' ? featureIdFromSvgName(m.svgName) : null;
}

export function placedFeatures(marks: BrandMark[]) {
  return marks.flatMap((m) => {
    const id = featureOf(m);
    return id ? [{ id, x: m.x, y: m.y, markId: m.id }] : [];
  });
}

export { FEATURES, FEATURE_BY_ID };
