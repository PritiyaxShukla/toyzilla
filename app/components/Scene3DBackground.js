"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";

/* A single floating toy-like 3D shape that slowly spins. */
function Toy({ position, color, shape, scale, speed }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = t * speed * 0.3;
    ref.current.rotation.y = t * speed * 0.4;
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.6} floatIntensity={1.6}>
      <mesh ref={ref} position={position} scale={scale}>
        {shape === "box" && <boxGeometry args={[1, 1, 1]} />}
        {shape === "ball" && <sphereGeometry args={[0.7, 32, 32]} />}
        {shape === "ring" && <torusGeometry args={[0.55, 0.22, 16, 48]} />}
        {shape === "cone" && <coneGeometry args={[0.6, 1.1, 24]} />}
        {shape === "gem" && <dodecahedronGeometry args={[0.7, 0]} />}
        {shape === "capsule" && <capsuleGeometry args={[0.35, 0.7, 8, 16]} />}
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.35}
        />
      </mesh>
    </Float>
  );
}

const SHAPES = ["box", "ball", "ring", "cone", "gem", "capsule"];
const COLORS = [
  "#a5b4fc", // soft indigo
  "#fca5a5", // soft red
  "#fcd34d", // warm yellow
  "#6ee7b7", // mint
  "#f9a8d4", // pink
  "#93c5fd", // sky
  "#c4b5fd", // lavender
  "#fdba74", // peach
];

function ToyField() {
  // Spread ~16 toys across the viewport at varying depths.
  const toys = useMemo(() => {
    const arr = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 16; i++) {
      arr.push({
        position: [
          (rand() - 0.5) * 16,
          (rand() - 0.5) * 12,
          (rand() - 0.5) * 6 - 3,
        ],
        color: COLORS[Math.floor(rand() * COLORS.length)],
        shape: SHAPES[Math.floor(rand() * SHAPES.length)],
        scale: 0.5 + rand() * 0.7,
        speed: 0.5 + rand() * 0.9,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {toys.map((t, i) => (
        <Toy key={i} {...t} />
      ))}
    </>
  );
}

export default function Scene3DBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "linear-gradient(160deg, #f5f3ff 0%, #fef3f9 40%, #eff6ff 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <pointLight position={[-8, -4, 2]} intensity={0.5} color="#c4b5fd" />
        <pointLight position={[8, 4, 4]} intensity={0.5} color="#fbcfe8" />
        <ToyField />
      </Canvas>
    </div>
  );
}
