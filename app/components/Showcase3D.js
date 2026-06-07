"use client";

// Interactive 3D product viewer for the AI-generated RC car (Tripo v3.1 GLB).
// Loaded via next/dynamic with ssr:false so three.js never runs on the server.
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  ContactShadows,
  Center,
  Bounds,
} from "@react-three/drei";

const MODEL_URL = "/generated/rc-car.glb";

function Model() {
  const { scene } = useGLTF(MODEL_URL);
  return <primitive object={scene} />;
}
useGLTF.preload(MODEL_URL);

export default function Showcase3D() {
  return (
    <Canvas
      camera={{ position: [2.6, 1.6, 2.6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Studio lighting with brand-tinted fill */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#5eead4" />
      <directionalLight position={[0, 2, -6]} intensity={0.4} color="#fbbf24" />

      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.25}>
          <Center>
            <Model />
          </Center>
        </Bounds>
        <ContactShadows
          position={[0, -0.55, 0]}
          opacity={0.45}
          scale={8}
          blur={2.4}
          far={4}
        />
      </Suspense>

      <OrbitControls
        autoRotate
        autoRotateSpeed={1.4}
        enablePan={false}
        enableZoom
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}
