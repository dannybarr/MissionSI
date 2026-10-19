import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { cardGeometries } from "./geometry";
import { drawHeroPrint, printPlaneSize } from "./print";
import { explodePose, explodeSignals } from "./explodePose";
import type { PartId } from "@/landing/sections/open-parts";

const FOCUS: PartId[] = [
  "nfc",
  "gnss",
  "mic",
  "haptics",
  "flash",
  "bluetooth",
  "battery",
  "processor",
];

function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function beadTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  let s = 1337;
  for (let i = 0; i < size * size; i++) {
    s = (Math.imul(s, 16807) + 11) >>> 0;
    const n = 176 + (s / 4294967296 - 0.5) * 78;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = n;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2.8);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Board is 7.28 × 4.48 cm. Major parts as [x, y, w, h] footprints, card centre origin. */
const BOARD = { w: 7.28, h: 4.48 };
const LAYOUT: Record<PartId | "pmic", [number, number, number, number]> = {
  nfc: [-2.45, 1.28, 1.95, 1.45],
  gnss: [-2.6, -0.25, 1.0, 1.0],
  mic: [-1.05, -0.3, 0.46, 0.46],
  haptics: [-2.45, -1.55, 0.95, 0.95],
  flash: [0.15, 1.28, 1.55, 1.12],
  bluetooth: [2.3, 1.3, 1.5, 0.8],
  processor: [1.75, -0.1, 1.1, 1.1],
  battery: [0.95, -1.45, 3.9, 1.18],
  usbc: [-3.55, 0, 0.3, 0.9],
  pmic: [0.25, -0.15, 0.5, 0.5],
};

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function inPart(x: number, y: number, pad: number) {
  for (const [cx, cy, w, h] of Object.values(LAYOUT)) {
    if (Math.abs(x - cx) < w / 2 + pad && Math.abs(y - cy) < h / 2 + pad) return true;
  }
  return Math.abs(x) > BOARD.w / 2 - 0.12 || Math.abs(y) > BOARD.h / 2 - 0.12;
}

