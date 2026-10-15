"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/* Section 7 · Blog (v2 layout, Figma 75:14097): a slider. Cards move right → left; the card in the first slot
   grows to 4 columns, then slides out under the left mask. */

type Post = { date: string; title: string; graphic?: boolean; media: ReactNode };

const POSTS: Post[] = [
  {
    date: "Feb 25, 2026",
    title: "From the noise to the useful signal",
    graphic: true,
    media: (
      <div className="s7-zoom">
        <div className="s7-diagram">
          <svg className="s7-lines" viewBox="0 0 318.068 234.784" fill="none" aria-hidden="true">
            <path d="M242.506 0.285689L317.135 107.477L1.13514 119.387L103.057 225.178L1.13514 234.286" stroke="#FEFEFC" />
          </svg>
          <span className="s7-pt" style={{ left: 306, top: 21 }}><i /><b>(01)</b></span>
          <span className="s7-pt" style={{ left: 381, top: 127 }}><i /><b>(02)</b></span>
          <span className="s7-pt" style={{ left: 29, top: 140 }}><b>(03)</b><i /></span>
          <span className="s7-pt" style={{ left: 166, top: 243 }}><i /><b>(02)</b></span>
          <span className="s7-pt" style={{ left: 30, top: 254 }}><b>(01)</b><i /></span>
        </div>
      </div>
    ),
  },
  {
    date: "Aug 07, 2026",
    title: "Every millisecond counts",
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
    date: "Jan 01, 2026",
    title: "Benchmarking visual temporal progress for data curation",
    media: (
      <div className="s7-zoom s7-zoom--map">
        <img src="/assets/images/blog-benchmarking-visual-progress.jpg" alt="Robot arms handling objects, blue duotone" loading="lazy" />
      </div>
    ),
  },
];

function Card({ post, wide, hidden, style, ...rest }: {
  post: Post;
  wide: boolean;
  hidden?: boolean;
  style?: CSSProperties;
  "data-slot"?: number;
}) {
  return (
    <a
      className="s7-card"
      href="#"
      data-wide={wide}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      style={style}
      {...rest}
    >
      <div className={post.graphic ? "s7-media s7-media--graphic" : "s7-media"}>{post.media}</div>
      <div className="s7-text">
        <p className="s7-date">({post.date})</p>
        <h3 className="s7-h">{post.title}</h3>
      </div>
    </a>
  );
}

// slot geometry inside the viewport (x from the viewport's left edge = column 3)
const SLOTS = [
  { x: 0, w: 440 }, // first slot: 4 columns
  { x: 460, w: 325 },
  { x: 805, w: 325 },
  { x: 1150, w: 325 }, // just off the right edge, next to enter
  { x: 1495, w: 325 }, // parked off the right edge
  { x: -345, w: 325 }, // gone under the left mask
];
const ITEMS = [...POSTS, ...POSTS]; // two laps so a card can leave on the left while another enters on the right
const STEP = 4000;
const JUMP_STEP = 450; // a dot click walks the slider one card at a time, so cards never skip a slot

export default function Blog() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [cycleKey, setCycleKey] = useState(0); // bumped by a dot click so autoplay waits a full step again
  const active = ((offset % POSTS.length) + POSTS.length) % POSTS.length; // post in the first (wide) slot

  // autoplay: one step every 4 s while the slider is on screen and not hovered
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = viewportRef.current!;
    let inView = false, hovering = false, timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      if (inView && !hovering) timer = window.setTimeout(() => { setOffset((o) => o + 1); schedule(); }, STEP);
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; schedule(); }, { threshold: 0.4 });
    io.observe(el);
    const enter = () => { hovering = true; clearTimeout(timer); };
    const leave = () => { hovering = false; schedule(); };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, [cycleKey]);

  // dot click: step forward until the chosen post sits in the first slot
  useEffect(() => {
    if (target === null) return;
    if (offset >= target) { setTarget(null); return; }
    const t = window.setTimeout(() => setOffset((o) => o + 1), JUMP_STEP);
    return () => clearTimeout(t);
  }, [offset, target]);

  const goTo = (post: number) => {
    const steps = (post - active + POSTS.length) % POSTS.length;
    if (!steps) return;
    setOffset((o) => o + 1); // first step right away
    setTarget(offset + steps);
    setCycleKey((k) => k + 1);
  };

  return (
    <section className="s7" id="blog" aria-labelledby="s7-title">
      <div className="s7-side">
        <h2 className="s7-eyebrow mono-xs" id="s7-title" data-r="fade">(Read blog)</h2>
        {/* slider indicator (Figma 121:23675): the black square marks the post in the wide slot */}
        <ol className="s7-dots" aria-label="Blog posts" data-r="fade">
          {POSTS.map((post, i) => (
            <li key={post.title}>
              <button
                type="button"
                className={i === active ? "is-active" : undefined}
                aria-label={`Show post ${i + 1}: ${post.title}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="s7-viewport" ref={viewportRef} data-r="card" style={{ "--dl": "120ms" } as CSSProperties}>
        {ITEMS.map((post, i) => {
          const slot = (((i - offset) % ITEMS.length) + ITEMS.length) % ITEMS.length;
          const { x, w } = SLOTS[slot];
          return (
            <Card
              key={i}
              post={post}
              wide={slot === 0}
              hidden={slot > 2}
              data-slot={slot}
              style={{ "--x": `${x}px`, "--w": `${w}px` } as CSSProperties}
            />
          );
        })}
      </div>
    </section>
  );
}
