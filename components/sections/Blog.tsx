import type { CSSProperties } from "react";
import { ArrowSwap } from "../icons";

/* Section 7 · Blog (Figma "Blog", 75:13576), 1440 × 731 */

const POSTS = [
  {
    date: "Aug 07, 2026",
    title: "Every millisecond counts",
    desc: "A walk through our stack from data collection to inference: where the milliseconds go.",
    media: (
      <>
        <div className="s7-zoom">
          <img src="/assets/images/blog-every-millisecond-counts.jpg" alt="Robot gripper sorting small blocks next to an open box" loading="lazy" />
        </div>
        <span className="s7-shade" aria-hidden="true" />
      </>
    ),
  },
  {
    date: "Feb 25, 2026",
    title: "From the noise to the useful signal",
    desc: "How we are building a set of quality metrics to keep improving data quality and the performance of final policies on challenging real-world problems.",
    graphic: true,
    media: (
      <div className="s7-zoom">
        <svg className="s7-lines" viewBox="0 0 318.068 234.784" fill="none" aria-hidden="true">
          <path d="M242.506 0.285689L317.135 107.477L1.13514 119.387L103.057 225.178L1.13514 234.286" stroke="#FEFEFC" />
        </svg>
        <span className="s7-pt" style={{ left: 306, top: 21 }}><i /><b>(01)</b></span>
        <span className="s7-pt" style={{ left: 381, top: 127 }}><i /><b>(02)</b></span>
        <span className="s7-pt s7-pt--l" style={{ left: 29, top: 140 }}><b>(03)</b><i /></span>
        <span className="s7-pt" style={{ left: 166, top: 243 }}><i /><b>(02)</b></span>
        <span className="s7-pt s7-pt--l" style={{ left: 30, top: 254 }}><b>(01)</b><i /></span>
      </div>
    ),
  },
  {
    date: "Jan 01, 2026",
    title: "Benchmarking visual temporal progress for data curation",
    desc: "OpenGVL: a benchmark for estimating task progress across diverse manipulation tasks, for both robotic and human embodiments.",
    media: (
      <div className="s7-zoom s7-zoom--map">
        <img src="/assets/images/blog-benchmarking-visual-progress.jpg" alt="Robot arms handling objects, blue duotone" loading="lazy" />
      </div>
    ),
  },
];

export default function Blog() {
  return (
    <section className="s7" id="blog" aria-labelledby="s7-title">
      <h2 className="s7-eyebrow mono-xs" id="s7-title" data-r="fade">(Read blog)</h2>
      <div className="s7-grid">
        {POSTS.map((post, i) => (
          <a key={post.title} className="s7-card" href="#" data-r="card" style={{ "--dl": `${120 + i * 140}ms` } as CSSProperties}>
            <div className={post.graphic ? "s7-media s7-media--graphic" : "s7-media"}>{post.media}</div>
            <div className="s7-text">
              <p className="s7-date">({post.date})</p>
              <h3 className="s7-h">{post.title}</h3>
              <p className="s7-desc">{post.desc}</p>
            </div>
            <span className="s7-arrow" aria-hidden="true">
              <ArrowSwap from="#132F40" to="white" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
