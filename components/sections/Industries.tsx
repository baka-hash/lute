import type { CSSProperties } from "react";
import { Point } from "./Problem";

/* Section 5 · Industry sectors (v2 layout, Figma 75:11879), 1440 × 578 */

const SECTORS = [
  {
    word: "Manufacturing",
    tasks: ["Assembly", "Inspection", "Pick and place"],
    img: "/assets/images/industry-manufacturing.png",
    position: "50% 100%",
  },
  {
    word: "Logistics",
    tasks: ["Loading", "Machine tending"],
    img: "/assets/images/industry-logistics.png",
    position: "50% 50%",
  },
  {
    word: "Retail",
    tasks: ["Order picking", "Replenishment", "Shelf auditing"],
    img: "/assets/images/industry-retail.png",
    position: "50% 100%",
  },
];

export default function Industries() {
  return (
    <section className="s5" id="industries" aria-labelledby="s5-title">
      <p className="mono-xs s5-eyebrow" data-r="fade">(Industry sectors)</p>
      <h2 className="s5-title" id="s5-title" aria-label="The right solution starts with the job.">
        <span className="s2-line" style={{ left: 40, top: 134 }} aria-hidden="true">
          <span className="s2-txt" data-r="line">The right solution </span>
          <Point n="01" />
        </span>
        <span className="s2-line" style={{ left: 144.5, top: 210 }} aria-hidden="true">
          <Point n="02" />
          <span className="s2-txt" data-r="line">starts with </span>
        </span>
        <span className="s2-line" style={{ left: 569.13, top: 210 }} aria-hidden="true">
          <span className="s2-txt" data-r="line">the job.</span>
          <Point n="03" />
        </span>
      </h2>
      <p className="s5-body" data-r="fade">
        Bring your hardware, a preferred platform, or nothing at all. We build the combination of hardware, software, and support around your workflow.
      </p>

      <ul className="s5-list">
        {SECTORS.map((s, r) => (
          // cards rise in turn; photo, word and pills follow inside each card
          <li key={s.word} className="s5-item" data-r="row" style={{ "--dl": `${200 + r * 140}ms` } as CSSProperties}>
            <div className="s5-img">
              <img src={s.img} alt="" style={{ objectPosition: s.position }} loading="lazy" />
            </div>
            <div className="s5-content">
              <h3 className="s5-word"><span>{s.word}</span></h3>
              <ul className="s5-pills" aria-label={`${s.word} tasks`}>
                {s.tasks.map((t, i) => (
                  <li key={t} style={{ "--i": i } as CSSProperties}>{t}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
