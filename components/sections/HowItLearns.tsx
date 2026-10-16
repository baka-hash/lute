"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Point } from "./Problem";

/* Section 4 · How it learns (82:16818), 1440 × 1147.
   The learning loop is a thin 3D ribbon (three.js) inside the board frame; the camera orbits it slowly and the
   four step labels ride on the curve. Labels open in turn; the cycle never pauses. */

/* ---------- ribbon setup ---------- */
const TUBE_WIDTH = 0.01;
const SEGMENTS = 40; // few, straight segments: the loop reads as angular, with visible joints
const RADIAL_SEGMENTS = 8;
const AMPLITUDE = 0.5; // vertical swing of the loop: kept low so the ribbon sits inside the board
const TURNS = 2; // two whole turns, so the loop closes on itself
const PATH_RADIUS = 1.5;
const RADIUS_SWING = 0.18; // the two turns differ in radius (period = both turns), so they don't overlap
const TWIST = 2.5;

const CAMERA_RADIUS = 4.4;
const STRETCH_X = 2; // the loop is drawn twice as wide on screen without getting taller
const STRETCH_Y = 1.1; // and 10% taller
const DESIGN_HEIGHT = 545; // the ribbon keeps the pixel size it had in a 545-px board, however tall the board is
const RIBBON_COLOR = "#004D78"; // Lute Blue
const LABEL_EDGE = 16; // keep labels this far inside the board's right edge
const CAMERA_PHI = Math.PI / 3; // looking down 30°
const ROTATE_SPEED = 0.00152; // radians per frame
const CYCLE_MS = 4200;

// t = position along the loop. The loop makes two turns, so t and t + 0.5 point the same way and their labels
// would cover each other; these sit in four different directions (about a quarter turn apart, unevenly).
const STEPS = [
  { name: "(01) Deployment", desc: "Robots do real work in live operations.", t: 0.025 },
  { name: "(02) Data", desc: "Edge cases and interventions get captured.", t: 0.3 },
  { name: "(03) Better models", desc: "The data trains the next model.", t: 0.65 },
  { name: "(04) Better performance", desc: "Robots take on more work, more reliably. Then the loop starts again.", t: 0.925 },
];

/* closed curve: every term repeats exactly at t = 1, so the end meets the start */
function curvePoint(t: number, target = new THREE.Vector3()) {
  const angle = t * Math.PI * 2 * TURNS;
  const r = PATH_RADIUS * (1 + RADIUS_SWING * Math.sin(angle / 2));
  return target.set(
    Math.sin(angle) * r,
    Math.cos(angle * 1.5) * AMPLITUDE * 0.6,
    Math.cos(angle) * r,
  );
}

