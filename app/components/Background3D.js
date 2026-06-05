"use client";

import dynamic from "next/dynamic";

const Scene3DBackground = dynamic(
  () => import("./Scene3DBackground"),
  { ssr: false }
);

export default function Background3D() {
  return <Scene3DBackground />;
}
