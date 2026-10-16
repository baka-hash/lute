"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import Button from "./Button";
import SplitChars from "./SplitChars";
import { LuteIcon, LuteLogo } from "./icons";

/* Hero = keyframed intro canvas (Figma 90:19483) + the fixed navigation layer (Navi open, 90:19484). */

/* timeline (ms) */
const T = {
  intro: 0, // slide 1: bg, logo, icon
  route: 500, // constellation draws
  routeDur: 2100,
  head: 2500, // slide 2: headline
  s3: 4400, // slide 3: points leave
  s4: 5800, // slide 4: full-bleed, navigation + copy
  end: 7900,
};
const E = { out: "cubic-bezier(.16,1,.3,1)", io: "cubic-bezier(.65,0,.35,1)" };
// the video fades in with the window: fully opaque once the window reaches 80% of its size;
// the black overlay on top of it grows with the window to 30%
const VIDEO_FULL_AT = 0.8;
// headline: each character takes HEAD_CHAR_DUR, staggered per line and per character
const HEAD_LINE_DELAY = 170, HEAD_CHAR_DELAY = 22, HEAD_CHAR_DUR = 900;
const VIDEO_AFTER_HEAD = 0.98; // the video starts when the headline animation is 98% done
const GROW_DUR = 2600; // the window grows from the bottom edge to full bleed
const SHADE_MAX = 0.3;

/* CSS cubic-bezier(x1, y1, x2, y2) as a function of progress, to follow the window's eased size in JS */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const coord = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 30; i++) { t = (lo + hi) / 2; if (coord(t, x1, x2) < x) lo = t; else hi = t; }
    return coord(t, y1, y2);
  };
}
const easeIo = cubicBezier(0.65, 0, 0.35, 1);
// the menu is usable (and the page scrolls) once the bar has formed
const NAV_READY = T.s4 + 1100;

const ROUTE_VERTICES = [[0.58, 344.56], [282.08, 1.06], [402.58, 101.56], [228.08, 117.56], [607.58, 229.56], [1218.58, 109.06]];
const POINTS = [
  { left: 75, top: 340.086 },
  { left: 354, top: 1 },
  { left: 476, top: 100.086 },
  { left: 301, top: 116 },
  { left: 681, top: 227.086 },
  { left: 1295, top: 109 },
];
const LINES = [
  { text: "Make", left: 0, top: 0 },
  { text: "the impossible", left: 488, top: 119 },
  { text: "operational.", left: 139, top: 240 },
];
const NAV_LINKS = ["Blog", "About us", "News"];

type Props = {
  canvasRef: RefObject<HTMLDivElement | null>;
  chromeRef: RefObject<HTMLElement | null>;
};

