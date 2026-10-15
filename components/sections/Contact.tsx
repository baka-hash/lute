"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Button from "../Button";
import SplitChars from "../SplitChars";

/* Section 8 · CTA (v2 layout, Figma 100:22199), 1440 × 506.
   Headline and copy on the left, a square video with the "Talk to us" button on the right. */

const LINES = [
  { text: "Bring the work.", left: 0, top: 0 },
  { text: "We'll build the path", left: 280, top: 83 },
  { text: "to automate it.", left: 156, top: 166 },
];
const E = { out: "cubic-bezier(.16,1,.3,1)" };

export default function Contact() {
  const secRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // the video only plays while the section is on screen
  useEffect(() => {
    const video = videoRef.current!;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play()?.catch(() => {});
      else video.pause();
    }, { threshold: 0.1 });
    io.observe(video);
    return () => io.disconnect();
  }, []);

  // reveal: headline character by character (as in the hero), then copy; video and button via CSS (.is-on)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const sec = secRef.current!;
    const chars = [...sec.querySelectorAll<HTMLElement>(".s8-line")].map((l) => [...l.children] as HTMLElement[]);
    const anims: Animation[] = [];
    chars.flat().forEach((c) => { c.style.opacity = "0"; });

    function play() {
      sec.classList.add("is-on");
      let last = 0;
      chars.forEach((line, li) => line.forEach((c, ci) => {
        const d = 200 + li * 170 + ci * 20;
        last = Math.max(last, d);
        anims.push(c.animate(
          [{ opacity: 0, transform: "translateY(0.32em)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
          { delay: d, duration: 900, easing: E.out, fill: "forwards" },
        ));
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
      chars.flat().forEach((c) => { c.style.opacity = ""; });
    };
  }, []);

  return (
    <section className="s8" id="contact" ref={secRef} aria-labelledby="s8-title">
      <div className="s8-marks" aria-hidden="true">
        {[0, 1].map((row) => (
          <span key={row}>
            {[0, 1, 2].map((col) => <i key={col} style={{ "--i": row * 3 + col } as CSSProperties} />)}
          </span>
        ))}
      </div>

      <div className="s8-content">
        <h2 className="s8-title" id="s8-title" aria-label="Bring the work. We'll build the path to automate it.">
          {LINES.map((l) => (
            <span key={l.text} className="s8-line" style={{ left: l.left, top: l.top }} aria-hidden="true">
              <SplitChars text={l.text} />
            </span>
          ))}
        </h2>
        <p className="s8-copy">
          Bring your hardware, a preferred platform, or nothing at all.<br />
          We build the combination of hardware, software, and support around your workflow.
        </p>
      </div>

      <div className="s8-media">
        <video
          ref={videoRef}
          src="/media/lute_knit_bw.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Robot knitting"
        />
        <span className="s8-shade" aria-hidden="true" />
        <Button variant="primary" href="#" className="s8-btn">Talk to us</Button>
      </div>
    </section>
  );
}
