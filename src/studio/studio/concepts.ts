import type { AssetId } from './assets';

/**
 * Mission brand library. Earth and Moon are real NASA photographs (full natural colour, transparent cut-out discs);
 * Sun and Saturn are NASA images too; orbit diagrams remain single-colour vector schematics that take the mark ink like an uploaded SVG.
 */

export interface BrandConcept {
  id: string;
  name: string;
  family: 'Sun' | 'Earth' | 'Moon' | 'Saturn' | 'Orbit';
  idea: string;
  /** Vector concepts: single-colour SVG. */
  svg?: string;
  /** Photographic concepts: built-in asset id. */
  asset?: AssetId;
  /** Suggested lockup: wordmark placed beside the symbol when added "with wordmark". */
  lockup: { text: string; font: 'geist' | 'unbounded' | 'instrumentSerif' | 'spaceGrotesk' | 'syne'; weight: number; tracking: number };
}

const NS = 'xmlns="http://www.w3.org/2000/svg"';

const orbitPath = `<svg ${NS} viewBox="0 0 220 168">
<g fill="none" stroke="#000">
<circle cx="110" cy="84" r="34" stroke-width="1.1"/>
<circle cx="110" cy="84" r="72" stroke-width="1.1"/>
<g stroke-width="0.9"><line x1="182.0" y1="84.0" x2="185.2" y2="84.0"/><line x1="172.4" y1="120.0" x2="175.1" y2="121.6"/><line x1="146.0" y1="146.4" x2="147.6" y2="149.1"/><line x1="110.0" y1="156.0" x2="110.0" y2="159.2"/><line x1="74.0" y1="146.4" x2="72.4" y2="149.1"/><line x1="47.6" y1="120.0" x2="44.9" y2="121.6"/><line x1="38.0" y1="84.0" x2="34.8" y2="84.0"/><line x1="47.6" y1="48.0" x2="44.9" y2="46.4"/><line x1="74.0" y1="21.6" x2="72.4" y2="18.9"/><line x1="110.0" y1="12.0" x2="110.0" y2="8.8"/><line x1="146.0" y1="21.6" x2="147.6" y2="18.9"/><line x1="172.4" y1="48.0" x2="175.1" y2="46.4"/></g>
<path d="M 144 84 A 53.0 49.48 0 0 0 38 84" stroke-width="2.6" stroke-dasharray="5 3.2" stroke-linecap="round"/>
<path d="M 38.2 77 L 38 83.5 L 43.8 79.6" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M 139 89 L 149 89" stroke-width="1.6"/>
<path d="M 33 89 L 43 89" stroke-width="1.6"/>
<line x1="32" y1="84" x2="188" y2="84" stroke-width="0.6" stroke-dasharray="1 2.2"/>
</g>
<g fill="#000">
<circle cx="110" cy="84" r="8.5"/>
<circle cx="144" cy="84" r="4.6"/>
<circle cx="76.2" cy="20.4" r="5.4"/>
<circle cx="38" cy="84" r="2.2"/>
</g>
</svg>`;

