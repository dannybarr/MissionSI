import { useEffect, useRef, useState } from "react";
import { CardFace } from "@/landing/components/CardFace";
import { HalftoneIcon } from "@/landing/components/HalftoneIcon";
import { EASE, gsap, prefersStatic, ScrollTrigger } from "@/landing/lib/motion";
import { CAPTURE_TABS } from "./captureContent";

export function Captures({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const lockAt = useRef(-1);
  const [index, setIndex] = useState(0);
  const tab = CAPTURE_TABS[index] ?? CAPTURE_TABS[0]!;

  useEffect(() => {
    if (reduced || prefersStatic()) return;
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".captures-card", {
        y: 36,
        opacity: 0,
        duration: 1.05,
        ease: EASE.arrive,
        scrollTrigger: { trigger: el, start: "top 70%", once: true },
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate(self) {
          progress.current = self.progress;
          if (lockAt.current >= 0) {
            if (Math.abs(self.progress - lockAt.current) < 0.07) return;
            lockAt.current = -1;
          }
          const next = Math.min(
            CAPTURE_TABS.length - 1,
            Math.floor(self.progress * CAPTURE_TABS.length * 0.999),
          );
          setIndex((cur) => (cur === next ? cur : next));
        },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  const pick = (i: number) => {
    lockAt.current = progress.current;
    setIndex(i);
  };

  return (
    <section
      className="captures"
      id="captures"
      ref={root}
      aria-labelledby="captures-title"
      data-testid="section-captures"
    >
      <div className="captures-pin">
        <h2 id="captures-title" data-split>
          What Mission captures
        </h2>
        <div className="captures-tabs" role="tablist" aria-label="What Mission captures">
          <span className="captures-ind" style={{ ["--i" as string]: index }} aria-hidden="true" />
          {CAPTURE_TABS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`cap-tab-${item.id}`}
              aria-selected={i === index}
              aria-controls={`cap-panel-${item.id}`}
              className="captures-tab"
              onClick={() => pick(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          className="captures-stage"
          role="tabpanel"
          id={`cap-panel-${tab.id}`}
          aria-labelledby={`cap-tab-${tab.id}`}
        >
          <CardFace plug className="captures-card" alt="Mission card, centred" />
          <ul className="captures-icons" key={tab.id}>
            {tab.items.map((item, i) => (
              <li
                key={item.id}
                style={{ left: item.x, top: item.y, animationDelay: `${i * 70}ms` }}
              >
                <HalftoneIcon name={item.id} />
                <span className="cap-check" aria-hidden="true" />
                <span className="cap-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="captures-caption" key={`${tab.id}-line`}>
          {tab.caption}
        </p>
      </div>
    </section>
  );
}
