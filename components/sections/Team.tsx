"use client";

import { useEffect, useRef } from "react";

/* Section 6 · Team logos (Figma "Team logos", 75:10448), 1440 × 221: looping marquee */

const SPEED = 45; // design px per second

function LogoSet({ copy = false }: { copy?: boolean }) {
  // the copy only exists to make the loop seamless, so screen readers skip it
  const alt = (text: string) => (copy ? "" : text);
  return (
    <li className="s6-set" aria-hidden={copy || undefined}>
      <span className="s6-logo s6-uw" style={{ width: 200 }}>
        <img src="/assets/logos/university-of-warsaw-emblem.png" alt="" style={{ width: 49.68, height: 54 }} />
        <img src="/assets/logos/university-of-warsaw-text.svg" alt={alt("University of Warsaw")} style={{ width: 66.25, height: 20.17 }} />
      </span>
      <span className="s6-logo" style={{ width: 120 }}><img src="/assets/logos/esa.svg" alt={alt("European Space Agency")} style={{ height: 47 }} /></span>
      <span className="s6-logo" style={{ width: 145 }}><img src="/assets/logos/imperial-college-london.svg" alt={alt("Imperial College London")} style={{ height: 39.5 }} /></span>
      <span className="s6-logo" style={{ width: 144 }}><img src="/assets/logos/polyai.svg" alt={alt("PolyAI")} style={{ height: 44 }} /></span>
      <span className="s6-logo" style={{ width: 174 }}><img src="/assets/logos/morgan-stanley.svg" alt={alt("Morgan Stanley")} style={{ height: 25 }} /></span>
      <span className="s6-logo" style={{ width: 167 }}><img src="/assets/logos/university-of-cambridge.svg" alt={alt("University of Cambridge")} style={{ height: 35 }} /></span>
      <span className="s6-logo" style={{ width: 67 }}><img src="/assets/logos/tum.svg" alt={alt("Technical University of Munich")} style={{ height: 35 }} /></span>
      <span className="s6-logo" style={{ width: 120 }}><img src="/assets/logos/epfl.svg" alt={alt("EPFL")} style={{ height: 35 }} /></span>
      <span className="s6-logo" style={{ width: 156.75 }}><img src="/assets/logos/samsung.svg" alt={alt("Samsung")} style={{ height: 24 }} /></span>
    </li>
  );
}

export default function Team() {
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const track = trackRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const set = track.querySelector<HTMLElement>(".s6-set")!;
    track.style.setProperty("--s6-dur", (set.offsetWidth / SPEED).toFixed(1) + "s");
    track.classList.add("is-running");
    // run only while visible
    const io = new IntersectionObserver(([e]) => { track.style.animationPlayState = e.isIntersecting ? "" : "paused"; });
    io.observe(track);
    return () => { io.disconnect(); track.classList.remove("is-running"); };
  }, []);

  return (
    <section className="s6" id="team" aria-labelledby="s6-title">
      <h2 className="s6-title" id="s6-title" data-r="fade">Our team comes from</h2>
      <div className="s6-viewport">
        <ul className="s6-track" ref={trackRef}>
          <LogoSet />
          <LogoSet copy />
        </ul>
      </div>
    </section>
  );
}
