"use client";

import { useEffect, useRef } from "react";
import Button from "../Button";
import SplitChars from "../SplitChars";

/* Section 8 · CTA (Figma "CTA", 82:15479), 1440 × 604.
   The route draws point to point (like the hero), then the headline, copy and button follow. */

const ROUTE_VERTICES = [[0.72, 344.36], [95.22, 0.86], [676.22, 101.36], [327.72, 109.36], [417.22, 227.86], [1221.22, 101.36]];
const POINTS = [
  { left: 75, top: 340.086 },
  { left: 169, top: 1 },
  { left: 746, top: 100.086 },
  { left: 401, top: 109 },
  { left: 489, top: 227.086 },
  { left: 1295, top: 100 },
];
const LINES = [
  { text: "Bring the work.", left: 0, top: 0 },
  { text: "We'll build the path", left: 535, top: 122 },
  { text: "to automate it.", left: 144, top: 251 },
];
const E = { io: "cubic-bezier(.65,0,.35,1)", out: "cubic-bezier(.16,1,.3,1)" };

export default function Contact() {
  const secRef = useRef<HTMLElement>(null);
  const routeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const sec = secRef.current!, route = routeRef.current!;
    const pts = [...sec.querySelectorAll<HTMLElement>(".s8-point")];
    const chars = [...sec.querySelectorAll<HTMLElement>(".s8-line")].map((l) => [...l.children] as HTMLElement[]);
    const anims: Animation[] = [];

    // hidden until the section comes into view
    const len = route.getTotalLength();
    route.style.strokeDasharray = String(len);
    route.style.strokeDashoffset = String(len);
    pts.forEach((p) => { p.querySelector("i")!.style.transform = "scale(0)"; p.querySelector("span")!.style.clipPath = "inset(0 100% 0 0)"; });
    chars.flat().forEach((c) => { c.style.opacity = "0"; });

    function play() {
      sec.classList.add("is-on");
      const v = ROUTE_VERTICES;
      const seg = v.slice(1).map((p, i) => Math.hypot(p[0] - v[i][0], p[1] - v[i][1]));
      const total = seg.reduce((a, b) => a + b, 0);
      const DUR = 2100, segDur = DUR / seg.length;
      const kf: Keyframe[] = [{ strokeDashoffset: len, offset: 0, easing: E.io }];
      let acc = 0;
      seg.forEach((l, i) => { acc += l; kf.push({ strokeDashoffset: len * (1 - acc / total), offset: (i + 1) / seg.length, easing: E.io }); });
      anims.push(route.animate(kf, { duration: DUR, fill: "forwards" }));
      pts.forEach((p, i) => {
        const at = i * segDur + (i === 0 ? 0 : -40);
        anims.push(p.querySelector("i")!.animate([{ transform: "scale(0)" }, { transform: "scale(1.6)", offset: 0.55 }, { transform: "scale(1)" }], { delay: at, duration: 420, easing: E.out, fill: "forwards" }));
        anims.push(p.querySelector("span")!.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { delay: at + 120, duration: 320, easing: "steps(4, end)", fill: "forwards" }));
      });
      // headline: character by character, as in the hero
      const H = DUR - 300;
      let last = 0;
      chars.forEach((line, li) => line.forEach((c, ci) => {
        const d = H + li * 170 + ci * 20;
        last = Math.max(last, d);
        anims.push(c.animate([{ opacity: 0, transform: "translateY(0.32em)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { delay: d, duration: 900, easing: E.out, fill: "forwards" }));
      }));
      sec.style.setProperty("--copy-dl", last + 300 + "ms");
    }

    let done = false;
    const io = new IntersectionObserver(([e]) => {
      if (done || !e.isIntersecting || e.intersectionRatio < 0.45) return;
      done = true;
      play();
    }, { threshold: [0, 0.45, 0.7] });
    io.observe(sec);

    return () => {
      io.disconnect();
      anims.forEach((a) => a.cancel());
      sec.classList.remove("is-on");
      route.style.strokeDasharray = route.style.strokeDashoffset = "";
      pts.forEach((p) => { p.querySelector("i")!.style.transform = ""; p.querySelector("span")!.style.clipPath = ""; });
      chars.flat().forEach((c) => { c.style.opacity = ""; });
    };
  }, []);

  return (
    <section className="s8" id="contact" ref={secRef} aria-labelledby="s8-title">
      <div className="s8-headline">
        <div className="s8-route" aria-hidden="true">
          <svg viewBox="0 0 1221.34 344.554" fill="none">
            <path ref={routeRef} d="M0.723134 344.355L95.2231 0.855003L676.223 101.355L327.723 109.355L417.223 227.855L1221.22 101.355" stroke="#92C5E5" strokeWidth="1.5" />
          </svg>
          {POINTS.map((p, i) => (
            <div key={i} className="s8-point" style={{ left: p.left, top: p.top }}>
              <i />
              <span>({String(i + 1).padStart(2, "0")})</span>
            </div>
          ))}
        </div>
        <h2 className="s8-title" id="s8-title" aria-label="Bring the work. We'll build the path to automate it.">
          {LINES.map((l) => (
            <span key={l.text} className="s8-line" style={{ left: l.left, top: l.top }} aria-hidden="true">
              <SplitChars text={l.text} />
            </span>
          ))}
        </h2>
      </div>
      <div className="s8-row">
        <p className="s8-copy">
          Bring your hardware, a preferred platform, or nothing at all.<br />
          We build the combination of hardware, software, and support around your workflow.
        </p>
        <Button variant="primary" href="#" className="s8-btn">Talk to us</Button>
      </div>
    </section>
  );
}
