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

function pcbTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const g = c.getContext("2d")!;
  g.fillStyle = "#17202b";
  g.fillRect(0, 0, 1024, 640);
  g.strokeStyle = "#8d6438";
  g.lineWidth = 3;
  g.lineCap = "round";
  g.lineJoin = "round";
  const lines = [
    [120, 140, 420, 140, 420, 300, 700, 300],
    [180, 420, 520, 420, 520, 220],
    [260, 200, 260, 480, 640, 480],
    [760, 160, 900, 160, 900, 360, 700, 360],
    [140, 520, 400, 520, 400, 360],
  ];
  for (const pts of lines) {
    g.beginPath();
    g.moveTo(pts[0]!, pts[1]!);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!);
    g.stroke();
  }
  g.fillStyle = "#c6a15a";
  for (const [x, y] of [
    [300, 150],
    [250, 280],
    [160, 360],
    [430, 150],
    [700, 170],
    [760, 430],
    [500, 470],
  ]) {
    g.beginPath();
    g.arc(x!, y!, 7, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
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
      ?.load("500 64px Geist")
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
  const print = usePrint();
  const plane = printPlaneSize();

  const assets = useMemo(() => {
    const rough = beadTexture();
    const pcb = pcbTexture();
    const body = new THREE.MeshPhysicalMaterial({
      color: "#2c2e33",
      metalness: 0.92,
      roughness: 0.46,
      roughnessMap: rough,
      bumpMap: rough,
      bumpScale: 0.01,
      envMapIntensity: 0.65,
      clearcoat: 0.16,
      clearcoatRoughness: 0.42,
    });
    const faceMat = new THREE.MeshPhysicalMaterial({
      color: "#121416",
      metalness: 1,
      roughness: 0.82,
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
    const boardMat = new THREE.MeshStandardMaterial({ map: pcb, roughness: 0.78, metalness: 0.18 });
    const boardEdge = new THREE.MeshStandardMaterial({ color: "#10161e", roughness: 0.9 });
    return {
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
    const spread = (mobile ? 8.4 : 9.2) * open;
    const scale = THREE.MathUtils.lerp(mobile ? 0.92 : 1, mobile ? 0.58 : 0.5, open);
    root.current.scale.setScalar(scale);
    root.current.position.x = THREE.MathUtils.lerp(mobile ? 0 : 1.15, 0, open);
    root.current.rotation.order = "YXZ";
    root.current.rotation.y = THREE.MathUtils.lerp(mobile ? -0.4 : -0.62, -0.02, open);
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
    board.current.scale.setScalar(0.9 + 0.1 * reveal);
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
            <boxGeometry args={[7.4, 4.6, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.02]} material={assets.boardMat}>
            <planeGeometry args={[7.28, 4.48]} />
          </mesh>
          <group position={[-1.55, 1.15, 0.1]} ref={bind("nfc")}>
            {[1.12, 0.88, 0.64, 0.4].map((r) => (
              <mesh key={r} material={assets.copper}>
                <torusGeometry args={[r, 0.05, 8, 36]} />
              </mesh>
            ))}
            <mesh position={[0.15, -1.05, 0]} material={assets.copper}>
              <boxGeometry args={[0.08, 0.35, 0.04]} />
            </mesh>
          </group>
          <group position={[-2.35, 0.05, 0.08]} ref={bind("gnss")}>
            <mesh material={assets.ceramic}>
              <boxGeometry args={[1.12, 1.12, 0.08]} />
            </mesh>
            <mesh position={[0, 0, 0.06]} material={assets.gold}>
              <boxGeometry args={[0.48, 0.48, 0.03]} />
            </mesh>
            <mesh position={[0.72, 0.2, 0.04]} material={assets.gold}>
              <boxGeometry args={[0.42, 0.08, 0.02]} />
            </mesh>
          </group>
          <group position={[-3.05, -0.72, 0.08]} ref={bind("mic")}>
            <mesh material={assets.silver}>
              <boxGeometry args={[0.46, 0.46, 0.12]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.07]} material={assets.silicon}>
              <cylinderGeometry args={[0.09, 0.09, 0.03, 14]} />
            </mesh>
          </group>
          <group position={[-1.55, -1.55, 0.12]} ref={bind("haptics")}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={assets.silver}>
              <cylinderGeometry args={[0.46, 0.46, 0.16, 28]} />
            </mesh>
            <mesh position={[0.62, 0.16, 0]} rotation={[0, 0, 0.35]} material={assets.red}>
              <boxGeometry args={[0.7, 0.035, 0.035]} />
            </mesh>
            <mesh position={[0.58, -0.14, 0]} rotation={[0, 0, -0.2]} material={assets.silicon}>
              <boxGeometry args={[0.64, 0.035, 0.035]} />
            </mesh>
          </group>
          <group position={[0.15, 1.28, 0.09]} ref={bind("flash")}>
            <mesh material={assets.silicon2}>
              <boxGeometry args={[1.55, 1.12, 0.1]} />
            </mesh>
            <mesh position={[-0.55, 0.38, 0.06]} material={assets.silver}>
              <boxGeometry args={[0.12, 0.12, 0.02]} />
            </mesh>
          </group>
          <group position={[2.15, 1.15, 0.08]} ref={bind("bluetooth")}>
            <mesh material={assets.blue}>
              <boxGeometry args={[1.4, 0.74, 0.07]} />
            </mesh>
            <mesh position={[-0.28, 0, 0.05]} material={assets.silicon}>
              <boxGeometry args={[0.42, 0.42, 0.05]} />
            </mesh>
            {[-0.18, 0, 0.18].map((y) => (
              <mesh key={y} position={[0.42, y, 0.045]} material={assets.gold}>
                <boxGeometry args={[0.26, 0.07, 0.02]} />
              </mesh>
            ))}
          </group>
          <group position={[0.25, -1.48, 0.1]} ref={bind("battery")}>
            <RoundedBox args={[4.35, 1.22, 0.16]} radius={0.1} smoothness={3}>
              <primitive object={assets.silver} attach="material" />
            </RoundedBox>
            <mesh position={[1.95, 0, 0.02]} material={assets.kapton}>
              <boxGeometry args={[0.32, 0.62, 0.12]} />
            </mesh>
          </group>
          <group position={[1.85, -0.85, 0.09]} ref={bind("processor")}>
            <mesh material={assets.silicon}>
              <boxGeometry args={[1.28, 1.28, 0.05]} />
            </mesh>
            <mesh position={[0, 0, 0.06]} material={assets.silicon2}>
              <boxGeometry args={[0.78, 0.78, 0.08]} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  );
}
