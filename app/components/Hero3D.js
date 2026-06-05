"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";

function Box({ position, color, scale = 1, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * speed * 0.4;
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
  });
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
      </mesh>
    </Float>
  );
}

function Ball({ position, color, scale = 1, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
  });
  return (
    <Float speed={speed * 1.2} rotationIntensity={0.2} floatIntensity={2}>
      <mesh ref={ref} position={position} scale={scale}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.6} />
      </mesh>
    </Float>
  );
}

function Ring({ position, color, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * speed * 0.6;
    ref.current.rotation.z = state.clock.elapsedTime * speed * 0.3;
  });
  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        <torusGeometry args={[0.5, 0.2, 16, 60]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
      </mesh>
    </Float>
  );
}

function Cone({ position, color, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
  });
  return (
    <Float speed={speed * 0.8} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={position}>
        <coneGeometry args={[0.5, 1, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <section className="relative rounded-2xl overflow-hidden mb-8" style={{ height: 360 }}>
      {/* Text on top of canvas */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center pointer-events-none px-4">
        <h1 className="text-4xl font-extrabold drop-shadow-lg tracking-tight">
          Welcome to Toyzilla 🦖
        </h1>
        <p className="mt-3 text-lg text-indigo-100 drop-shadow">
          The happiest toys, delivered to your door.
        </p>
      </div>

      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-10, -5, -5]} intensity={0.6} color="#a78bfa" />
        <pointLight position={[0, -10, 5]} intensity={0.4} color="#f0abfc" />

        <Stars radius={60} depth={30} count={400} factor={3} fade speed={0.8} />

        {/* Cubes — building blocks */}
        <Box position={[-3.8, 1.2, 0]} color="#f59e0b" scale={0.75} speed={0.8} />
        <Box position={[3.6, -1.2, -1]} color="#ef4444" scale={0.6} speed={1.1} />
        <Box position={[2.8, 1.8, -2]} color="#10b981" scale={0.5} speed={0.9} />
        <Box position={[-2.2, -1.8, -1]} color="#f97316" scale={0.55} speed={1.2} />

        {/* Balls */}
        <Ball position={[-2.8, 0.2, 0.5]} color="#3b82f6" scale={1.1} speed={0.7} />
        <Ball position={[1.8, 0.8, -0.5]} color="#f43f5e" scale={0.85} speed={1.0} />
        <Ball position={[0.5, -1.5, 0.5]} color="#06b6d4" scale={0.65} speed={1.3} />

        {/* Rings */}
        <Ring position={[0.2, 1.6, -1]} color="#a78bfa" speed={0.9} />
        <Ring position={[-1.2, -0.5, -2]} color="#34d399" speed={0.7} />

        {/* Cones */}
        <Cone position={[3.0, 0.5, 0.5]} color="#fbbf24" speed={1.0} />
        <Cone position={[-0.8, 1.2, -0.5]} color="#e879f9" speed={0.8} />
      </Canvas>
    </section>
  );
}
