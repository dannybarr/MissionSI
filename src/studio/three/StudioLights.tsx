import { Environment, Lightformer } from '@react-three/drei';
import type { LightingParams } from '@/studio/studio/types';

/** Fully local studio environments built from area-light formers — no HDR downloads. */
function Formers({ env }: { env: LightingParams['env'] }) {
  switch (env) {
    case 'softbox':
      return (
        <>
          <Lightformer form="rect" intensity={3.2} position={[-4, 2, 4]} rotation-y={Math.PI / 4} scale={[3, 6, 1]} />
          <Lightformer form="rect" intensity={3.2} position={[4, 2, 4]} rotation-y={-Math.PI / 4} scale={[3, 6, 1]} />
          <Lightformer form="rect" intensity={0.8} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
          <Lightformer form="rect" intensity={0.4} color="#e9e4dc" position={[0, -4, 3]} rotation-x={-Math.PI / 3} scale={[10, 3, 1]} />
        </>
      );
    case 'overcast':
      return (
        <>
          <Lightformer form="ring" intensity={1.6} position={[0, 0, 6]} scale={8} />
          <Lightformer form="rect" intensity={1.4} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
          <Lightformer form="rect" intensity={0.9} position={[-6, 0, 0]} rotation-y={Math.PI / 2} scale={[10, 6, 1]} />
          <Lightformer form="rect" intensity={0.9} position={[6, 0, 0]} rotation-y={-Math.PI / 2} scale={[10, 6, 1]} />
        </>
      );
    case 'noir':
      return (
        <>
          <Lightformer form="rect" intensity={6} position={[0, 4, 3]} rotation-x={-Math.PI / 5} scale={[12, 0.6, 1]} />
          <Lightformer form="rect" intensity={0.6} position={[-5, 0, 2]} rotation-y={Math.PI / 2.4} scale={[0.4, 8, 1]} />
        </>
      );
    default:
      // product studio: big overhead softbox tilted toward the face, gentle front fill, rim strips
      return (
        <>
          <Lightformer form="rect" intensity={2.6} position={[0, 4.5, 3.5]} rotation-x={-Math.PI / 3.6} scale={[9, 4, 1]} />
          <Lightformer form="rect" intensity={1.1} color="#f6f4ef" position={[0, -1, 6]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[1.2, 9, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[6, 1, 1]} rotation-y={-Math.PI / 2} scale={[1.2, 9, 1]} />
          <Lightformer form="rect" intensity={0.5} color="#dcdad5" position={[0, -5, 1]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        </>
      );
  }
}

export function StudioLights({ lighting }: { lighting: LightingParams }) {
  const k = lighting.exposure;
  return (
    <>
      <Environment key={lighting.env} resolution={256} frames={1} environmentIntensity={lighting.reflection * k}>
        <color attach="background" args={['#1c1d1f']} />
        <Formers env={lighting.env} />
        {/* rear softbox so the back plate reflects light instead of the dark env void */}
        <Lightformer form="rect" intensity={1.4} color="#f2f0eb" position={[0, 2.5, -5]} rotation-x={Math.PI / 6} scale={[9, 4, 1]} />
      </Environment>
      <ambientLight intensity={0.12 * k} />
      <directionalLight
        position={[1.6, 3.2, 4.5]}
        intensity={lighting.intensity * k}
        castShadow={lighting.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-radius={6}
      />
      <directionalLight position={[-3, -1, 2]} intensity={0.25 * lighting.intensity * k} />
      <directionalLight position={[-1.5, 2.5, -4.5]} intensity={0.6 * lighting.intensity * k} />
    </>
  );
}
