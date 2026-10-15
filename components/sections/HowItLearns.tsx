"use client";

import { useEffect, useRef } from "react";
import { Point } from "./Problem";

/* Section 4 · How it learns (Figma "Process", 82:16818), 1440 × 1047.
   The learning loop draws itself, then turns in 3D; the step tags ride on the line. */

const LOOP_PATH =
  "M39.0556 0.99846L138.056 6.49846L294.556 42.4985L571.056 137.498L692.056 182.998L926.056 288.998L943.056 300.998H922.556L685.556 188.498L473.056 88.9985L351.056 49.9985L205.056 32.9985L130.556 36.4985L63.0556 54.4985L17.0556 92.9985L1.05557 148.498L30.0556 221.498L114.556 298.998L259.056 369.498L445.056 406.998H638.556L795.556 365.498L897.556 298.498L943.056 224.498L934.556 154.998L897.556 103.498L839.556 65.4985L758.056 42.4985L676.056 32.9985L581.556 39.4985L483.056 58.4985L314.556 115.998L81.5556 249.498L26.5556 288.998L4.05557 316.998L23.0556 330.498L105.056 310.998L387.556 209.498L761.056 61.9985L883.556 18.9985L940.556 7.99846L943.056 18.9985C933.056 27.3318 912.556 44.5985 910.556 46.9985C908.556 49.3985 862.389 75.9985 839.556 88.9985L695.056 154.998L571.056 196.998L445.056 224.498L338.056 234.498";

// tag positions from Figma (board space); each tag docks to the nearest point of the line
const STEPS = [
  { name: "(01) Deployment", desc: "Robots do real work in live operations.", left: 240, top: 60 },
  { name: "(02) Data", desc: "Edge cases and interventions get captured.", left: 771, top: 195 },
  { name: "(03) Better models", desc: "The data trains the next model.", left: 1058, top: 137 },
  { name: "(04) Better performance", desc: "Robots take on more work, more reliably. Then the loop starts again.", left: 537, top: 296 },
];

