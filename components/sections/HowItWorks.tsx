"use client";

import { useEffect, useRef, useState } from "react";
import { LuteIcon } from "../icons";

/* Section 3 · How it works (Figma "section 6", 75:5615): pinned for three viewports, scroll moves through the steps */

const STEPS = [
  {
    title: "Autonomy",
    text: "The robot operates independently, completing tasks without constant human intervention.",
    video: "/media/lute_tt_box_3x_bw.mp4",
    poster: "/assets/images/how-it-works-box-poster.jpg",
    alt: "Robot assembling a cardboard box on its own",
  },
  {
    title: "Monitoring",
    text: "Continuous monitoring detects issues and identifies when human assistance is needed.",
    video: "/media/lute_tt_tshirt_3x_bw.mp4",
    poster: "/assets/images/how-it-works-tshirt-poster.jpg",
    alt: "Robot folding a t-shirt at a work table",
  },
  {
    title: "Remote support",
    text: "A remote operator steps in when necessary to resolve issues and keep operations running reliably.",
    video: "/media/lute_tt_veggies_3x_bw.mp4",
    poster: "/assets/images/how-it-works-veggies-poster.jpg",
    alt: "Humanoid robot restocking a store shelf",
  },
];
const N = STEPS.length;

export default function HowItWorks() {
  const secRef = useRef<HTMLElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const current = useRef(0);

  useEffect(() => {
    const sec = secRef.current!;
    let inView = false, leaveTimer = 0, ticking = false, raf = 0;

    const playActive = () => vids.current.forEach((v, i) => {
      if (!v) return;
      if (i === current.current && inView) v.play()?.catch(() => {});
      else v.pause();
    });
    const go = (n: number) => {
      if (n === current.current) return;
      const prev = current.current;
      current.current = n;
      setLeaving(prev);
      setStep(n);
      const v = vids.current[n];
      if (v) { try { v.currentTime = 0; } catch {} }
      clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => setLeaving((l) => (l === prev ? null : l)), 950);
      playActive();
    };
    const progress = () => {
      const rect = sec.getBoundingClientRect();
      const run = rect.height - window.innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) : 0;
      go(Math.min(N - 1, Math.floor(p * N)));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => { ticking = false; progress(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", progress);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; playActive(); }, { threshold: 0.1 });
    io.observe(sec);
    progress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", progress);
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(leaveTimer);
    };
  }, []);

  // index buttons scroll to the middle of their step
  const jump = (i: number) => {
    const sec = secRef.current!;
    const rect = sec.getBoundingClientRect();
    const run = rect.height - window.innerHeight;
    window.scrollTo({ top: window.scrollY + rect.top + run * ((i + 0.5) / N), behavior: "smooth" });
  };

  return (
    <section className="s3" id="how-it-works" ref={secRef} aria-labelledby="s3-title">
      <div className="s3-pin">
        <div className="s3-frame">
          <figure className="s3-media">
            <div className="s3-video" data-r="img">
              {STEPS.map((s, i) => (
                <video
                  key={s.video}
                  ref={(v) => { vids.current[i] = v; }}
                  className={i === step ? "is-active" : i === leaving ? "is-leaving" : undefined}
                  src={s.video}
                  poster={s.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={s.alt}
                />
              ))}
              <span className="s3-shade" aria-hidden="true" />
            </div>
            <figcaption className="mono-xs" data-r="fade">
              (Additional text about the video, lorem ipsum under the video)<br />Video speed 3x
            </figcaption>
          </figure>

          <div className="s3-copy">
            <h2 className="s3-title" id="s3-title" aria-label="Autonomy can fail. The outcome can't.">
              <span className="s3-eyebrow" data-r="fade">(How it works)</span>
              <span className="s3-h" style={{ left: 0, top: 19 }} data-r="line" aria-hidden="true">Autonomy </span>
              <span className="s3-h" style={{ left: 435, top: 19 }} data-r="line" aria-hidden="true">can fail. </span>
              <span className="s3-h" style={{ left: 172, top: 83 }} data-r="line" aria-hidden="true">The outcome can&apos;t.</span>
            </h2>
            <div className="s3-items" data-r="fade">
              {STEPS.map((s, i) => (
                <div key={s.title} className={`s3-item${i === step ? " is-active" : ""}${i < step ? " is-past" : ""}`}>
                  <h3><span>{s.title}</span></h3>
                  <p><span>{s.text}</span></p>
                </div>
              ))}
            </div>
          </div>

          <ol className="s3-index" aria-label="Steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  className={i === step ? "is-active" : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => jump(i)}
                >
                  ({String(i + 1).padStart(2, "0")})
                </button>
              </li>
            ))}
          </ol>

          <div className="s3-icon" aria-hidden="true"><LuteIcon /></div>
        </div>
      </div>
    </section>
  );
}