const missionSeal = `<svg ${NS} viewBox="0 0 200 200">
<defs>
<mask id="ms-front"><rect width="200" height="200" fill="#fff"/><circle cx="100" cy="104" r="34" fill="#000"/></mask>
<mask id="ms-planet"><rect width="200" height="200" fill="#fff"/><path d="M 22 104 A 78 20 0 0 0 178 104" transform="rotate(-18 100 104)" fill="none" stroke="#000" stroke-width="7"/></mask>
<mask id="ms-moon"><rect width="200" height="200" fill="#fff"/><circle cx="146" cy="50" r="9.5" fill="#000"/></mask>
</defs>
<circle cx="100" cy="100" r="94" fill="none" stroke="#000" stroke-width="3.2"/>
<circle cx="100" cy="100" r="88" fill="none" stroke="#000" stroke-width="0.9"/>
<g stroke="#000"><line x1="186.0" y1="100.0" x2="181.0" y2="100.0" stroke-width="1.4"/><line x1="185.7" y1="107.5" x2="183.1" y2="107.3" stroke-width="0.8"/><line x1="184.7" y1="114.9" x2="182.1" y2="114.5" stroke-width="0.8"/><line x1="183.1" y1="122.3" x2="180.6" y2="121.6" stroke-width="0.8"/><line x1="180.8" y1="129.4" x2="178.4" y2="128.5" stroke-width="0.8"/><line x1="177.9" y1="136.3" x2="175.6" y2="135.2" stroke-width="0.8"/><line x1="174.5" y1="143.0" x2="170.1" y2="140.5" stroke-width="1.4"/><line x1="170.4" y1="149.3" x2="168.3" y2="147.8" stroke-width="0.8"/><line x1="165.9" y1="155.3" x2="163.9" y2="153.6" stroke-width="0.8"/><line x1="160.8" y1="160.8" x2="159.0" y2="159.0" stroke-width="0.8"/><line x1="155.3" y1="165.9" x2="153.6" y2="163.9" stroke-width="0.8"/><line x1="149.3" y1="170.4" x2="147.8" y2="168.3" stroke-width="0.8"/><line x1="143.0" y1="174.5" x2="140.5" y2="170.1" stroke-width="1.4"/><line x1="136.3" y1="177.9" x2="135.2" y2="175.6" stroke-width="0.8"/><line x1="129.4" y1="180.8" x2="128.5" y2="178.4" stroke-width="0.8"/><line x1="122.3" y1="183.1" x2="121.6" y2="180.6" stroke-width="0.8"/><line x1="114.9" y1="184.7" x2="114.5" y2="182.1" stroke-width="0.8"/><line x1="107.5" y1="185.7" x2="107.3" y2="183.1" stroke-width="0.8"/><line x1="100.0" y1="186.0" x2="100.0" y2="181.0" stroke-width="1.4"/><line x1="92.5" y1="185.7" x2="92.7" y2="183.1" stroke-width="0.8"/><line x1="85.1" y1="184.7" x2="85.5" y2="182.1" stroke-width="0.8"/><line x1="77.7" y1="183.1" x2="78.4" y2="180.6" stroke-width="0.8"/><line x1="70.6" y1="180.8" x2="71.5" y2="178.4" stroke-width="0.8"/><line x1="63.7" y1="177.9" x2="64.8" y2="175.6" stroke-width="0.8"/><line x1="57.0" y1="174.5" x2="59.5" y2="170.1" stroke-width="1.4"/><line x1="50.7" y1="170.4" x2="52.2" y2="168.3" stroke-width="0.8"/><line x1="44.7" y1="165.9" x2="46.4" y2="163.9" stroke-width="0.8"/><line x1="39.2" y1="160.8" x2="41.0" y2="159.0" stroke-width="0.8"/><line x1="34.1" y1="155.3" x2="36.1" y2="153.6" stroke-width="0.8"/><line x1="29.6" y1="149.3" x2="31.7" y2="147.8" stroke-width="0.8"/><line x1="25.5" y1="143.0" x2="29.9" y2="140.5" stroke-width="1.4"/><line x1="22.1" y1="136.3" x2="24.4" y2="135.2" stroke-width="0.8"/><line x1="19.2" y1="129.4" x2="21.6" y2="128.5" stroke-width="0.8"/><line x1="16.9" y1="122.3" x2="19.4" y2="121.6" stroke-width="0.8"/><line x1="15.3" y1="114.9" x2="17.9" y2="114.5" stroke-width="0.8"/><line x1="14.3" y1="107.5" x2="16.9" y2="107.3" stroke-width="0.8"/><line x1="14.0" y1="100.0" x2="19.0" y2="100.0" stroke-width="1.4"/><line x1="14.3" y1="92.5" x2="16.9" y2="92.7" stroke-width="0.8"/><line x1="15.3" y1="85.1" x2="17.9" y2="85.5" stroke-width="0.8"/><line x1="16.9" y1="77.7" x2="19.4" y2="78.4" stroke-width="0.8"/><line x1="19.2" y1="70.6" x2="21.6" y2="71.5" stroke-width="0.8"/><line x1="22.1" y1="63.7" x2="24.4" y2="64.8" stroke-width="0.8"/><line x1="25.5" y1="57.0" x2="29.9" y2="59.5" stroke-width="1.4"/><line x1="29.6" y1="50.7" x2="31.7" y2="52.2" stroke-width="0.8"/><line x1="34.1" y1="44.7" x2="36.1" y2="46.4" stroke-width="0.8"/><line x1="39.2" y1="39.2" x2="41.0" y2="41.0" stroke-width="0.8"/><line x1="44.7" y1="34.1" x2="46.4" y2="36.1" stroke-width="0.8"/><line x1="50.7" y1="29.6" x2="52.2" y2="31.7" stroke-width="0.8"/><line x1="57.0" y1="25.5" x2="59.5" y2="29.9" stroke-width="1.4"/><line x1="63.7" y1="22.1" x2="64.8" y2="24.4" stroke-width="0.8"/><line x1="70.6" y1="19.2" x2="71.5" y2="21.6" stroke-width="0.8"/><line x1="77.7" y1="16.9" x2="78.4" y2="19.4" stroke-width="0.8"/><line x1="85.1" y1="15.3" x2="85.5" y2="17.9" stroke-width="0.8"/><line x1="92.5" y1="14.3" x2="92.7" y2="16.9" stroke-width="0.8"/><line x1="100.0" y1="14.0" x2="100.0" y2="19.0" stroke-width="1.4"/><line x1="107.5" y1="14.3" x2="107.3" y2="16.9" stroke-width="0.8"/><line x1="114.9" y1="15.3" x2="114.5" y2="17.9" stroke-width="0.8"/><line x1="122.3" y1="16.9" x2="121.6" y2="19.4" stroke-width="0.8"/><line x1="129.4" y1="19.2" x2="128.5" y2="21.6" stroke-width="0.8"/><line x1="136.3" y1="22.1" x2="135.2" y2="24.4" stroke-width="0.8"/><line x1="143.0" y1="25.5" x2="140.5" y2="29.9" stroke-width="1.4"/><line x1="149.3" y1="29.6" x2="147.8" y2="31.7" stroke-width="0.8"/><line x1="155.3" y1="34.1" x2="153.6" y2="36.1" stroke-width="0.8"/><line x1="160.8" y1="39.2" x2="159.0" y2="41.0" stroke-width="0.8"/><line x1="165.9" y1="44.7" x2="163.9" y2="46.4" stroke-width="0.8"/><line x1="170.4" y1="50.7" x2="168.3" y2="52.2" stroke-width="0.8"/><line x1="174.5" y1="57.0" x2="170.1" y2="59.5" stroke-width="1.4"/><line x1="177.9" y1="63.7" x2="175.6" y2="64.8" stroke-width="0.8"/><line x1="180.8" y1="70.6" x2="178.4" y2="71.5" stroke-width="0.8"/><line x1="183.1" y1="77.7" x2="180.6" y2="78.4" stroke-width="0.8"/><line x1="184.7" y1="85.1" x2="182.1" y2="85.5" stroke-width="0.8"/><line x1="185.7" y1="92.5" x2="183.1" y2="92.7" stroke-width="0.8"/></g>
<circle cx="100" cy="104" r="30" fill="#000" mask="url(#ms-planet)"/>
<g transform="rotate(-18 100 104)" fill="none" stroke="#000" stroke-width="1.8">
<path d="M 22 104 A 78 20 0 0 1 178 104" mask="url(#ms-front)"/>
<path d="M 22 104 A 78 20 0 0 0 178 104"/>
</g>
<circle cx="141" cy="54" r="10" fill="#000" mask="url(#ms-moon)"/>
<circle cx="141" cy="54" r="10" fill="none" stroke="#000" stroke-width="0.8"/>
<circle cx="168.5" cy="85" r="2.4" fill="#000"/>
</svg>`;