export default function HowItLearns() {
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = boardRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SVGNS = "http://www.w3.org/2000/svg";
    const flat = board.querySelector<SVGSVGElement>(".s4-line")!;
    const path = flat.querySelector("path")!;
    const spin = board.querySelector<SVGSVGElement>(".s4-spin")!;
    const steps = [...board.querySelectorAll<HTMLLIElement>(".s4-step")];
    const LINE_X = 201.5, LINE_Y = 62; // where the Figma line sits in the board
    const cleanups: (() => void)[] = [];

    /* --- sample the Figma path (this exact line is what turns; its shape never changes) --- */
    const L = path.getTotalLength();
    const N = 480;
    type P = { x: number; y: number; s: number; h: number; X: number; Z: number };
    const pts: P[] = [];
    for (let i = 0; i <= N; i++) {
      const p = path.getPointAtLength((i / N) * L);
      pts.push({ x: p.x, y: p.y, s: i / N, h: 0, X: 0, Z: 0 });
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const CX = (minX + maxX) / 2, CY = (minY + maxY) / 2;

    /* --- motion from the 3D Ribbon Generator: the drawing lies flat and the camera orbits around the vertical
           axis, looking down through a 45° lens. At the start pose the projection is exactly the Figma line. --- */
    const MOT = { elev: Math.PI / 4, bob: 0.1, period: 26000, camDist: 1.6 * (maxX - minX), H: 95 };
    const SE0 = Math.sin(MOT.elev), CE0 = Math.cos(MOT.elev);
    // real depth: the loop rises and falls along its length; each point is placed in 3D so that,
    // seen from the start camera, it lands exactly on the Figma line
    pts.forEach((p) => {
      p.h = MOT.H * Math.sin(p.s * Math.PI * 2 * 1.3 + 0.8); // height above the floor plane
      p.X = p.x - CX;
      p.Z = (p.y - CY + p.h * CE0) / SE0; // floor position that projects onto the Figma line
    });
    function pose(i: number, th: number, ph: number, kp: number) {
      const p = pts[i];
      const ct = Math.cos(th), st = Math.sin(th);
      const xr = p.X * ct - p.Z * st, zr = p.X * st + p.Z * ct; // camera orbits the vertical axis
      const e = MOT.elev + kp * MOT.bob * Math.sin(ph); // and rises/dips a little to show the height
      const se = Math.sin(e), ce = Math.cos(e);
      const y = zr * se - p.h * ce; // screen y (down = nearer the bottom)
      const depth = zr * ce + p.h * se; // towards the camera = positive
      const persp = 1 + kp * (MOT.camDist / (MOT.camDist - depth) - 1);
      return { x: xr * persp, y: y * persp, z: depth };
    }
    // framing: the view gently zooms/pans to keep the turning loop (and its tags) inside the board
    const FIT = { x0: 40, x1: 1360 - 230, y0: 24, y1: 545 - 96 };
    let R = 1;
    for (let t = 0; t < 24; t++) for (let i = 0; i <= N; i += 8) R = Math.max(R, Math.abs(pose(i, (t / 24) * Math.PI * 2, 0, 1).z));
    const cam = { s: 1, cx: CX, cy: CY }; // current framing (scale + centre, line space)

    /* --- dock each tag (its square) to the nearest point of the line; it stays on that point --- */
    const docks = STEPS.map((st, n) => {
      const sx = st.left + 4 - LINE_X, sy = st.top + 4 - LINE_Y;
      let best = 0, bd = Infinity;
      pts.forEach((p, i) => { const d = (p.x - sx) ** 2 + (p.y - sy) ** 2; if (d < bd) { bd = d; best = i; } });
      steps[n].style.left = "0px";
      steps[n].style.top = "0px";
      return best;
    });

    /* --- draw in chunks so the far side can fade back --- */
    const CH = 60, per = N / CH;
    const chunks: SVGPolylineElement[] = [];
    for (let c = 0; c < CH; c++) { const pl = document.createElementNS(SVGNS, "polyline"); spin.appendChild(pl); chunks.push(pl); }
    spin.style.visibility = "hidden";
    cleanups.push(() => spin.replaceChildren());

    let theta = 0, k = 0, clock = 0; // spin angle, 0→1 ease-in of the 3D motion, running time
    function frame() {
      const ph = (clock / MOT.period) * Math.PI * 2;
      const raw: { x: number; y: number; z: number }[] = [];
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let i = 0; i <= N; i++) {
        const q = pose(i, theta, ph, k);
        raw.push(q);
        if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y;
      }
      // target framing for this pose; ease towards it so the "camera" moves smoothly
      const ts = Math.min(1, (FIT.x1 - FIT.x0) / (x1 - x0), (FIT.y1 - FIT.y0) / (y1 - y0));
      const tcx = (FIT.x0 + FIT.x1) / 2 - LINE_X - (ts * (x0 + x1)) / 2;
      const tcy = (FIT.y0 + FIT.y1) / 2 - LINE_Y - (ts * (y0 + y1)) / 2;
      if (k <= 0) { cam.s = 1; cam.cx = CX; cam.cy = CY; }
      else {
        const f = 0.035 * k;
        cam.s += Math.min(cam.s, ts) === ts && ts < cam.s ? (ts - cam.s) * Math.max(f, 0.12) : (ts - cam.s) * f; // zoom out faster than in
        cam.cx += (tcx - cam.cx) * Math.max(f, 0.06);
        cam.cy += (tcy - cam.cy) * Math.max(f, 0.06);
      }
      const ox = k <= 0 ? CX : cam.cx, oy = k <= 0 ? CY : cam.cy;
      return raw.map((q) => ({ x: ox + q.x * cam.s, y: oy + q.y * cam.s, z: q.z * k }));
    }
    function render() {
      const P = frame();
      for (let c = 0; c < CH; c++) {
        const a = Math.floor(c * per), b = Math.min(N, Math.floor((c + 1) * per) + 1);
        let str = "", zs = 0;
        for (let i = a; i <= b; i++) { str += P[i].x.toFixed(1) + "," + P[i].y.toFixed(1) + " "; zs += P[i].z; }
        chunks[c].setAttribute("points", str);
        const depth = Math.max(0, Math.min(1, (zs / (b - a + 1) + R) / (2 * R)));
        chunks[c].style.opacity = (1 - k * (1 - (0.22 + 0.78 * depth))).toFixed(3);
        chunks[c].style.strokeWidth = (1.5 + k * (0.7 + 1.8 * depth - 1.5)).toFixed(2); // nearer = thicker
      }
      steps.forEach((li, i) => {
        const q = P[docks[i]];
        li.style.transform = `translate(${(q.x + LINE_X - 4).toFixed(1)}px, ${(q.y + LINE_Y - 4).toFixed(1)}px)`;
        const depth = Math.max(0, Math.min(1, (q.z + R) / (2 * R)));
        li.style.opacity = li.classList.contains("is-active") ? "1" : (1 - k * (1 - (0.72 + 0.28 * depth))).toFixed(3);
      });
    }
    render(); // tags sit on the line from the start

    /* --- step cycle (hover/focus opens a step and pauses) --- */
    let active = -1, timer = 0, hovering = false, inView = false, started = false;
    function setActive(n: number) {
      active = n;
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === n);
        s.querySelector("button")!.setAttribute("aria-expanded", String(i === n));
      });
    }
    const CYCLE = 4200;
    function schedule() {
      clearTimeout(timer);
      if (hovering || !inView || reduce) return;
      timer = window.setTimeout(() => { setActive((active + 1) % steps.length); schedule(); }, CYCLE);
    }
    const listeners = new AbortController();
    steps.forEach((s, i) => {
      const b = s.querySelector("button")!;
      const enter = () => { hovering = true; clearTimeout(timer); setActive(i); };
      const leave = () => { hovering = false; schedule(); };
      const opt = { signal: listeners.signal };
      b.addEventListener("mouseenter", enter, opt);
      b.addEventListener("focus", enter, opt);
      b.addEventListener("mouseleave", leave, opt);
      b.addEventListener("blur", leave, opt);
      b.addEventListener("click", () => setActive(i), opt);
    });
    cleanups.push(() => listeners.abort());

    /* --- rotation loop --- */
    let raf = 0, last = 0, spinStart = 0;
    const PERIOD = 26000; // one spin about the loop's axis
    function loop(now: number) {
      if (!last) last = now;
      const dt = Math.min(64, now - last);
      last = now;
      const t = now - spinStart;
      k = Math.min(1, t / 3500);
      k = k * k * (3 - 2 * k); // ease the 3D motion in
      theta += (dt / PERIOD) * Math.PI * 2 * k; // spin, easing up to speed
      clock += dt * k;
      render();
      raf = inView ? requestAnimationFrame(loop) : 0;
    }
    function startSpin() {
      flat.style.visibility = "hidden";
      spin.style.visibility = "visible";
      spinStart = performance.now();
      last = 0;
      if (!raf && inView) raf = requestAnimationFrame(loop);
    }

    const stepTimers: number[] = [];
    let draw: Animation | null = null;
    function start() {
      if (started) return;
      started = true;
      if (reduce) { steps.forEach((s) => s.classList.add("in")); setActive(3); return; }
      path.style.strokeDasharray = String(L);
      // the line draws at an even pen speed; each tag lands when the line reaches it
      const DRAW = 5200;
      draw = path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: DRAW, easing: "linear", fill: "both" });
      steps.forEach((s, i) => stepTimers.push(window.setTimeout(() => s.classList.add("in"), DRAW * (docks[i] / N))));
      draw.finished.then(() => { setActive(0); schedule(); startSpin(); }).catch(() => {});
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting && e.intersectionRatio > 0.2;
      if (inView && e.intersectionRatio > 0.35) start();
      if (started && spinStart && inView && !raf) { last = 0; raf = requestAnimationFrame(loop); }
      if (started) schedule();
    }, { threshold: [0, 0.2, 0.35, 0.6] });
    io.observe(board);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      stepTimers.forEach(clearTimeout);
      draw?.cancel();
      path.style.strokeDasharray = "";
      flat.style.visibility = "";
      steps.forEach((s) => s.classList.remove("in", "is-active"));
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <section className="s4" id="how-it-learns" aria-labelledby="s4-title">
      <p className="s4-eyebrow mono-xs" data-r="fade">(How it learns)</p>
      <h2 className="s4-title" id="s4-title" aria-label="Today's edge cases become tomorrow's capabilities.">
        <span className="s2-line" style={{ left: 168.87, top: 134 }} aria-hidden="true">
          <Point n="01" />
          <span className="s2-txt" data-r="line">Today&apos;s edge cases</span>
        </span>
        <span className="s2-line" style={{ left: 479.87, top: 206 }} aria-hidden="true">
          <span className="s2-txt" data-r="line">become</span>
          <Point n="02" />
        </span>
        <span className="s2-line" style={{ left: 40, top: 274 }} aria-hidden="true">
          <Point n="03" />
          <span className="s2-txt" data-r="line">tomorrow&apos;s capabilities.</span>
        </span>
      </h2>
      <p className="s4-body" data-r="fade">
        Real work produces the situations labs miss. We capture edge cases and interventions. They become data that trains better models. Every deployment makes the system more capable.
      </p>

      <div className="s4-board" ref={boardRef} data-r="fade">
        <svg className="s4-spin" aria-hidden="true" />
        <svg className="s4-line" viewBox="0 0 946.206 407.998" fill="none" aria-hidden="true">
          <path d={LOOP_PATH} stroke="#92C5E5" strokeWidth="1.5" />
        </svg>

        <ol className="s4-steps" aria-label="The learning loop">
          {STEPS.map((s) => (
            <li key={s.name} className="s4-step" style={{ left: s.left, top: s.top }}>
              <button type="button" aria-expanded="false">
                <i />
                <span className="s4-tag">
                  <span className="s4-name">{s.name}</span>
                  <span className="s4-desc"><span>{s.desc}</span></span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
