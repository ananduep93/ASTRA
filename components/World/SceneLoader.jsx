"use client";

// Loads the 3D world in the browser only (WebGL does not exist on the server).
import dynamic from "next/dynamic";

const World = dynamic(() => import("./World"), { ssr: false });

export default function SceneLoader() {
  return <World />;
}
