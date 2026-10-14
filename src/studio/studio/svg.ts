const MAX_BYTES = 300_000;
const ALLOWED = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'title', 'desc',
  'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'use', 'symbol', 'text', 'tspan',
]);
const URL_ATTRS = ['href', 'xlink:href'];

export class SvgError extends Error {}

/** Strip scripts, event handlers, external references and foreign content from an uploaded SVG. */
export function sanitizeSvg(input: string): string {
  if (input.length > MAX_BYTES) throw new SvgError(`SVG is ${(input.length / 1024).toFixed(0)} KB — limit is 300 KB.`);
  const doc = new DOMParser().parseFromString(input, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length) throw new SvgError('This file is not valid SVG markup.');
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== 'svg') throw new SvgError('Root element must be <svg>.');

  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!ALLOWED.has(child.nodeName.toLowerCase())) {
        child.remove();
        continue;
      }
      walk(child);
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      else if (URL_ATTRS.includes(name) && !val.startsWith('#')) el.removeAttribute(attr.name);
      else if (name === 'style' && /url\(|expression|javascript:/.test(val)) el.removeAttribute(attr.name);
      else if (/javascript:|data:text\/html/.test(val)) el.removeAttribute(attr.name);
    }
  };
  walk(root);

  if (!root.querySelector('path,rect,circle,ellipse,polygon,polyline,line,text')) {
    throw new SvgError('SVG contains no drawable shapes after sanitising.');
  }
  if (!root.getAttribute('viewBox')) {
    const w = parseFloat(root.getAttribute('width') || '');
    const h = parseFloat(root.getAttribute('height') || '');
    if (w > 0 && h > 0) root.setAttribute('viewBox', `0 0 ${w} ${h}`);
    else throw new SvgError('SVG needs a viewBox or width/height so it can be scaled.');
  }
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(root);
}

export function svgAspect(svg: string): number {
  const m = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
  if (!m) return 1;
  const p = m[1].split(/[\s,]+/).map(Number);
  return p[2] > 0 && p[3] > 0 ? p[2] / p[3] : 1;
}