/* tube along the curve, with parallel-transport frames and a slow twist */
function buildTubeGeometry() {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i++) points.push(curvePoint(i / SEGMENTS));

  const tangents = points.map((_, i) => {
    const prev = points[Math.max(i - 1, 0)];
    const next = points[Math.min(i + 1, SEGMENTS)];
    return new THREE.Vector3().subVectors(next, prev).normalize();
  });

  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];
  const t0 = tangents[0];
  const ax = Math.abs(t0.x), ay = Math.abs(t0.y), az = Math.abs(t0.z);
  const seed = ax <= ay && ax <= az ? new THREE.Vector3(1, 0, 0) : ay <= az ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
  const n0 = new THREE.Vector3().crossVectors(t0, seed).normalize();
  normals.push(n0);
  binormals.push(new THREE.Vector3().crossVectors(t0, n0).normalize());

  const axis = new THREE.Vector3();
  const q = new THREE.Quaternion();
  for (let i = 1; i <= SEGMENTS; i++) {
    const n = normals[i - 1].clone();
    axis.crossVectors(tangents[i - 1], tangents[i]);
    if (axis.lengthSq() > 1e-10) {
      axis.normalize();
      const theta = Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1));
      n.applyQuaternion(q.setFromAxisAngle(axis, theta));
    }
    n.sub(tangents[i].clone().multiplyScalar(n.dot(tangents[i]))).normalize();
    normals.push(n);
    binormals.push(new THREE.Vector3().crossVectors(tangents[i], n).normalize());
  }

  const radius = TUBE_WIDTH * 0.5;
  const ringSize = RADIAL_SEGMENTS + 1;
  const positions = new Float32Array((SEGMENTS + 1) * ringSize * 3);
  const vertNormals = new Float32Array((SEGMENTS + 1) * ringSize * 3);
  const dir = new THREE.Vector3();
  for (let i = 0; i <= SEGMENTS; i++) {
    const twistAngle = (i / SEGMENTS) * Math.PI * 2 * TWIST;
    const p = points[i], N = normals[i], B = binormals[i];
    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
      const v = (j / RADIAL_SEGMENTS) * Math.PI * 2 + twistAngle;
      const c = Math.cos(v), s = Math.sin(v);
      dir.set(c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z).normalize();
      const k = (i * ringSize + j) * 3;
      positions[k] = p.x + dir.x * radius;
      positions[k + 1] = p.y + dir.y * radius;
      positions[k + 2] = p.z + dir.z * radius;
      vertNormals[k] = dir.x;
      vertNormals[k + 1] = dir.y;
      vertNormals[k + 2] = dir.z;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
      const a = i * ringSize + j, b = (i + 1) * ringSize + j, c = (i + 1) * ringSize + j + 1, d = i * ringSize + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(vertNormals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export default function HowItLearns() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [cycleKey, setCycleKey] = useState(0); // bumped on click so the next step waits a full cycle

  /* ---------- three.js scene ---------- */
  useEffect(() => {
    const container = sceneRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = container.clientWidth, height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // the gradient behind the canvas is plain CSS (50% opacity)
    container.prepend(renderer.domElement);

    // the page is drawn in 1440-px units and zoomed to the viewport, so render at the zoomed pixel density
    const fitRenderer = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      const zoom = container.getBoundingClientRect().width / width || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * zoom, 2.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // stretch the picture (wider, a little taller); labels project through the same matrix, so they stay on the curve
      const keep = DESIGN_HEIGHT / height; // the vertical field of view is fixed, so undo the growth with the board
      camera.projectionMatrix.elements[0] *= STRETCH_X * keep;
      camera.projectionMatrix.elements[5] *= STRETCH_Y * keep;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
    const target = new THREE.Vector3(0, 0, 0);
    const spherical = new THREE.Spherical(CAMERA_RADIUS, CAMERA_PHI, Math.PI / 4);
    fitRenderer();

    // flat Lute Blue (unlit, no tone mapping) so the ribbon is exactly the brand colour
    const geometry = buildTubeGeometry();
    const material = new THREE.MeshBasicMaterial({ color: RIBBON_COLOR, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // anchors snap to the nearest joint, so each label sits exactly on the angular line
    const anchors = STEPS.map((s) => curvePoint(Math.round(s.t * SEGMENTS) / SEGMENTS));
    const projected = new THREE.Vector3();

    const render = () => {
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
      renderer.render(scene, camera);
      // labels follow their anchor points; nearer ones sit on top
      const labels = labelRefs.current;
      const widths = labels.map((el) => el?.offsetWidth ?? 0); // read all sizes before writing any styles
      anchors.forEach((anchor, i) => {
        const el = labels[i];
        if (!el) return;
        projected.copy(anchor).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        // the label's square sits on its point of the curve; near the right edge the box flips to the left of it
        const flip = x - 4 + widths[i] > width - LABEL_EDGE;
        if (el.dataset.flip !== String(flip)) el.dataset.flip = String(flip);
        const left = flip ? x + 4 - widths[i] : x - 4;
        el.style.transform = `translate(${left.toFixed(1)}px, ${(y - 4).toFixed(1)}px)`;
        el.style.visibility = projected.z < 1 ? "visible" : "hidden";
        el.style.zIndex = String(Math.round((1 - projected.z) * 10000));
      });
    };

    // spin only while the board is on screen
    let raf = 0, inView = false;
    const loop = () => {
      spherical.theta += ROTATE_SPEED;
      render();
      raf = inView ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !raf && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(container);

    const ro = new ResizeObserver(() => { fitRenderer(); render(); });
    ro.observe(container);
    render();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  /* ---------- step cycle: no pause on hover ---------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % STEPS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [cycleKey]);

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

      <div className="s4-board" data-r="fade">
        <div className="s4-bg" aria-hidden="true" />
        <div className="s4-scene" ref={sceneRef}>
          <ol className="s4-points" aria-label="The learning loop">
            {STEPS.map((s, i) => (
              <li key={s.name} ref={(el) => { labelRefs.current[i] = el; }} className="s4-point">
                <button
                  type="button"
                  className={i === active ? "is-open" : undefined}
                  aria-expanded={i === active}
                  onClick={() => { setActive(i); setCycleKey((k) => k + 1); }}
                >
                  <i aria-hidden="true" />
                  <span className="s4-point-box">
                    <span className="s4-point-name">{s.name}</span>
                    <span className="s4-point-desc"><span>{s.desc}</span></span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
