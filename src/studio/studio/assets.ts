/**
 * Built-in photographic mark assets. Only these ids can be referenced by a project (no arbitrary URLs),
 * so imported files cannot point the renderer at external content.
 */
export type AssetId = 'nasa-moon' | 'nasa-earth' | 'nasa-saturn' | 'nasa-sun' | 'nasa-iss-limb';

export interface PhotoAsset {
  id: AssetId;
  name: string;
  file: string;
  /** width / height of the cut-out disc */
  aspect: number;
  credit: string;
  source: string;
  /** Honest description of colour processing. */
  colour: string;
}

export const ASSETS: Record<AssetId, PhotoAsset> = {
  'nasa-moon': {
    id: 'nasa-moon',
    name: 'Moon',
    file: 'assets/nasa/moon.webp',
    aspect: 1,
    credit: "NASA's Scientific Visualization Studio, Moon Phase and Libration 2023 (LRO imagery)",
    source: 'https://svs.gsfc.nasa.gov/5048',
    colour: 'Natural grey',
  },
  'nasa-earth': {
    id: 'nasa-earth',
    name: 'Earth',
    file: 'assets/nasa/earth.webp',
    aspect: 1,
    credit: 'NASA, Apollo 17 crew, "The Blue Marble" (AS17-148-22727)',
    source: 'https://images.nasa.gov/details/as17-148-22727',
    colour: 'Natural colour (film photograph)',
  },
  'nasa-saturn': {
    id: 'nasa-saturn',
    name: 'Saturn',
    file: 'assets/nasa/saturn-pia05389-v3.webp',
    aspect: 984 / 404,
    credit: 'NASA/JPL/Space Science Institute: Cassini narrow-angle camera, "Saturn in Color" (PIA05389), 27 March 2004',
    source: 'https://science.nasa.gov/photojournal/saturn-in-color',
    colour: 'Natural colour (Cassini red, green and blue filter composite); source colours unaltered',
  },
  'nasa-sun': {
    id: 'nasa-sun',
    name: 'Sun',
    file: 'assets/nasa/sun-aia171-20240510-v2.webp',
    aspect: 1,
    credit: 'NASA/SDO and the AIA science team: AIA 171 Å, 10 May 2024 12:07:10 UT',
    source: 'https://sdo.gsfc.nasa.gov/assets/img/browse/2024/05/10/20240510_120710_2048_0171.jpg',
    colour: "False colour: extreme-ultraviolet 171 Å light (~600,000 K corona and transition region), shown in NASA's standard gold colour table. Not a visible-light photograph of the surface.",
  },
  'nasa-iss-limb': {
    id: 'nasa-iss-limb',
    name: 'Earth limb from ISS',
    file: 'assets/nasa/iss-limb.webp',
    aspect: 1,
    credit: 'NASA: Expedition 64 crew photograph iss064e002941, Earth limb over the north Pacific',
    source: 'https://images.nasa.gov/details/iss064e002941',
    colour: 'Natural colour (crew photograph, circular crop)',
  },
};

export const ASSET_IDS = Object.keys(ASSETS) as AssetId[];

export function assetUrl(id: AssetId): string {
  return `${import.meta.env.BASE_URL}${ASSETS[id].file}`;
}

/** Built-in vector concept symbols that have a photographic replacement (by the svgName the library writes). */
export function photoReplacementFor(svgName: string | null): AssetId | null {
  if (!svgName) return null;
  if (/^moon-(crater|selene|crescent)\.svg$/.test(svgName)) return 'nasa-moon';
  if (/^earth-(meridian|horizon)\.svg$/.test(svgName)) return 'nasa-earth';
  if (svgName === 'saturn-ring.svg') return 'nasa-saturn';
  // orbit-path / mission-seal are diagrams by nature: no photo replacement
  return null;
}
