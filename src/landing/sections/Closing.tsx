import { ChapterHead, Reveal, BASE } from '@/landing/lib/motion';

const STEPS = [
  { h: 'Bring what you have', p: 'Request a data export from an assistant you already use, then import it. Manual, and honest about it: there is no one-click import.' },
  { h: 'A local interview', p: 'A model running on your laptop asks questions to fill the gaps, until the memory is deep enough to be useful.' },
  { h: 'Learn the rules', p: 'A short walkthrough of how grants, the audit log and unplugging work, and how the memory travels between agents.' },
];

export function Onboard() {
  return (
    <section className="onboard" id="start" data-theme="paper">
      <div className="wrap">
        <ChapterHead no="09" label="Planned onboarding" />
        <Reveal><h2 className="display d-l" style={{ maxWidth: 820 }}>A memory that starts <span className="it">with you.</span></h2></Reveal>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={s.h} data-testid={`card-step-${i}`}>
              <span className="n">{i + 1}</span>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer" data-theme="night">
      <div className="wrap">
        <div className="footer-cta">
          <Reveal><h2 className="display d-xl">Carry <span className="it metal">your own</span> memory.</h2></Reveal>
          <Reveal className="d1">
            <p className="lede dim">There is nothing to sign up for yet. Read the brief, try the access demo, or look at the card in the design studio.</p>
            <div className="hero-actions">
              <a className="btn btn-metal" href={`${BASE}mission-brief.txt`} download data-testid="link-download-brief">Download the brief <span className="arrow">↓</span></a>
              <a className="btn btn-ghost" href="#demo" data-testid="link-footer-demo">Access demo</a>
              <a className="btn btn-ghost" href="/mission-studio/" data-testid="link-mission-studio">Open Mission Studio <span className="arrow">→</span></a>
            </div>
          </Reveal>
        </div>
        <div className="footer-cols">
          <div>
            <h6>Mission</h6>
            <p>amission.si. A personal AI memory you own, in development; nothing has shipped. No orders, no accounts, no tracking on this page.</p>
          </div>
          <div>
            <h6>Imagery</h6>
            <p>Moon: NASA Scientific Visualization Studio, Moon Phase and Libration 2023 (LRO). Earth: NASA, Apollo 17 crew, The Blue Marble (AS17-148-22727). Card renders from Mission Studio.</p>
          </div>
          <div>
            <h6>Sections</h6>
            <p><a href="#memory">Memory</a> · <a href="#carry">Carry</a> · <a href="#agents">Agents</a> · <a href="#demo">Demo</a> · <a href="#custody">Custody</a> · <a href="#hardware">Hardware</a> · <a href="#status">Status</a></p>
          </div>
        </div>
        <div className="giant" aria-hidden="true">Mission</div>
      </div>
    </footer>
  );
}
