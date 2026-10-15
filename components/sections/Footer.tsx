"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { LinkedInIcon, LuteWordmark, XIcon } from "../icons";

const LINKS = ["Blog", "About us", "News", "Product"];

// reveal order: tagline → links → location → social → meta
const dl = (i: number) => ({ "--dl": `${200 + i * 70}ms` }) as CSSProperties;

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const foot = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > 0.3) { foot.classList.add("is-on"); io.disconnect(); }
    }, { threshold: [0, 0.3, 0.6] });
    io.observe(foot);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="s9" id="footer" ref={ref}>
      <div className="s9-brand">
        <a className="s9-wordmark" href="#" aria-label="Lute home"><span><LuteWordmark /></span></a>
        <p className="s9-tagline" style={dl(0)}>Put intelligence to work.</p>
      </div>
      <nav className="s9-cols" aria-label="Footer">
        <ul className="s9-links">
          {LINKS.map((label, i) => (
            <li key={label} style={dl(1 + i)}><a href="#">{label}</a></li>
          ))}
        </ul>
        <div className="s9-col2">
          <p className="s9-loc" style={dl(5)}>Located in San Francisco, USA<br />and in Warsaw, Poland</p>
          <div className="s9-social" style={dl(6)}>
            <a href="#" aria-label="Lute on LinkedIn"><LinkedInIcon /></a>
            <a href="#" aria-label="Lute on X"><XIcon /></a>
          </div>
        </div>
      </nav>
      <div className="s9-meta" style={dl(7)}>
        <span>© 2026 Lute. All rights reserved.</span>
        <a href="https://tonik.com" target="_blank" rel="noopener">Made by <u>Tonik</u></a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms</a>
      </div>
    </footer>
  );
}
