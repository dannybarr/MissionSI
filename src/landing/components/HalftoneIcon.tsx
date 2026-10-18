import { useId, type ReactNode } from "react";
import type { CaptureId } from "@/landing/sections/captureContent";

/**
 * Original object drawings, printed as a blue halftone.
 * The shapes are ours — not the Ghost device renders.
 */
function Plate({ children }: { children: ReactNode }) {
  const uid = useId().replace(/:/g, "");
  const dots = `${uid}-dots`;
  const mask = `${uid}-mask`;
  return (
    <svg className="cap-art" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <pattern id={dots} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1.15" cy="1.15" r="1.12" fill="#3d92ea" />
        </pattern>
        <mask id={mask} maskUnits="userSpaceOnUse">
          {children}
        </mask>
      </defs>
      <rect width="200" height="200" fill={`url(#${dots})`} mask={`url(#${mask})`} />
    </svg>
  );
}

function Email() {
  return (
    <Plate>
      <polygon points="28,118 46,168 150,168 132,118" fill="#7a7a7a" />
      <polygon points="36,96 142,96 156,142 50,142" fill="#d7d7d7" />
      <polygon points="36,96 89,124 142,96" fill="#b5b5b5" />
      <polygon points="48,78 154,70 166,112 60,120" fill="#ffffff" />
      <polygon points="48,78 101,100 154,70" fill="#e4e4e4" />
      <polygon points="62,58 168,48 178,88 72,98" fill="#f7f7f7" />
      <polygon points="62,58 115,76 168,48" fill="#cfcfcf" />
      <polygon points="78,86 118,80 116,88 76,94" fill="#3a3a3a" />
    </Plate>
  );
}

function Calendar() {
  return (
    <Plate>
      <polygon points="46,34 112,24 124,172 58,182" fill="#9c9c9c" />
      <polygon points="64,40 156,28 168,174 76,186" fill="#ffffff" />
      <polygon points="46,34 64,40 76,186 58,182" fill="#5e5e5e" />
      <rect x="92" y="62" width="46" height="54" fill="#111111" />
      <rect x="98" y="68" width="34" height="42" fill="#e6e6e6" />
      <rect x="102" y="78" width="8" height="8" fill="#222222" />
      <rect x="114" y="78" width="8" height="8" fill="#222222" />
      <rect x="102" y="90" width="8" height="8" fill="#222222" />
      <rect x="114" y="90" width="8" height="8" fill="#222222" />
      <polygon points="138,28 148,26 154,186 144,184" fill="#c8c8c8" />
    </Plate>
  );
}

function Files() {
  return (
    <Plate>
      <polygon points="78,28 158,42 150,150 70,136" fill="#d0d0d0" />
      <polygon points="62,46 142,34 150,78 70,90" fill="#c4c4c4" />
      <polygon points="36,78 132,64 148,168 48,182" fill="#ffffff" />
      <polygon points="36,78 92,70 100,90 44,98" fill="#9a9a9a" />
      <polygon points="58,112 124,104 126,112 60,120" fill="#222222" />
      <polygon points="58,128 118,121 120,128 60,135" fill="#222222" />
    </Plate>
  );
}

function Knowledge() {
  return (
    <Plate>
      <polygon points="22,78 96,52 100,164 26,184" fill="#dedede" />
      <polygon points="104,52 178,76 174,180 102,164" fill="#ffffff" />
      <polygon points="94,52 110,52 112,166 92,166" fill="#6a6a6a" />
      <polygon points="40,88 86,74 86,80 40,94" fill="#333333" />
      <polygon points="40,102 82,90 82,96 40,108" fill="#333333" />
      <polygon points="118,78 164,90 164,96 118,84" fill="#333333" />
      <polygon points="118,94 160,106 160,112 118,100" fill="#333333" />
      <polygon points="148,70 158,74 160,156 150,154" fill="#bdbdbd" />
    </Plate>
  );
}

function Location() {
  return (
    <Plate>
      <ellipse cx="104" cy="170" rx="34" ry="12" fill="#8d8d8d" />
      <polygon points="68,92 104,168 104,92" fill="#cfcfcf" />
      <polygon points="104,92 140,92 104,168" fill="#ffffff" />
      <circle cx="104" cy="74" r="36" fill="#ffffff" />
      <circle cx="90" cy="62" r="14" fill="#d8d8d8" />
      <circle cx="104" cy="76" r="12" fill="#1a1a1a" />
    </Plate>
  );
}

function Notes() {
  return (
    <Plate>
      <polygon points="30,46 148,34 162,172 44,184" fill="#ffffff" />
      <polygon points="30,46 148,34 144,50 26,62" fill="#8f8f8f" />
      <polygon points="52,78 136,68 136,74 52,84" fill="#222222" />
      <polygon points="54,94 130,85 130,91 54,100" fill="#222222" />
      <polygon points="56,110 124,102 124,108 56,116" fill="#222222" />
      <polygon points="58,126 110,120 110,126 58,132" fill="#222222" />
      <polygon points="138,58 154,52 176,150 160,156" fill="#dcdcdc" />
      <polygon points="154,52 162,46 184,144 176,150" fill="#9d9d9d" />
      <polygon points="176,150 184,144 180,162 172,160" fill="#4a4a4a" />
    </Plate>
  );
}

function Voice() {
  return (
    <Plate>
      <ellipse cx="100" cy="178" rx="42" ry="12" fill="#9a9a9a" />
      <rect x="94" y="118" width="12" height="60" fill="#d0d0d0" />
      <rect x="62" y="108" width="76" height="12" rx="4" fill="#8a8a8a" />
      <rect x="68" y="40" width="64" height="82" rx="32" fill="#ffffff" />
      <rect x="78" y="54" width="44" height="5" rx="1" fill="#1a1a1a" />
      <rect x="78" y="66" width="44" height="5" rx="1" fill="#1a1a1a" />
      <rect x="78" y="78" width="44" height="5" rx="1" fill="#1a1a1a" />
      <rect x="78" y="90" width="44" height="5" rx="1" fill="#1a1a1a" />
    </Plate>
  );
}

function Fitness() {
  return (
    <Plate>
      <rect x="78" y="28" width="44" height="36" rx="10" fill="#d2d2d2" />
      <rect x="86" y="34" width="28" height="24" rx="6" fill="#f2f2f2" />
      <rect x="78" y="136" width="44" height="36" rx="10" fill="#bdbdbd" />
      <rect x="86" y="142" width="28" height="24" rx="6" fill="#e8e8e8" />
      <rect x="58" y="58" width="84" height="84" rx="22" fill="#f7f7f7" />
      <rect x="70" y="70" width="60" height="60" rx="16" fill="#ffffff" />
      <rect x="80" y="80" width="40" height="40" rx="8" fill="#8a8a8a" />
      <rect x="86" y="88" width="16" height="5" rx="1" fill="#f3f3f3" />
      <circle cx="108" cy="108" r="3" fill="#f3f3f3" />
      <rect x="138" y="86" width="8" height="14" rx="2" fill="#cfcfcf" />
    </Plate>
  );
}

const ART: Record<CaptureId, () => ReactNode> = {
  email: Email,
  calendar: Calendar,
  files: Files,
  knowledge: Knowledge,
  location: Location,
  notes: Notes,
  voice: Voice,
  fitness: Fitness,
};

export function HalftoneIcon({ name }: { name: CaptureId }) {
  const Art = ART[name];
  return <Art />;
}
