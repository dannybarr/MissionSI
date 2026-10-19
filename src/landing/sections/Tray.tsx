import { CardFace } from '@/landing/components/CardFace'

/** The supplied photograph is intentionally displayed whole, not rebuilt from cut-outs. */
export function CarryStill({ className = '' }: { className?: string }) {
  return (
    <div className={`carry-still ${className}`}>
      <figure className="carry-still-card">
        <CardFace alt="Mission graphite card concept with stepped rim, Earth mark and DB initials" />
        <figcaption>Mission card concept · 86 × 55 mm</figcaption>
      </figure>
      <figure className="carry-still-photo">
        <img
          src="/media/product/everyday-carry-tray.png"
          alt="Tan leather tray holding earbuds, glasses, cash, wallet and a phone with a white cable"
          width={1496}
          height={1255}
          loading="lazy"
          decoding="async"
        />
        <figcaption>Everyday carry · reference photograph</figcaption>
      </figure>
    </div>
  )
}

export function Tray({ reduced: _reduced }: { reduced: boolean }) {
  return (
    <section className="tray" id="carry">
      <div className="tray-pin">
        <div className="tray-copy">
          <p className="eyebrow"><i /> Everyday carry</p>
          <h2>It lives with the things you already take.</h2>
          <p>Connect it when you want an agent to know you. Put it away when you don’t.</p>
        </div>
        <CarryStill />
      </div>
    </section>
  )
}
