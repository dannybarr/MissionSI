import { Html, Line } from '@react-three/drei';
import type { GeometryParams } from '@/studio/studio/types';
import { MM } from './MissionCard';

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="mono whitespace-nowrap rounded-[3px] bg-[#101113]/85 px-1.5 py-0.5 text-[10px] text-[#e9e6df]">{text}</div>
    </Html>
  );
}

/** Dimension guides drawn in millimetres around the card. */
export function Guides({ g }: { g: GeometryParams }) {
  const off = 5;
  const tick = 1.2;
  const col = '#ff6a2b';
  const w2 = g.width / 2;
  const h2 = g.height / 2;
  const z = g.thickness / 2 + 0.1;
  return (
    <group scale={MM} userData={{ helper: true }}>
      <Line points={[[-w2, h2 + off, z], [w2, h2 + off, z]]} color={col} lineWidth={1} />
      <Line points={[[-w2, h2 + off - tick, z], [-w2, h2 + off + tick, z]]} color={col} lineWidth={1} />
      <Line points={[[w2, h2 + off - tick, z], [w2, h2 + off + tick, z]]} color={col} lineWidth={1} />
      <Label position={[0, h2 + off + 2.6, z]} text={`${g.width.toFixed(1)} mm`} />

      <Line points={[[-w2 - off, -h2, z], [-w2 - off, h2, z]]} color={col} lineWidth={1} />
      <Line points={[[-w2 - off - tick, -h2, z], [-w2 - off + tick, -h2, z]]} color={col} lineWidth={1} />
      <Line points={[[-w2 - off - tick, h2, z], [-w2 - off + tick, h2, z]]} color={col} lineWidth={1} />
      <Label position={[-w2 - off - 7, 0, z]} text={`${g.height.toFixed(1)} mm`} />

      <Line points={[[w2 + off, -h2 - off, -g.thickness / 2], [w2 + off, -h2 - off, g.thickness / 2]]} color={col} lineWidth={1} />
      <Label position={[w2 + off + 6, -h2 - off, 0]} text={`t ${g.thickness.toFixed(2)}`} />

      {/* centre cross */}
      <Line points={[[-2, 0, z], [2, 0, z]]} color={col} lineWidth={1} transparent opacity={0.6} />
      <Line points={[[0, -2, z], [0, 2, z]]} color={col} lineWidth={1} transparent opacity={0.6} />
    </group>
  );
}