/** Matte black solder mask, gold routing with 45° bends, vias, pads and white silkscreen. */
function pcbTexture() {
  const W = 2048;
  const H = Math.round((W * BOARD.h) / BOARD.w);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const px = (x: number) => ((x + BOARD.w / 2) / BOARD.w) * W;
  const py = (y: number) => (1 - (y + BOARD.h / 2) / BOARD.h) * H;
  const k = W / BOARD.w;
  const r = rand(4242);

  g.fillStyle = "#131416";
  g.fillRect(0, 0, W, H);
  const noise = g.getImageData(0, 0, W, H);
  for (let i = 0; i < noise.data.length; i += 4) {
    const n = (r() - 0.5) * 7;
    noise.data[i] = noise.data[i]! + n;
    noise.data[i + 1] = noise.data[i + 1]! + n;
    noise.data[i + 2] = noise.data[i + 2]! + n + 1;
  }
  g.putImageData(noise, 0, 0);

  // Copper pours under the mask: faint, slightly lighter regions.
  g.fillStyle = "rgba(60, 52, 36, 0.18)";
  for (let i = 0; i < 9; i++) g.fillRect(r() * W, r() * H, 120 + r() * 360, 80 + r() * 200);

  // Traces: Manhattan routes with chamfered corners, in bundles.
  g.lineCap = "round";
  g.lineJoin = "round";
  for (let b = 0; b < 46; b++) {
    const lanes = 2 + Math.floor(r() * 5);
    let x = r() * W;
    let y = r() * H;
    const pts: [number, number][] = [[x, y]];
    for (let s = 0; s < 3 + Math.floor(r() * 3); s++) {
      const len = 60 + r() * 380;
      const dir = Math.floor(r() * 4);
      const diag = 18 + r() * 30;
      if (dir === 0) x += len;
      else if (dir === 1) x -= len;
      else if (dir === 2) y += len * 0.6;
      else y -= len * 0.6;
      x += (r() - 0.5) * diag;
      pts.push([x, y]);
    }
    const width = r() < 0.2 ? 6 : 2.6;
    for (let l = 0; l < lanes; l++) {
      g.strokeStyle = `rgba(${176 + r() * 20}, ${134 + r() * 16}, ${66 + r() * 12}, ${0.55 + r() * 0.3})`;
      g.lineWidth = width;
      g.beginPath();
      pts.forEach(([a, bb], i) => (i ? g.lineTo(a + l * 9, bb + l * 9) : g.moveTo(a + l * 9, bb + l * 9)));
      g.stroke();
    }
    // Via at each route end.
    const [ex, ey] = pts[pts.length - 1]!;
    g.fillStyle = "#c9a35b";
    g.beginPath();
    g.arc(ex, ey, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#0b0b0c";
    g.beginPath();
    g.arc(ex, ey, 3, 0, Math.PI * 2);
    g.fill();
  }

  // Scattered vias.
  for (let i = 0; i < 260; i++) {
    const x = r() * W;
    const y = r() * H;
    g.fillStyle = "rgba(201, 163, 91, 0.9)";
    g.beginPath();
    g.arc(x, y, 4.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#0b0b0c";
    g.beginPath();
    g.arc(x, y, 1.8, 0, Math.PI * 2);
    g.fill();
  }

  // Pad rings and silkscreen outlines around every major part.
  g.font = `600 ${Math.round(k * 0.085)}px "Geist Mono", monospace`;
  let n = 1;
  for (const [id, [cx, cy, w, h]] of Object.entries(LAYOUT)) {
    if (id === "battery") continue;
    const x0 = px(cx - w / 2) - 10;
    const y0 = py(cy + h / 2) - 10;
    const ww = w * k + 20;
    const hh = h * k + 20;
    g.fillStyle = "rgba(196, 160, 92, 0.85)";
    const pads = Math.max(4, Math.round(w * 9));
    for (let i = 0; i < pads; i++) {
      g.fillRect(x0 + 14 + ((ww - 28) * i) / (pads - 1) - 3, y0 - 6, 6, 12);
      g.fillRect(x0 + 14 + ((ww - 28) * i) / (pads - 1) - 3, y0 + hh - 6, 6, 12);
    }
    g.strokeStyle = "rgba(235, 235, 230, 0.75)";
    g.lineWidth = 2.4;
    g.strokeRect(x0 - 8, y0 - 14, ww + 16, hh + 28);
    g.fillStyle = "rgba(235, 235, 230, 0.8)";
    g.fillText(`U${n++}`, x0 - 6, y0 - 22);
  }
  g.fillText("MISSION MS-01  REV C", px(-0.4), py(-2.1));
  g.fillText("DB  2026", px(2.6), py(-2.1));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Laser marking on an IC top: low-contrast grey type on black epoxy. */
function chipTexture(lines: string[], seed: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 384;
  const g = c.getContext("2d")!;
  g.fillStyle = "#151517";
  g.fillRect(0, 0, 512, 384);
  const r = rand(seed);
  const img = g.getImageData(0, 0, 512, 384);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (r() - 0.5) * 10;
    img.data[i] = img.data[i]! + v;
    img.data[i + 1] = img.data[i + 1]! + v;
    img.data[i + 2] = img.data[i + 2]! + v;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = "rgba(150, 152, 156, 0.85)";
  g.font = '600 52px "Geist Mono", monospace';
  lines.forEach((t, i) => g.fillText(t, 54, 140 + i * 66));
  g.beginPath();
  g.arc(44, 44, 12, 0, Math.PI * 2);
  g.fillStyle = "rgba(120, 122, 126, 0.7)";
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A flat rounded-rectangle spiral coil, as etched copper. */
function coilGeometry(w: number, h: number, turns: number, pitch: number, trace: number) {
  const shapes: THREE.Shape[] = [];
  const rr = (s: THREE.Path, ww: number, hh: number, rad: number, reverse: boolean) => {
    const pts: THREE.Vector2[] = [];
    const corner = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (Math.PI / 2) * (i / 6);
        pts.push(new THREE.Vector2(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad));
      }
    };
    corner(ww / 2 - rad, hh / 2 - rad, 0);
    corner(-ww / 2 + rad, hh / 2 - rad, Math.PI / 2);
    corner(-ww / 2 + rad, -hh / 2 + rad, Math.PI);
    corner(ww / 2 - rad, -hh / 2 + rad, Math.PI * 1.5);
    if (reverse) pts.reverse();
    s.setFromPoints(pts);
  };
  for (let t = 0; t < turns; t++) {
    const ow = w - t * pitch * 2;
    const oh = h - t * pitch * 2;
    const rad = Math.max(0.04, 0.22 - t * 0.03);
    const outer = new THREE.Shape();
    rr(outer, ow, oh, rad, false);
    const hole = new THREE.Path();
    rr(hole, ow - trace * 2, oh - trace * 2, Math.max(0.02, rad - trace), true);
    outer.holes.push(hole);
    shapes.push(outer);
  }
  return new THREE.ExtrudeGeometry(shapes, { depth: 0.012, bevelEnabled: false, curveSegments: 4 });
}

/** Hundreds of 0402 and 0603 passives: the detail that makes a board read as real. */
function Passives({ body, cap, cap2 }: { body: THREE.Material; cap: THREE.Material; cap2: THREE.Material }) {
  const data = useMemo(() => {
    const r = rand(77);
    const items: { x: number; y: number; rot: number; big: boolean; dark: boolean }[] = [];
    let tries = 0;
    while (items.length < 150 && tries++ < 6000) {
      const x = (r() - 0.5) * BOARD.w;
      const y = (r() - 0.5) * BOARD.h;
      if (inPart(x, y, 0.1)) continue;
      if (items.some((p) => Math.abs(p.x - x) < 0.13 && Math.abs(p.y - y) < 0.1)) continue;
      items.push({ x, y, rot: r() < 0.7 ? 0 : Math.PI / 2, big: r() < 0.3, dark: r() < 0.35 });
    }
    return items;
  }, []);
  const tan = useRef<THREE.InstancedMesh>(null);
  const black = useRef<THREE.InstancedMesh>(null);
  const ends = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    let ti = 0;
    let bi = 0;
    let ei = 0;
    for (const p of data) {
      const L = p.big ? 0.16 : 0.1;
      const Wd = p.big ? 0.08 : 0.05;
      e.set(0, 0, p.rot);
      q.setFromEuler(e);
      s.set(L * 0.62, Wd, Wd * 0.8);
      v.set(p.x, p.y, Wd * 0.4);
      m.compose(v, q, s);
      if (p.dark) black.current?.setMatrixAt(bi++, m);
      else tan.current?.setMatrixAt(ti++, m);
      for (const side of [-1, 1]) {
        const dx = Math.cos(p.rot) * side * L * 0.4;
        const dy = Math.sin(p.rot) * side * L * 0.4;
        s.set(L * 0.2, Wd * 1.02, Wd * 0.84);
        v.set(p.x + dx, p.y + dy, Wd * 0.42);
        m.compose(v, q, s);
        ends.current?.setMatrixAt(ei++, m);
      }
    }
    if (tan.current) {
      tan.current.count = ti;
      tan.current.instanceMatrix.needsUpdate = true;
    }
    if (black.current) {
      black.current.count = bi;
      black.current.instanceMatrix.needsUpdate = true;
    }
    if (ends.current) {
      ends.current.count = ei;
      ends.current.instanceMatrix.needsUpdate = true;
    }
  }, [data]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useEffect(() => () => box.dispose(), [box]);
  return (
    <group position={[0, 0, 0.02]}>
      <instancedMesh ref={tan} args={[box, body, data.length]} />
      <instancedMesh ref={black} args={[box, cap2, data.length]} />
      <instancedMesh ref={ends} args={[box, cap, data.length * 2]} />
    </group>
  );
}

function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.62;
    return () => {
      scene.environment = null;
      tex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function usePrint() {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    const plane = printPlaneSize();
    canvas.width = 1280;
    canvas.height = Math.round(1280 * (plane.h / plane.w));
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas, t };
  }, []);
  useEffect(() => {
    let live = true;
    const draw = (img: CanvasImageSource | null) => {
      const ctx = tex.canvas.getContext("2d");
      if (!ctx) return;
      drawHeroPrint(ctx, tex.canvas.width, tex.canvas.height, img);
      tex.t.needsUpdate = true;
    };
    const img = new Image();
    img.decoding = "async";
    img.onload = () => live && draw(img);
    img.src = "/assets/nasa/earth-240.webp";
    document.fonts
      ?.load("400 64px Geist")
      .then(() => live && img.complete && draw(img))
      .catch(() => {});
    return () => {
      live = false;
      tex.t.dispose();
    };
  }, [tex]);
  return tex.t;
}

