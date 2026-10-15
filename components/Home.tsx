"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Hero from "./Hero";
import { GradientMapFilter } from "./icons";
import Blog from "./sections/Blog";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";
import HowItLearns from "./sections/HowItLearns";
import HowItWorks from "./sections/HowItWorks";
import Industries from "./sections/Industries";
import Problem from "./sections/Problem";
import Team from "./sections/Team";

/* Figma "Homepage v1" (55:2944). Everything is drawn in 1440-px design units and scaled to the viewport width:
   hero = keyframed intro canvas; fixed navigation layer; sections below in normal flow. */
const DESIGN_WIDTH = 1440;

export default function Home() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  /* ---------- fit the 1440-wide layout to the viewport ---------- */
  useLayoutEffect(() => {
    const canvas = canvasRef.current!, chrome = chromeRef.current!, sections = sectionsRef.current!;
    function fit() {
      const s = document.documentElement.clientWidth / DESIGN_WIDTH;
      chrome.style.transform = `scale(${s})`;
      sections.style.setProperty("zoom", String(s));
      sections.style.setProperty("--vhd", window.innerHeight / s + "px");
      canvas.style.height = Math.max(window.innerHeight / s, 600) + "px";
      canvas.style.transform = `scale(${s})`;
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  /* ---------- scroll reveals (section 2 onwards) ---------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("rv");
    // order inside a section: eyebrow → headline lines (points land after their line) → images → body copy
    const plan = (sec: Element) => {
      let d = 0;
      sec.querySelectorAll<HTMLElement>("[data-r]").forEach((el) => {
        const kind = el.dataset.r;
        const bottom = el.closest(".s2-bottom");
        if (kind === "line") { el.style.setProperty("--dl", d + "ms"); d += 110; }
        else if (kind === "pt") el.style.setProperty("--dl", d + 260 + "ms");
        else if (kind === "img" || kind === "type") el.style.setProperty("--dl", 250 + (bottom ? 200 : 0) + "ms");
        else if (kind === "fade") el.style.setProperty("--dl", (bottom ? 650 : 0) + "ms");
      });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        // tall (pinned) sections: count what is visible against the viewport, not the whole section
        const need = Math.min(e.boundingClientRect.height, window.innerHeight) * 0.3;
        if (!e.isIntersecting || e.intersectionRect.height < need) return;
        e.target.querySelectorAll("[data-r]").forEach((el) => el.classList.add("in"));
        io.unobserve(e.target);
      });
    }, { threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5] });
    sectionsRef.current!.querySelectorAll(":scope > section").forEach((sec) => { plan(sec); io.observe(sec); });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <GradientMapFilter />
      <Hero canvasRef={canvasRef} chromeRef={chromeRef} />
      <div className="sections" ref={sectionsRef}>
        <Problem />
        <HowItWorks />
        <HowItLearns />
        <Industries />
        <Team />
        <Blog />
        <Contact />
        <Footer />
      </div>
    </>
  );
}
