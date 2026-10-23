import { useEffect, useRef, useState } from "react";
import { CardFace } from "@/landing/components/CardFace";
import { gsap, prefersStatic, ScrollTrigger } from "@/landing/lib/motion";
import { scrollToY } from "@/landing/lib/smooth";
import { explodePose, explodeSignals } from "@/landing/three/explodePose";
import { CONCEPT_LINE, OPEN_PARTS, partIndex, type PartId } from "./open-parts";
import { ExplodedStill } from "./ExplodedStill";

export function OpenCard({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const lockId = useRef<PartId | null>(null);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<PartId | null>(reduced ? "flash" : null);

  useEffect(() => {
    if (reduced || prefersStatic()) {
      setActiveId("flash");
      return;
    }
    const el = section.current;
    const view = track.current;
    if (!el || !view) return;
    explodeSignals.onReady = () => setReady(true);
    let dead = false;
    let unregister = () => {};
    let release = () => {};
    const stageP = import("@/landing/three/stage");
    const worldP = import("@/landing/three/ExplodedCard");
    stageP.then(async (stage) => {
      const world = await worldP;
      if (dead || !track.current) return;
      await stage.acquireStage();
      if (dead || !track.current) {
        stage.releaseStage();
        return;
      }
      release = () => stage.releaseStage();
      unregister = stage.registerView("exploded", track.current, <world.ExplodedScene />);
      stage.setViewActive("exploded", true);
    });
    const io = new IntersectionObserver(
      ([entry]) => {
        stageP.then((stage) => stage.setViewActive("exploded", !!entry?.isIntersecting));
      },
      { rootMargin: "240px" },
    );
    io.observe(view);

    let last = -2;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate(self) {
          explodePose.p = self.progress;
          el.style.setProperty("--open", self.progress.toFixed(4));
          const idx = partIndex(self.progress);
          const id = idx >= 0 ? OPEN_PARTS[idx]!.id : null;
          if (lockId.current) {
            if (id !== lockId.current) return;
            lockId.current = null;
          }
          if (idx !== last) {
            last = idx;
            explodePose.focus = id ?? "";
            setActiveId(id);
          }
        },
      });
    }, el);

    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
      unregister();
      release();
      explodePose.p = 0;
      explodePose.focus = "";
      explodeSignals.onReady = () => {};
    };
  }, [reduced]);

  const focus = (id: PartId) => {
    lockId.current = id;
    explodePose.focus = id;
    setActiveId(id);
    const el = section.current;
    if (!el || reduced) return;
    const idx = OPEN_PARTS.findIndex((p) => p.id === id);
    const st = ScrollTrigger.getAll().find((t) => t.trigger === el);
    if (!st) return;
    const span = st.end - st.start;
    const progress = 0.4 + ((idx + 0.5) / OPEN_PARTS.length) * 0.55;
    const y = st.start + span * progress;
    scrollToY(y);
  };

  const left = OPEN_PARTS.filter((p) => p.column === "left");
  const right = OPEN_PARTS.filter((p) => p.column === "right");
  const active = OPEN_PARTS.find((p) => p.id === activeId) ?? null;

  return (
    <section
      className={`open-card ${ready ? "is-ready" : ""}`}
      id="inside"
      ref={section}
      aria-labelledby="inside-title"
      data-testid="section-inside"
    >
      <div className="open-pin">
        <header className="open-head">
          <p className="eyebrow" data-reveal>
            <i /> Inside
          </p>
          <h2 id="inside-title" data-split>
            The card, opened.
          </h2>
          <p className="lede" data-reveal>
            The graphite shell splits apart. What sits inside is a concept layout, including flash
            storage, not a shipped bill of materials.
          </p>
        </header>

        <div className="open-view" ref={track} aria-hidden="true" />
        <div className="open-poster" aria-hidden="true">
          <CardFace plug alt="" />
        </div>
        <div className="still">
          <ExplodedStill />
        </div>

        <div className="open-callouts">
          <ol className="call-col left">
            {left.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`call ${activeId === p.id ? "is-on" : ""}`}
                  onClick={() => focus(p.id)}
                  aria-pressed={activeId === p.id}
                >
                  <span className="call-name">{p.name}</span>
                  <span className="call-note">{p.note}</span>
                </button>
                <span className="leader" aria-hidden="true" />
              </li>
            ))}
          </ol>
          <ol className="call-col right">
            {right.map((p) => (
              <li key={p.id}>
                <span className="leader" aria-hidden="true" />
                <button
                  type="button"
                  className={`call ${activeId === p.id ? "is-on" : ""}`}
                  onClick={() => focus(p.id)}
                  aria-pressed={activeId === p.id}
                >
                  <span className="call-name">{p.name}</span>
                  <span className="call-note">{p.note}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <button
          type="button"
          className={`flash-inset ${activeId === "flash" ? "is-on" : ""}`}
          onClick={() => focus("flash")}
          data-testid="text-flash-concept"
        >
          <span className="flash-die" aria-hidden="true" />
          <span>
            <span className="call-name">Flash storage</span>
            <span className="call-note">Concept — subject to engineering</span>
          </span>
        </button>

        <div className="open-strip" role="group" aria-label="Focused part" hidden={active == null}>
          <span className="strip-k">
            {(active ?? OPEN_PARTS.find((p) => p.id === "flash"))!.name}
          </span>
          {(active ?? OPEN_PARTS.find((p) => p.id === "flash"))!.cells.map((cell) => (
            <span key={cell}>{cell}</span>
          ))}
        </div>
        <p className="open-foot">{CONCEPT_LINE}</p>
      </div>
    </section>
  );
}
