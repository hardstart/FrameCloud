'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { FrameState } from './useDarkroom';

const FRAME_W = 2.4;
const FRAME_H = 1.6;
const STRIP_W = FRAME_W + 0.6;
const FRAME_SPACING = 2.2;
const SPROCKET_W = 0.15;
const SPROCKET_H = 0.1;
const SPROCKETS_PER_FRAME = 8;

interface FilmStrip3DProps {
  frames: FrameState[];
  activeFrame: number | null;
  scrollOffset: number;
  onDip: (frameId: number) => void;
}

export function FilmStrip3D({ frames, activeFrame, scrollOffset, onDip }: FilmStrip3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frameGroupRefs = useRef<Map<number, THREE.Group>>(new Map());

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return frames.map(f => {
      const tex = loader.load(f.photoUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    });
  }, [frames]);

  // Smooth scroll
  const smoothOffset = useRef(0);
  useFrame(() => {
    smoothOffset.current += (scrollOffset - smoothOffset.current) * 0.08;
    if (groupRef.current) {
      groupRef.current.position.z = smoothOffset.current * FRAME_SPACING;
    }
  });

  // Dip animation
  useEffect(() => {
    if (activeFrame === null) return;
    const ref = frameGroupRefs.current.get(activeFrame);
    if (!ref) return;

    const origY = ref.position.y;
    const origRx = ref.rotation.x;

    const tl = gsap.timeline();
    // Quick dunk down
    tl.to(ref.position, { y: origY - 0.85, duration: 0.25, ease: 'power3.in' })
      .to(ref.rotation, { x: origRx - 0.04, duration: 0.25, ease: 'power2.in' }, '<')
      // Brief hold submerged
      .to(ref.position, { y: origY - 0.9, duration: 0.15, ease: 'sine.inOut' })
      // Lift back out
      .to(ref.position, { y: origY + 0.03, duration: 0.35, ease: 'power2.out' })
      .to(ref.rotation, { x: origRx, duration: 0.3, ease: 'power2.out' }, '<0.05')
      // Tiny settle bounce
      .to(ref.position, { y: origY, duration: 0.15, ease: 'sine.inOut' });

    return () => { tl.kill(); };
  }, [activeFrame]);

  const registerRef = useCallback((id: number, el: THREE.Group | null) => {
    if (el) {
      frameGroupRefs.current.set(id, el);
    } else {
      frameGroupRefs.current.delete(id);
    }
  }, []);

  return (
    <group ref={groupRef}>
      {frames.map((frame, i) => (
        <FilmFrame3D
          key={frame.id}
          frame={frame}
          index={i}
          texture={textures[i]}
          zPos={-i * FRAME_SPACING}
          isActive={activeFrame === frame.id}
          onTap={() => onDip(frame.id)}
          onMount={(el) => registerRef(frame.id, el)}
        />
      ))}
    </group>
  );
}

interface FilmFrame3DProps {
  frame: FrameState;
  index: number;
  texture: THREE.Texture;
  zPos: number;
  isActive: boolean;
  onTap: () => void;
  onMount: (el: THREE.Group | null) => void;
}

function FilmFrame3D({ frame, texture, zPos, isActive, onTap, onMount }: FilmFrame3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Register with parent for dip animation
  useEffect(() => {
    onMount(groupRef.current);
    return () => onMount(null);
  }, [onMount]);

  // Tap handled via DOM overlay in DarkroomViewer
  void onTap; // keep prop for interface compat

  const stripMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1008',
    roughness: 0.7,
    metalness: 0.05,
    side: THREE.DoubleSide,
  }), []);

  const photoMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
  }), [texture]);

  // Smooth transition for negative to positive
  const devTarget = useRef(0);
  const devCurrent = useRef(0);

  useFrame(() => {
    devTarget.current = frame.developed ? 1 : 0;
    devCurrent.current += (devTarget.current - devCurrent.current) * 0.06;
    const d = devCurrent.current;

    photoMat.map = texture;

    // Negative phase: dark red safelight-tinted (undeveloped film)
    // Positive phase: full brightness natural color
    if (d < 0.5) {
      const neg = 1 - d * 2; // 1 when undeveloped, 0 at midpoint
      // Lerp from (0.3, 0.05, 0.02) → (1, 1, 1)
      photoMat.color.setRGB(
        1 - neg * 0.7,
        1 - neg * 0.95,
        1 - neg * 0.98,
      );
    } else {
      photoMat.color.setRGB(1, 1, 1); // fully developed = show texture as-is
    }
    photoMat.needsUpdate = true;
  });

  const sprocketPositions = useMemo(() => {
    const out: [number, number, number][] = [];
    const startY = -FRAME_H / 2 - 0.05;
    const endY = FRAME_H / 2 + 0.05;
    const step = (endY - startY) / (SPROCKETS_PER_FRAME - 1);
    for (let i = 0; i < SPROCKETS_PER_FRAME; i++) {
      const y = startY + step * i;
      out.push([-STRIP_W / 2 + 0.12, y, 0.001]);
      out.push([STRIP_W / 2 - 0.12, y, 0.001]);
    }
    return out;
  }, []);

  return (
    <group
      ref={groupRef}
      position={[0, -0.15, zPos]}
      rotation={[-Math.PI / 2 + 0.08, 0, 0]}
    >
      {/* Film base */}
      <mesh
      >
        <planeGeometry args={[STRIP_W, FRAME_H + 0.5]} />
        <primitive object={stripMat} attach="material" />
      </mesh>

      {/* Photo */}
      <mesh
        position={[0, 0, 0.002]}
      >
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        <primitive object={photoMat} attach="material" />
      </mesh>

      {/* Sprocket holes */}
      {sprocketPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <planeGeometry args={[SPROCKET_W, SPROCKET_H]} />
          <meshBasicMaterial color="#020201" />
        </mesh>
      ))}

      {/* Frame number dot (decorative, was <Text> but troika conflicts with three 0.178) */}
      <mesh position={[-FRAME_W / 2 + 0.12, -FRAME_H / 2 - 0.12, 0.003]}>
        <circleGeometry args={[0.02, 12]} />
        <meshBasicMaterial color="#7a5a30" />
      </mesh>
      <mesh position={[FRAME_W / 2 - 0.12, -FRAME_H / 2 - 0.12, 0.003]}>
        <circleGeometry args={[0.015, 12]} />
        <meshBasicMaterial color="#7a5a30" />
      </mesh>
      {/* Developed indicator */}
      {frame.developed && (
        <mesh position={[0, FRAME_H / 2 + 0.18, 0.003]}>
          <circleGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#c87830" />
        </mesh>
      )}

      {/* Active glow */}
      {isActive && (
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[STRIP_W + 0.1, FRAME_H + 0.6]} />
          <meshBasicMaterial color="#c87830" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}
