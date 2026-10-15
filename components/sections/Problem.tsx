/* Section 2 · The problem (Figma "secction 2", 55:2990), 1440 × 810 */
export default function Problem() {
  return (
    <section className="s2" id="problem" aria-labelledby="s2-title">
      <p className="s2-eyebrow mono-xs" data-r="fade">(the problem)</p>
      <h2 className="s2-title" id="s2-title" aria-label="Physical AI stops being a demo when it starts becoming capacity.">
        <span className="s2-line" style={{ left: 353, top: 192 }} aria-hidden="true">
          <span className="s2-txt" data-r="line">Physical AI stops being</span>
          <Point n="01" />
        </span>
        <span className="s2-line" style={{ left: 578, top: 268 }} aria-hidden="true">
          <Point n="02" />
          <span className="s2-txt" data-r="line">a demo </span>
        </span>
        <span className="s2-line" style={{ left: 403, top: 344 }} aria-hidden="true">
          <span className="s2-txt" data-r="line"> when it starts</span>
          <Point n="03" />
        </span>
        <span className="s2-line" style={{ left: 403, top: 420 }} aria-hidden="true">
          <Point n="04" />
          <span className="s2-txt" data-r="line">becoming capacity.</span>
        </span>
      </h2>

      <figure className="s2-card s2-card--learning">
        <figcaption className="mono-xs" data-r="type"><span>(03)</span><span>Learning</span></figcaption>
        <div className="s2-img" data-r="img">
          <img src="/assets/images/problem-learning.jpg" alt="Two-armed robot at a workbench, learning a task" loading="lazy" />
        </div>
      </figure>

      <div className="s2-bottom">
        <figure className="s2-card s2-card--precision">
          <figcaption className="mono-xs" data-r="type"><span>(05)</span><span>Precision</span></figcaption>
          <div className="s2-img" data-r="img">
            <img src="/assets/images/problem-precision.jpg" alt="Robot arms placing parts on a fixture tray" loading="lazy" />
          </div>
        </figure>
        <p className="s2-body" data-r="fade">
          Turn hard-to-fill work into dependable capacity. Repetitive work is getting harder to staff. Lute puts robots to work where people are hardest to find. The value is the output it adds to your operation.
        </p>
      </div>
    </section>
  );
}

/* small numbered marker that sits next to a headline line (also used in "How it learns") */
export function Point({ n }: { n: string }) {
  return (
    <span className="s2-pt" data-r="pt">
      <i />
      <b>({n})</b>
    </span>
  );
}