export function ExplodedScene() {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const root = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const face = useRef<THREE.Group>(null);
  const board = useRef<THREE.Group>(null);
  const parts = useRef<Partial<Record<PartId, THREE.Object3D | null>>>({});
  const ready = useRef(false);
  const geos = useMemo(() => cardGeometries(), []);
  const coil = useMemo(() => coilGeometry(LAYOUT.nfc[2] - 0.12, LAYOUT.nfc[3] - 0.12, 7, 0.075, 0.042), []);
  useEffect(() => () => coil.dispose(), [coil]);
  const print = usePrint();
  const plane = printPlaneSize();

  const assets = useMemo(() => {
    const rough = beadTexture();
    const pcb = pcbTexture();
    const body = new THREE.MeshPhysicalMaterial({
      color: "#56585c",
      metalness: 0.62,
      roughness: 0.56,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.01,
      envMapIntensity: 0.65,
      clearcoat: 0.16,
      clearcoatRoughness: 0.42,
    });
    const faceMat = new THREE.MeshPhysicalMaterial({
      color: "#2b2d30",
      metalness: 0.35,
      roughness: 0.8,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.008,
      envMapIntensity: 0.22,
    });
    const ink = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const steel = new THREE.MeshPhysicalMaterial({
      color: "#c5c9ce",
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 1.3,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#101113",
      roughness: 0.72,
      metalness: 0.15,
    });
    const gold = new THREE.MeshPhysicalMaterial({
      color: "#d4b56e",
      metalness: 1,
      roughness: 0.24,
    });
    const copper = new THREE.MeshStandardMaterial({
      color: "#c47a3a",
      metalness: 0.78,
      roughness: 0.32,
    });
    const ceramic = new THREE.MeshStandardMaterial({
      color: "#d5d8de",
      metalness: 0.55,
      roughness: 0.38,
    });
    const silicon = new THREE.MeshStandardMaterial({
      color: "#141414",
      metalness: 0.35,
      roughness: 0.42,
    });
    const silicon2 = new THREE.MeshStandardMaterial({
      color: "#0c0c0c",
      metalness: 0.4,
      roughness: 0.36,
    });
    const silver = new THREE.MeshStandardMaterial({
      color: "#c9cdd4",
      metalness: 0.86,
      roughness: 0.28,
    });
    const blue = new THREE.MeshStandardMaterial({
      color: "#1a4c86",
      metalness: 0.25,
      roughness: 0.55,
    });
    const red = new THREE.MeshStandardMaterial({
      color: "#c23b32",
      roughness: 0.5,
      metalness: 0.1,
    });
    const kapton = new THREE.MeshStandardMaterial({
      color: "#e2b340",
      metalness: 0.35,
      roughness: 0.48,
    });
    const boardMat = new THREE.MeshPhysicalMaterial({
      map: pcb,
      roughness: 0.55,
      metalness: 0.1,
      clearcoat: 0.35,
      clearcoatRoughness: 0.5,
    });
    const boardEdge = new THREE.MeshStandardMaterial({ color: "#1b1a16", roughness: 0.85 });
    const capTan = new THREE.MeshStandardMaterial({ color: "#8f7556", roughness: 0.6 });
    const capEnd = new THREE.MeshStandardMaterial({ color: "#d9dadc", metalness: 0.9, roughness: 0.3 });
    const resBlack = new THREE.MeshStandardMaterial({ color: "#121212", roughness: 0.55 });
    const ferrite = new THREE.MeshStandardMaterial({ color: "#1c1c1e", roughness: 0.9 });
    const chipFlash = new THREE.MeshStandardMaterial({
      map: chipTexture(["MSN-F1", "2614 A7"], 11),
      roughness: 0.62,
      metalness: 0.1,
    });
    const chipCpu = new THREE.MeshStandardMaterial({
      map: chipTexture(["MSN-C1", "ARM 26"], 23),
      roughness: 0.62,
      metalness: 0.1,
    });
    const chipSmall = new THREE.MeshStandardMaterial({
      map: chipTexture(["PM1", "X2"], 31),
      roughness: 0.62,
      metalness: 0.1,
    });
    return {
      capTan,
      capEnd,
      resBlack,
      ferrite,
      chipFlash,
      chipCpu,
      chipSmall,
      rough,
      pcb,
      body,
      faceMat,
      ink,
      steel,
      dark,
      gold,
      copper,
      ceramic,
      silicon,
      silicon2,
      silver,
      blue,
      red,
      kapton,
      boardMat,
      boardEdge,
    };
  }, []);

  const backPanel = useMemo(() => {
    const g = geos.panel.clone();
    g.scale(1, 1, -1);
    g.computeVertexNormals();
    return g;
  }, [geos]);

  useEffect(() => {
    const a = assets;
    return () => {
      backPanel.dispose();
      a.body.dispose();
      a.faceMat.dispose();
      a.ink.dispose();
      a.steel.dispose();
      a.dark.dispose();
      a.gold.dispose();
      a.copper.dispose();
      a.ceramic.dispose();
      a.silicon.dispose();
      a.silicon2.dispose();
      a.silver.dispose();
      a.blue.dispose();
      a.red.dispose();
      a.kapton.dispose();
      a.boardMat.dispose();
      a.boardEdge.dispose();
      for (const m of [a.capTan, a.capEnd, a.resBlack, a.ferrite, a.chipFlash, a.chipCpu, a.chipSmall]) {
        m.map?.dispose();
        m.dispose();
      }
      a.rough.dispose();
      a.pcb.dispose();
    };
  }, [assets, backPanel]);

  if (print && assets.ink.map !== print) {
    assets.ink.map = print;
    assets.ink.needsUpdate = true;
  }

  const bind = (id: PartId) => (node: THREE.Object3D | null) => {
    parts.current[id] = node;
  };

  useFrame((state, dt) => {
    const camera = cam.current;
    const width = state.size.width;
    const height = state.size.height;
    if (
      !camera ||
      !root.current ||
      !shell.current ||
      !face.current ||
      !board.current ||
      width < 2 ||
      height < 2
    )
      return;
    const mobile = width < 760;
    const open = smooth(Math.min(1, explodePose.p / 0.42));
    // Shells have to clear the board, then the whole assembly scales down so the
    // side callouts stay on the creme instead of sitting on the graphite.
    const spread = (mobile ? 8.4 : 8.9) * open;
    const scale = THREE.MathUtils.lerp(mobile ? 0.8 : 0.6, mobile ? 0.56 : 0.52, open);
    root.current.scale.setScalar(scale);
    root.current.position.x = THREE.MathUtils.lerp(mobile ? 0 : 3.1, mobile ? 0 : 0.9, open);
    root.current.rotation.order = "YXZ";
    root.current.rotation.y = THREE.MathUtils.lerp(mobile ? -0.4 : -0.78, -0.12, open);
    root.current.rotation.x = THREE.MathUtils.lerp(-0.38, mobile ? -0.7 : -0.58, open);
    shell.current.position.set(-spread, -0.04 * open, 0.15 * open);
    shell.current.rotation.y = 0.72 * open;
    face.current.position.set(spread, 0.06 * open, 0.42 * open);
    face.current.rotation.order = "YXZ";
    face.current.rotation.y = -0.72 * open;
    face.current.rotation.x = -0.05 * open;
    const reveal = smooth(Math.min(1, Math.max(0, (open - 0.05) / 0.55)));
    board.current.visible = open > 0.04;
    board.current.position.z = 0.2 * open;
    board.current.scale.setScalar(0.92 + 0.2 * reveal);
    const dist = THREE.MathUtils.lerp(mobile ? 14 : 17.5, mobile ? 16 : 26, open);
    camera.position.set(0, dist * 0.2, dist);
    camera.lookAt(0, -0.15, 0);
    camera.fov = mobile ? 36 : 30;
    camera.updateProjectionMatrix();
    const focus = explodePose.focus;
    for (const id of FOCUS) {
      const obj = parts.current[id];
      if (!obj) continue;
      const s = focus === id ? 1.14 : 1;
      const next = THREE.MathUtils.damp(obj.scale.x, s, 8, dt);
      obj.scale.setScalar(next);
    }
    if (!ready.current) {
      ready.current = true;
      explodeSignals.onReady();
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cam}
        makeDefault
        fov={30}
        near={0.05}
        far={80}
        position={[0, 2, 18]}
      />
      <StudioEnv />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={["#f3efe6", "#243040", 0.45]} />
      <directionalLight position={[5, 9, 7]} intensity={2.5} />
      <directionalLight position={[-6, 2, 5]} intensity={0.55} />
      <group ref={root}>
        <group ref={shell}>
          <mesh geometry={geos.body} material={assets.body} castShadow={false} />
          <mesh geometry={backPanel} material={assets.faceMat} />
          <mesh geometry={geos.shell} material={assets.steel} />
          <mesh geometry={geos.cavity} material={assets.dark} />
          <mesh geometry={geos.tongue} material={assets.dark} />
          <mesh geometry={geos.pins} material={assets.gold} />
        </group>
        <group ref={face}>
          <mesh geometry={geos.panel} material={assets.faceMat} />
          <mesh position={[0, 0, geos.faceZ + 0.02]} material={assets.ink}>
            <planeGeometry args={[plane.w, plane.h]} />
          </mesh>
        </group>
        <group ref={board}>
          <mesh position={[0, 0, -0.03]} material={assets.boardEdge}>
            <boxGeometry args={[BOARD.w + 0.06, BOARD.h + 0.06, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.002]} material={assets.boardMat}>
            <planeGeometry args={[BOARD.w, BOARD.h]} />
          </mesh>
          <Passives body={assets.capTan} cap={assets.capEnd} cap2={assets.resBlack} />

          {/* NFC: etched copper spiral on a black ferrite sheet. */}
          <group position={[LAYOUT.nfc[0], LAYOUT.nfc[1], 0.01]} ref={bind("nfc")}>
            <mesh position={[0, 0, 0.004]} material={assets.ferrite}>
              <boxGeometry args={[LAYOUT.nfc[2], LAYOUT.nfc[3], 0.012]} />
            </mesh>
            <mesh position={[0, 0, 0.012]} material={assets.copper} geometry={coil} />
            <mesh position={[0, 0, 0.03]} material={assets.chipSmall}>
              <boxGeometry args={[0.36, 0.36, 0.04]} />
            </mesh>
          </group>

          {/* GNSS: ceramic patch antenna with a silver feed. */}
          <group position={[LAYOUT.gnss[0], LAYOUT.gnss[1], 0.06]} ref={bind("gnss")}>
            <RoundedBox args={[0.9, 0.9, 0.12]} radius={0.03} smoothness={2}>
              <primitive object={assets.kapton} attach="material" />
            </RoundedBox>
            <mesh position={[0, 0, 0.065]} material={assets.silver}>
              <boxGeometry args={[0.62, 0.62, 0.01]} />
            </mesh>
            <mesh position={[0.08, 0.08, 0.075]} rotation={[Math.PI / 2, 0, 0]} material={assets.silver}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            </mesh>
          </group>

          {/* MEMS microphone: a lidded metal can with a port hole. */}
          <group position={[LAYOUT.mic[0], LAYOUT.mic[1], 0.05]} ref={bind("mic")}>
            <RoundedBox args={[0.4, 0.3, 0.1]} radius={0.02} smoothness={2}>
              <primitive object={assets.silver} attach="material" />
            </RoundedBox>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.08, 0, 0.051]} material={assets.silicon}>
              <cylinderGeometry args={[0.04, 0.04, 0.01, 14]} />
            </mesh>
          </group>

          {/* Haptics: a flat LRA under a metal cover, with its flex tail. */}
          <group position={[LAYOUT.haptics[0], LAYOUT.haptics[1], 0.08]} ref={bind("haptics")}>
            <RoundedBox args={[0.9, 0.62, 0.14]} radius={0.05} smoothness={3}>
              <primitive object={assets.silver} attach="material" />
            </RoundedBox>
            <mesh position={[0.55, 0.15, -0.04]} material={assets.kapton}>
              <boxGeometry args={[0.32, 0.14, 0.012]} />
            </mesh>
            <mesh position={[0.68, 0.15, -0.03]} material={assets.gold}>
              <boxGeometry args={[0.1, 0.12, 0.014]} />
            </mesh>
          </group>

          {/* Flash: BGA package, laser-marked. */}
          <group position={[LAYOUT.flash[0], LAYOUT.flash[1], 0.07]} ref={bind("flash")}>
            <mesh material={assets.silicon2}>
              <boxGeometry args={[LAYOUT.flash[2] * 0.82, LAYOUT.flash[3] * 0.82, 0.1]} />
            </mesh>
            <mesh position={[0, 0, 0.051]} material={assets.chipFlash}>
              <planeGeometry args={[LAYOUT.flash[2] * 0.8, LAYOUT.flash[3] * 0.8]} />
            </mesh>
          </group>

          {/* Bluetooth: a small module with a meandered PCB antenna and a shield can. */}
          <group position={[LAYOUT.bluetooth[0], LAYOUT.bluetooth[1], 0.05]} ref={bind("bluetooth")}>
            <mesh material={assets.blue}>
              <boxGeometry args={[LAYOUT.bluetooth[2], LAYOUT.bluetooth[3], 0.05]} />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => (
              <mesh key={i} position={[-0.6 + i * 0.1, 0.12, 0.03]} material={assets.gold}>
                <boxGeometry args={[0.03, 0.32, 0.006]} />
              </mesh>
            ))}
            <mesh position={[-0.35, 0.28, 0.03]} material={assets.gold}>
              <boxGeometry args={[0.53, 0.03, 0.006]} />
            </mesh>
            <mesh position={[0.32, -0.04, 0.06]} material={assets.steel}>
              <boxGeometry args={[0.66, 0.56, 0.07]} />
            </mesh>
          </group>

          {/* Processor: QFN on its pad ring, laser-marked. */}
          <group position={[LAYOUT.processor[0], LAYOUT.processor[1], 0.05]} ref={bind("processor")}>
            <mesh material={assets.silicon}>
              <boxGeometry args={[LAYOUT.processor[2], LAYOUT.processor[3], 0.03]} />
            </mesh>
            <mesh position={[0, 0, 0.04]} material={assets.silicon2}>
              <boxGeometry args={[0.82, 0.82, 0.07]} />
            </mesh>
            <mesh position={[0, 0, 0.076]} material={assets.chipCpu}>
              <planeGeometry args={[0.8, 0.8]} />
            </mesh>
          </group>

          <mesh position={[LAYOUT.pmic[0], LAYOUT.pmic[1], 0.04]} material={assets.chipSmall}>
            <boxGeometry args={[0.42, 0.42, 0.06]} />
          </mesh>

          {/* Battery: a thin LiPo pouch, wrapped in amber tape, with nickel tabs. */}
          <group position={[LAYOUT.battery[0], LAYOUT.battery[1], 0.1]} ref={bind("battery")}>
            <RoundedBox args={[LAYOUT.battery[2], LAYOUT.battery[3], 0.16]} radius={0.07} smoothness={4}>
              <primitive object={assets.silver} attach="material" />
            </RoundedBox>
            <mesh position={[-LAYOUT.battery[2] / 2 + 0.22, 0, 0.002]} material={assets.kapton}>
              <boxGeometry args={[0.32, LAYOUT.battery[3] + 0.02, 0.168]} />
            </mesh>
            <mesh position={[LAYOUT.battery[2] / 2 - 0.5, 0, 0.002]} material={assets.kapton}>
              <boxGeometry args={[0.22, LAYOUT.battery[3] + 0.02, 0.168]} />
            </mesh>
            {[-0.25, 0.25].map((y) => (
              <mesh key={y} position={[-LAYOUT.battery[2] / 2 - 0.12, y, -0.04]} material={assets.steel}>
                <boxGeometry args={[0.26, 0.16, 0.012]} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </>
  );
}
