"use client";

import { useEffect, useRef } from "react";

const CUBE_FACES = ["front", "back", "left", "right", "top", "bottom"] as const;

export default function LandingBackground3D() {
  const sceneRef = useRef<HTMLDivElement>(null);

  // Gentle pointer parallax: the scene drifts toward the cursor.
  // Motion answers the visitor's action and stays off when the
  // OS requests reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    function onPointerMove(event: PointerEvent) {
      const scene = sceneRef.current;
      if (!scene || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        scene.style.setProperty("--nb-px", x.toFixed(3));
        scene.style.setProperty("--nb-py", y.toFixed(3));
      });
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="nb-bg3d" aria-hidden="true">
      <div ref={sceneRef} className="nb-bg3d-scene">
        {/* Perspective grid floor */}
        <div className="nb-bg3d-grid" />

        {/* Large rotating wireframe cube */}
        <div className="nb-cube3d nb-cube3d-lg nb-cube3d-blue">
          {CUBE_FACES.map((face) => (
            <span key={face} className={`nb-cube3d-face nb-cube3d-face-${face}`} />
          ))}
        </div>

        {/* Medium blueprint cube for mid-ground depth */}
        <div className="nb-cube3d nb-cube3d-md nb-cube3d-wire nb-cube3d-green">
          {CUBE_FACES.map((face) => (
            <span key={face} className={`nb-cube3d-face nb-cube3d-face-${face}`} />
          ))}
        </div>

        {/* Small rotating cube */}
        <div className="nb-cube3d nb-cube3d-sm nb-cube3d-pink">
          {CUBE_FACES.map((face) => (
            <span key={face} className={`nb-cube3d-face nb-cube3d-face-${face}`} />
          ))}
        </div>

        {/* 3D rings */}
        <div className="nb-ring nb-ring-1" />
        <div className="nb-ring nb-ring-2" />

        {/* Floating accent shapes */}
        <span className="nb-shape nb-shape-1" />
        <span className="nb-shape nb-shape-2" />
        <span className="nb-shape nb-shape-3" />
        <span className="nb-shape nb-shape-4" />
      </div>

      {/* Backdrop blur + tint overlay */}
      <div className="nb-bg3d-blur" />
    </div>
  );
}