export default function Hero({ canvasRef, chromeRef }: Props) {
  const r = {
    bg: useRef<HTMLDivElement>(null),
    route: useRef<SVGPathElement>(null),
    constellation: useRef<HTMLDivElement>(null),
    headline: useRef<HTMLHeadingElement>(null),
    media: useRef<HTMLDivElement>(null),
    mediaGray: useRef<HTMLDivElement>(null),
    shade: useRef<HTMLSpanElement>(null),
    video: useRef<HTMLVideoElement>(null),
    speed: useRef<HTMLDivElement>(null),
    copyHead: useRef<HTMLParagraphElement>(null),
    lede: useRef<HTMLParagraphElement>(null),
    btn1: useRef<HTMLAnchorElement>(null),
    icon: useRef<HTMLDivElement>(null),
    naviBg: useRef<HTMLDivElement>(null),
    logo: useRef<HTMLAnchorElement>(null),
    menu: useRef<HTMLButtonElement>(null),
    panel: useRef<HTMLElement>(null),
    cta: useRef<HTMLAnchorElement>(null),
  };
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  /* ---------- intro timeline ---------- */
  useEffect(() => {
    const el = <X,>(ref: RefObject<X | null>) => ref.current as X;
    const html = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anims: Animation[] = [];
    const A = (target: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = target.animate(kf, { fill: "both", ...o });
      a.pause();
      anims.push(a);
      return a;
    };

    /* slide 1: entry */
    A(el(r.bg), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-out" });
    A(el(r.logo), [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { delay: 150, duration: 700, easing: E.out });
    A(el(r.icon), [{ opacity: 0 }, { opacity: 1 }], { delay: 200, duration: 600 });

    // lute icon: its four blocks blink in sequence while the intro loads
    [...el(r.icon).querySelectorAll("path")].reverse().forEach((p, i) => {
      A(p, [{ opacity: 1 }, { opacity: 0.15, offset: 0.3 }, { opacity: 1, offset: 0.6 }, { opacity: 1 }],
        { delay: 300 + i * 120, duration: 1100, iterations: 4, easing: "ease-in-out" });
    });

    /* constellation: route draws vertex to vertex, each point lands when the line reaches it */
    const route = el(r.route);
    const pts = ROUTE_VERTICES;
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const total = seg.reduce((a, b) => a + b, 0);
    const len = route.getTotalLength();
    route.style.strokeDasharray = String(len);
    // equal time per segment reads better than constant speed (last segment is very long)
    const kf: Keyframe[] = [{ strokeDashoffset: len, offset: 0, easing: E.io }];
    let acc = 0;
    seg.forEach((l, i) => { acc += l; kf.push({ strokeDashoffset: len * (1 - acc / total), offset: (i + 1) / seg.length, easing: E.io }); });
    const segDur = T.routeDur / seg.length;
    A(route, kf, { delay: T.route, duration: T.routeDur });

    const pointEls = [...el(r.constellation).querySelectorAll<HTMLElement>(".point")];
    pointEls.forEach((pt, i) => {
      const at = T.route + i * segDur - (i === 0 ? 150 : 40);
      A(pt.querySelector("i")!, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.6)", opacity: 1, offset: 0.55 }, { transform: "scale(1)", opacity: 1 }],
        { delay: at, duration: 420, easing: E.out });
      A(pt.querySelector("span")!, [{ clipPath: "inset(0 100% 0 0)", opacity: 0.4 }, { clipPath: "inset(0 0 0 0)", opacity: 1 }],
        { delay: at + 120, duration: 320, easing: "steps(4, end)" });
      // slide 3: points leave in reverse order
      A(pt, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px)" }],
        { delay: T.s3 + (pointEls.length - 1 - i) * 45, duration: 380, easing: "ease-in" });
    });
    A(route, [{ opacity: 1 }, { opacity: 0 }], { delay: T.s3 + 120, duration: 450, easing: "ease-in", composite: "replace" });

    /* slide 2: headline, character by character */
    el(r.headline).querySelectorAll<HTMLElement>(".h-line").forEach((line, li) => {
      [...line.children].forEach((ch, ci) => {
        A(ch, [{ opacity: 0, transform: "translateY(0.32em)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
          { delay: T.head + li * HEAD_LINE_DELAY + ci * HEAD_CHAR_DELAY, duration: HEAD_CHAR_DUR, easing: E.out });
      });
      // slide 4: headline lifts away
      A(line, [{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: "translateY(-48px)", filter: "blur(8px)" }],
        { delay: T.s4 + li * 80, duration: 650, easing: "cubic-bezier(.55,0,.75,.2)" });
    });

    /* media window: starts when the headline animation is 98% done, then grows in one move from the bottom edge
       to full bleed */
    const headStagger = [...el(r.headline).querySelectorAll(".h-line")]
      .map((line, li) => li * HEAD_LINE_DELAY + (line.children.length - 1) * HEAD_CHAR_DELAY);
    const headDur = Math.max(...headStagger) + HEAD_CHAR_DUR;
    const videoAt = T.head + VIDEO_AFTER_HEAD * headDur;
    const span = GROW_DUR;
    A(el(r.media), [
      { clipPath: "inset(100% 44px -40px 44px round 16px)" },
      { clipPath: "inset(0px 0px 0px 0px round 0px)" },
    ], { delay: videoAt, duration: span, easing: E.io });

    // the picture travels with its window
    A(el(r.mediaGray), [
      { transform: "translateY(calc(100% - 18px)) scale(.98)" },
      { transform: "translateY(0px) scale(1)" },
    ], { delay: videoAt, duration: span, easing: E.io });

    // video opacity and the black overlay follow the window's (eased) size
    const SAMPLES = 48;
    const videoKF: Keyframe[] = [], shadeKF: Keyframe[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const o = i / SAMPLES, size = easeIo(o);
      videoKF.push({ opacity: Math.min(1, size / VIDEO_FULL_AT), offset: o });
      shadeKF.push({ opacity: SHADE_MAX * size, offset: o });
    }
    A(el(r.video), videoKF, { delay: videoAt, duration: span });
    A(el(r.shade), shadeKF, { delay: videoAt, duration: span });

    /* slide 4: centred wordmark slides into the navigation bar */
    A(el(r.naviBg), [{ clipPath: "inset(0 50% 0 50%)", opacity: 0 }, { clipPath: "inset(0 0% 0 0%)", opacity: 1 }],
      { delay: T.s4 + 500, duration: 900, easing: E.io });
    A(el(r.logo), [{ transform: "translateX(0)" }, { transform: "translateX(-180px)" }],
      { delay: T.s4 + 500, duration: 900, easing: E.io, composite: "add" });
    A(el(r.menu), [{ opacity: 0, transform: "translateX(-8px)" }, { opacity: 1, transform: "none" }],
      { delay: T.s4 + 1100, duration: 500, easing: E.out });
    A(el(r.speed), [{ opacity: 0 }, { opacity: 1 }], { delay: T.s4 + 1200, duration: 500 });

    [el(r.copyHead), el(r.lede), el(r.btn1)].forEach((target, i) => {
      A(target, [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
        { delay: T.s4 + 900 + i * 130, duration: 800, easing: E.out });
    });

    // everything now sits on its first frame: reveal the stage, lock scrolling until the hero lands
    html.classList.remove("booting");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    html.classList.add("intro-lock");

    const video = el(r.video);
    let cancelled = false, startTimer = 0, readyTimer = 0;
    const land = () => { html.classList.remove("intro-lock"); setReady(true); };
    const start = () => {
      if (cancelled) return;
      if (reduce) {
        anims.forEach((a) => { a.currentTime = T.end; });
        video.pause();
        land();
        return;
      }
      try { video.currentTime = 0; } catch {}
      video.play()?.catch(() => {});
      anims.forEach((a) => a.play());
      readyTimer = window.setTimeout(land, NAV_READY);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      if (!cancelled) startTimer = window.setTimeout(start, 250);
    });

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(readyTimer);
      anims.forEach((a) => a.cancel());
      html.classList.remove("intro-lock");
    };
  }, []);

  /* ---------- navigation open / close ---------- */
  const navAnims = useRef<Animation[]>([]);
  const shownOpen = useRef(false);
  const openRef = useRef(false);
  openRef.current = navOpen;
  // with a mouse the menu opens on hover and closes shortly after the pointer leaves the menu, panel and logo
  const hoverOpened = useRef(false);
  const hoverOpenedAt = useRef(0);
  const closeTimer = useRef(0);
  const hoverIn = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse" || !ready) return;
    clearTimeout(closeTimer.current);
    if (!openRef.current) { hoverOpened.current = true; hoverOpenedAt.current = performance.now(); setNavOpen(true); }
  };
  const hoverKeep = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") clearTimeout(closeTimer.current);
  };
  const hoverOut = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      // the panel may have grown under a resting pointer while it opened
      if ([r.menu, r.panel, r.logo].some((x) => x.current?.matches(":hover"))) return;
      hoverOpened.current = false;
      setNavOpen(false);
    }, 300);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (shownOpen.current === navOpen) return;
    shownOpen.current = navOpen;
    const panel = r.panel.current!, cta = r.cta.current!;
    const rises = [...panel.querySelectorAll<HTMLElement>(".navi-links .rise")];
    navAnims.current.forEach((a) => a.cancel());
    navAnims.current = [];
    const N = (target: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = target.animate(kf, { fill: "forwards", ...o });
      navAnims.current.push(a);
      return a;
    };
    const closed = "inset(0px 0px calc(100% - 48px) 0px)", full = "inset(0px 0px 0px 0px)";

    if (navOpen) {
      panel.classList.add("is-open");
      N(panel, [{ clipPath: closed }, { clipPath: full }], { duration: 650, easing: E.io });
      rises.forEach((a, i) => N(a, [{ transform: "translateY(105%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
        { delay: 180 + i * 70, duration: 700, easing: E.out, fill: "both" }));
      N(cta, [{ transform: "translateY(12px)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { delay: 420, duration: 600, easing: E.out, fill: "both" });
      // opened by click / keyboard: move focus into the panel (not when it opened on hover)
      if (hoverOpened.current) return;
      const t = window.setTimeout(() => {
        if (openRef.current) panel.querySelector<HTMLAnchorElement>(".navi-links a")?.focus({ preventScroll: true });
      }, 300);
      return () => clearTimeout(t);
    }
    panel.classList.add("is-animating");
    [...rises, cta].forEach((target) => N(target, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: "ease-in" }));
    N(panel, [{ clipPath: full }, { clipPath: closed }], { delay: 80, duration: 520, easing: E.io })
      .finished.then(() => {
        if (openRef.current) return;
        panel.classList.remove("is-open", "is-animating");
        navAnims.current.forEach((x) => x.cancel());
      })
      .catch(() => {});
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setNavOpen(false); r.menu.current?.focus(); }
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!r.panel.current?.contains(target) && !r.menu.current?.contains(target)) setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [navOpen]);

  return (
    <>
      <main className="stage" id="stage">
        <div className="canvas" ref={canvasRef}>
          <div className="bg" ref={r.bg} />

          <div className="headline">
            <div className="constellation" ref={r.constellation} aria-hidden="true">
              <svg viewBox="0 0 1218.73 345.036" fill="none">
                <path ref={r.route} d="M0.580092 344.561L282.08 1.0605L402.58 101.561L228.08 117.561L607.58 229.561L1218.58 109.061" stroke="#92C5E5" strokeWidth="1.5" />
              </svg>
              {POINTS.map((p, i) => (
                <div key={i} className="point" style={{ left: p.left, top: p.top }}>
                  <i />
                  <span>({String(i + 1).padStart(2, "0")})</span>
                </div>
              ))}
            </div>
            <h1 ref={r.headline} aria-label="Make the impossible operational." style={{ margin: 0 }}>
              {LINES.map((l) => (
                <span key={l.text} className="h-line" style={{ left: l.left, top: l.top }} aria-hidden="true">
                  <SplitChars text={l.text} />
                </span>
              ))}
            </h1>
          </div>

          <div className="media" ref={r.media} aria-hidden="true">
            {/* B&W: the clip stays black & white (50% darken + blue fade at the bottom) from the first frame */}
            <div className="media-layer media-gray" ref={r.mediaGray}>
              <video ref={r.video} src="/media/lute_sklep_t2_bw.mp4" poster="/assets/images/hero-poster.jpg" muted loop playsInline preload="auto" />
              <span className="media-shade" ref={r.shade} />
            </div>
          </div>

          <div className="speed" ref={r.speed}>Video speed 3x</div>

          <div className="copy">
            <div className="copy-text">
              <p className="copy-h" ref={r.copyHead}>Make the impossible operational</p>
              <p ref={r.lede}>
                Lute combines physical AI software, monitoring, and remote support. Together they turn emerging capabilities into work businesses can rely on today.
              </p>
            </div>
            <div className="buttons">
              <Button ref={r.btn1} variant="primary" href="#">Talk to us</Button>
            </div>
          </div>

          <div className="lute-icon" ref={r.icon} aria-hidden="true"><LuteIcon /></div>
        </div>
      </main>

      <header className="chrome" ref={chromeRef}>
        <div className="navi-bg" ref={r.naviBg} />
        <a className="logo" ref={r.logo} href="#" aria-label="Lute home" onPointerEnter={hoverKeep} onPointerLeave={hoverOut}><LuteLogo /></a>
        <nav
          className="navi-panel"
          id="naviPanel"
          ref={r.panel}
          aria-label="Main"
          inert={!navOpen}
          onPointerEnter={hoverKeep}
          onPointerLeave={hoverOut}
        >
          <ul className="navi-links">
            {NAV_LINKS.map((label) => (
              <li key={label}><span className="rise"><a href="#">{label}</a></span></li>
            ))}
          </ul>
          <Button ref={r.cta} variant="dark" href="#">Talk to us</Button>
        </nav>
        <button
          className="menu"
          ref={r.menu}
          type="button"
          disabled={!ready}
          aria-expanded={navOpen}
          aria-controls="naviPanel"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          onClick={(e) => {
            // a reflex click right after the hover opened the menu should not close it again
            const mouse = (e.nativeEvent as PointerEvent).pointerType === "mouse";
            if (mouse && hoverOpened.current && performance.now() - hoverOpenedAt.current < 800) return;
            hoverOpened.current = false;
            setNavOpen((o) => !o);
          }}
          onPointerEnter={hoverIn}
          onPointerLeave={hoverOut}
        >
          <span className="flip" aria-hidden="true">
            <span className="flip-in"><span>Menu</span><span>Close</span></span>
          </span>
        </button>
      </header>
    </>
  );
}