export const CONCEPTS: BrandConcept[] = [
  {
    id: 'nasa-earth',
    name: 'Earth / Blue Marble',
    family: 'Earth',
    idea: 'The Apollo 17 crew photograph of the full Earth: Africa, Arabia and the Antarctic ice cap under real cloud. Natural colour.',
    asset: 'nasa-earth',
    lockup: { text: 'Mission', font: 'geist', weight: 500, tracking: -2 },
  },
  {
    id: 'nasa-moon',
    name: 'Moon / Full disc',
    family: 'Moon',
    idea: 'Full Moon from Lunar Reconnaissance Orbiter mapping: the maria, Tycho and its ray system, Copernicus. Natural grey.',
    asset: 'nasa-moon',
    lockup: { text: 'MISSION', font: 'unbounded', weight: 500, tracking: 18 },
  },
  {
    id: 'nasa-saturn',
    name: 'Saturn / Cassini',
    family: 'Saturn',
    idea: 'Cassini approach portrait (PIA05389): muted tan banded globe, its shadow across the rings, A and B rings with the Cassini Division.',
    asset: 'nasa-saturn',
    lockup: { text: 'MISSION', font: 'spaceGrotesk', weight: 500, tracking: 14 },
  },
  {
    id: 'nasa-sun',
    name: 'Sun / SDO 171 Å',
    family: 'Sun',
    idea: 'SDO extreme-ultraviolet view: active regions, coronal loops and filaments. False colour; not a visible-light surface photograph.',
    asset: 'nasa-sun',
    lockup: { text: 'MISSION', font: 'unbounded', weight: 500, tracking: 16 },
  },
  {
    id: 'orbit-path',
    name: 'Orbit / Transfer',
    family: 'Orbit',
    idea: 'Diagram: Hohmann transfer between two circular orbits, the half-ellipse focused on the central body, burn marks at periapsis and apoapsis.',
    svg: orbitPath,
    lockup: { text: 'Mission', font: 'syne', weight: 600, tracking: -1 },
  },
  {
    id: 'mission-seal',
    name: 'Orbit / System Seal',
    family: 'Orbit',
    idea: 'Diagram: mission patch. Planet with an inclined orbit passing correctly behind the globe, phased moon, minute-ticked bezel.',
    svg: missionSeal,
    lockup: { text: 'MISSION / MS-01', font: 'spaceGrotesk', weight: 500, tracking: 12 },
  },
];
