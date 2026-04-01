"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useTexture } from "@react-three/drei";
import * as THREE from "three";

// ─── Constants ────────────────────────────────────────────────────────
const IMAGE_ASPECT = 3534 / 2011; // 1.757
const PLANE_WIDTH = 8;
const PLANE_HEIGHT = PLANE_WIDTH / IMAGE_ASPECT;

// Eyepiece center in 3D space (26% from left, 22% from top of image)
const EYEPIECE_X = -PLANE_WIDTH / 2 + 0.26 * PLANE_WIDTH;  // ≈ -1.84
const EYEPIECE_Y = PLANE_HEIGHT / 2 - 0.22 * PLANE_HEIGHT;  // ≈ 1.55

const TUNNEL_DEPTH = 4;

// ─── Camera Body ──────────────────────────────────────────────────────
function CameraBody({
  firstPhotoUrl,
  scrollProgress,
}: {
  firstPhotoUrl?: string;
  scrollProgress: React.MutableRefObject<number>;
}) {
  const texture = useTexture("/assets/camera-hero.png");
  const photoTexture = useTexture(firstPhotoUrl || "/assets/camera-hero.png");
  const focusRingRef = useRef<THREE.Mesh>(null);

  // Scroll-driven focus ring rotation
  useFrame(() => {
    if (focusRingRef.current) {
      const p = scrollProgress.current;
      // Ring rotates 0 → 2.2 rad as we approach the eyepiece
      focusRingRef.current.rotation.z = p * 2.2;
    }
  });

  // Correct texture filtering for sharp rendering
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return (
    <group>
      {/* Camera back — textured plane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.01} />
      </mesh>

      {/* Depth body behind the plane */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[PLANE_WIDTH * 0.92, PLANE_HEIGHT * 0.85, 0.4]} />
        <meshStandardMaterial color="#111111" roughness={0.85} metalness={0.3} />
      </mesh>

      {/* ─── 3D Eyepiece Assembly ─── */}
      <group position={[EYEPIECE_X, EYEPIECE_Y, 0]}>
        {/* Outer eyecup — rubber ring protruding toward viewer */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.18]}>
          <cylinderGeometry args={[0.32, 0.36, 0.2, 32]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.05} />
        </mesh>

        {/* Focus ring — rotates scroll-driven, metallic knurled look */}
        <mesh ref={focusRingRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.28]}>
          <torusGeometry args={[0.30, 0.03, 8, 24]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Inner bevel ring */}
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[0.15, 0.28, 32]} />
          <meshStandardMaterial color="#0f0f0f" roughness={0.7} metalness={0.2} side={THREE.DoubleSide} />
        </mesh>

        {/* Viewfinder glass — fades out as camera approaches */}
        <mesh position={[0, 0, 0.06]} name="viewfinder-glass">
          <circleGeometry args={[0.15, 32]} />
          <meshPhysicalMaterial
            color="#050510"
            transparent
            opacity={0.6}
            roughness={0.1}
            metalness={0.5}
            clearcoat={1}
          />
        </mesh>

        {/* Tunnel tube — the passage the camera flies through */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -TUNNEL_DEPTH / 2]}>
          <cylinderGeometry args={[0.22, 0.15, TUNNEL_DEPTH, 32, 1, true]} />
          <meshStandardMaterial color="#080808" side={THREE.BackSide} roughness={0.95} />
        </mesh>

        {/* Depth rings inside tunnel for parallax */}
        {Array.from({ length: 8 }).map((_, i) => {
          const t = (i + 1) / 9;
          const z = -t * TUNNEL_DEPTH;
          const radius = THREE.MathUtils.lerp(0.22, 0.15, t);
          return (
            <mesh key={i} position={[0, 0, z]}>
              <ringGeometry args={[radius * 0.85, radius, 32]} />
              <meshStandardMaterial
                color={new THREE.Color(0.04 + t * 0.02, 0.04 + t * 0.02, 0.04 + t * 0.02)}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Photo at the end of the tunnel */}
        <mesh position={[0, 0, -TUNNEL_DEPTH + 0.1]}>
          <planeGeometry args={[0.35, 0.22]} />
          <meshBasicMaterial map={photoTexture} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Scroll-Driven Camera Animation ──────────────────────────────────
function CameraController({
  scrollProgress,
  onComplete,
}: {
  scrollProgress: React.MutableRefObject<number>;
  onComplete: () => void;
}) {
  const { camera, scene } = useThree();
  const completedRef = useRef(false);
  const glassRef = useRef<THREE.Mesh | null>(null);

  // Find the glass mesh on first render
  useEffect(() => {
    glassRef.current = scene.getObjectByName("viewfinder-glass") as THREE.Mesh;
  }, [scene]);

  // Camera path
  const startPos = useMemo(() => new THREE.Vector3(0, 0, 12), []);
  const approachPos = useMemo(() => new THREE.Vector3(EYEPIECE_X, EYEPIECE_Y, 2), []);
  const enterPos = useMemo(() => new THREE.Vector3(EYEPIECE_X, EYEPIECE_Y, 0.1), []);
  const insidePos = useMemo(() => new THREE.Vector3(EYEPIECE_X, EYEPIECE_Y, -TUNNEL_DEPTH + 0.5), []);

  const lookTarget = useMemo(() => new THREE.Vector3(EYEPIECE_X, EYEPIECE_Y, -TUNNEL_DEPTH), []);

  // Smoothstep easing
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  useFrame(() => {
    const p = scrollProgress.current;
    const cam = camera as THREE.PerspectiveCamera;

    if (p < 0.35) {
      // Phase 1 (0–0.35): Wide shot → approach eyepiece
      const t = smoothstep(p / 0.35);
      cam.position.lerpVectors(startPos, approachPos, t);

      // Smoothly redirect lookAt from center to eyepiece
      const lookAt = new THREE.Vector3(0, 0, 0).lerp(
        new THREE.Vector3(EYEPIECE_X, EYEPIECE_Y, 0),
        t
      );
      cam.lookAt(lookAt);
      cam.fov = 45 - t * 10; // Narrow slightly
    } else if (p < 0.6) {
      // Phase 2 (0.35–0.6): Enter the eyepiece
      const t = smoothstep((p - 0.35) / 0.25);
      cam.position.lerpVectors(approachPos, enterPos, t);
      cam.lookAt(lookTarget);
      cam.fov = 35;

      // Fade out viewfinder glass
      if (glassRef.current) {
        const mat = glassRef.current.material as THREE.MeshPhysicalMaterial;
        mat.opacity = Math.max(0, 0.6 - t);
      }
    } else {
      // Phase 3 (0.6–1.0): Fly through the tunnel
      const t = smoothstep((p - 0.6) / 0.4);
      cam.position.lerpVectors(enterPos, insidePos, t);
      cam.lookAt(lookTarget);
      cam.fov = 35 + t * 25; // Widen at the end for immersion
    }

    cam.updateProjectionMatrix();

    // Completion
    if (p >= 1 && !completedRef.current) {
      completedRef.current = true;
      setTimeout(onComplete, 200);
    }
  });

  return null;
}

// ─── Main Exported Scene ─────────────────────────────────────────────
interface CameraScene3DProps {
  onZoomComplete: () => void;
  albumTitle: string;
  firstPhotoUrl?: string;
}

export default function CameraScene3D({
  onZoomComplete,
  albumTitle,
  firstPhotoUrl,
}: CameraScene3DProps) {
  const scrollProgress = useRef(0);
  const scrollAccRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      onZoomComplete();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const TOTAL_SCROLL = 1200;

    const handleScroll = (delta: number) => {
      scrollAccRef.current = Math.max(0, scrollAccRef.current + delta);
      scrollProgress.current = Math.min(scrollAccRef.current / TOTAL_SCROLL, 1);

      if (hintRef.current) {
        hintRef.current.style.opacity = scrollProgress.current < 0.03 ? "1" : "0";
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(Math.abs(e.deltaY));
    };

    let touchStartY: number | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchStartY === null) return;
      const deltaY = touchStartY - e.touches[0].clientY;
      if (deltaY > 0) {
        handleScroll(deltaY * 2);
        touchStartY = e.touches[0].clientY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onZoomComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={() => setReady(true)}
        dpr={[1, 2]}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 12]}
          fov={45}
          near={0.01}
          far={100}
        />

        {/* Ambient — low, lets metallic materials speak */}
        <ambientLight intensity={0.3} />
        {/* Key light — warm amber from camera-left */}
        <directionalLight position={[-5, 3, 5]} intensity={0.65} color="#FFB800" />
        {/* Fill light — neutral, subtle */}
        <directionalLight position={[5, -1, 3]} intensity={0.15} />
        {/* Rim light — cool backlight for Nikon Z9 metallic edge highlight */}
        <directionalLight position={[3, 2, -6]} intensity={0.45} color="#8ab4f8" />

        <CameraBody firstPhotoUrl={firstPhotoUrl} scrollProgress={scrollProgress} />
        <CameraController scrollProgress={scrollProgress} onComplete={onZoomComplete} />
      </Canvas>

      {/* Film grain overlay */}
      <div className="film-grain-overlay" aria-hidden="true" />

      {/* EVF scanlines — faint horizontal lines over the 3D scene */}
      <div
        className="absolute inset-0 pointer-events-none evf-scanlines"
        aria-hidden="true"
        style={{ zIndex: 5, opacity: 0.03 }}
      />

      {/* Album title */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <span
          className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--lcd-amber)", textShadow: "0 0 10px rgba(255,184,0,0.3)" }}
        >
          {albumTitle}
        </span>
      </div>

      {/* Scroll hint */}
      <div
        ref={hintRef}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-300"
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
            Scroll to enter viewfinder
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
