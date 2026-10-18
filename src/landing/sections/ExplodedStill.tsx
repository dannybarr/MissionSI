import { CardFace } from "@/landing/components/CardFace";

/** Static exploded card for reduced motion and for when WebGL is unavailable. */
export function ExplodedStill() {
  return (
    <div className="still-scene">
      <div className="still-plate still-back">
        <CardFace marks={false} plug alt="" />
      </div>
      <svg className="still-board" viewBox="0 0 860 550" aria-hidden="true">
        <rect x="70" y="48" width="720" height="454" rx="28" fill="#17202b" />
        <g fill="none" stroke="#8d6438" strokeWidth="3">
          <path d="M140 120 H420 V250 H640" />
          <path d="M180 400 H520 V220" />
          <path d="M250 160 V430 H620" />
        </g>
        <g fill="none" stroke="#c47a3a" strokeWidth="8">
          <ellipse cx="250" cy="150" rx="70" ry="52" />
          <ellipse cx="250" cy="150" rx="48" ry="34" />
          <ellipse cx="250" cy="150" rx="26" ry="18" />
        </g>
        <rect x="150" y="230" width="92" height="92" rx="6" fill="#d5d8de" />
        <rect x="176" y="256" width="40" height="40" fill="#e6c56a" />
        <rect x="118" y="360" width="36" height="36" rx="3" fill="#c9cdd4" />
        <circle cx="136" cy="378" r="6" fill="#141414" />
        <circle cx="230" cy="430" r="28" fill="#c9cdd4" />
        <rect x="340" y="110" width="120" height="86" rx="4" fill="#0c0c0c" />
        <rect x="560" y="120" width="110" height="58" rx="3" fill="#1a4c86" />
        <rect x="575" y="132" width="28" height="28" fill="#141414" />
        <rect x="250" y="400" width="340" height="70" rx="12" fill="#d5d8de" />
        <rect x="560" y="412" width="22" height="46" fill="#e2b340" />
        <rect x="600" y="340" width="90" height="90" fill="#141414" />
        <rect x="618" y="358" width="54" height="54" fill="#0c0c0c" />
      </svg>
      <div className="still-plate still-front">
        <CardFace plug alt="Mission card shell, split away from the board" />
      </div>
    </div>
  );
}
