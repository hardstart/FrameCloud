'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
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

  // Dip animation — cinematic feel with liquid resistance
  useEffect(() => {
    if (activeFrame === null) return;
    const ref = frameGroupRefs.current.get(activeFrame);
    if (!ref) return;

    const origY = ref.position.y;
    const origRx = ref.rotation.x;
    const origRz = ref.rotation.z;

    const tl = gsap.timeline();

    // Anticipation lift — slight upward pull before the dip
    tl.to(ref.position, { y: origY + 0.06, duration: 0.12, ease: 'power2.out' })
      .to(ref.rotation, { x: origRx + 0.015, duration: 0.12, ease: 'power2.out' }, '<')

      // Gravity drop into liquid — accelerating fall
      .to(ref.position, { y: origY - 0.75, duration: 0.3, ease: 'power2.in' })
      .to(ref.rotation, { x: origRx - 0.06, z: origRz + 0.012, duration: 0.3, ease: 'power2.in' }, '<')

      // Liquid resistance — decelerate as it hits the surface
      .to(ref.position, { y: origY - 0.92, duration: 0.25, ease: 'power1.out' })
      .to(ref.rotation, { x: origRx - 0.08, duration: 0.25, ease: 'sine.out' }, '<')

      // Submerged soak — gentle drift at the bottom
      .to(ref.position, { y: origY - 0.88, duration: 0.35, ease: 'sine.inOut' })
      .to(ref.rotation, { z: origRz - 0.008, duration: 0.35, ease: 'sine.inOut' }, '<')

      // Slow lift — pulling against liquid surface tension
      .to(ref.position, { y: origY - 0.4, duration: 0.4, ease: 'power1.inOut' })
      .to(ref.rotation, { x: origRx - 0.02, z: origRz, duration: 0.4, ease: 'sine.inOut' }, '<')

      // Break free from surface — slight acceleration
      .to(ref.position, { y: origY + 0.05, duration: 0.25, ease: 'power2.out' })
      .to(ref.rotation, { x: origRx + 0.008, duration: 0.25, ease: 'power2.out' }, '<')

      // Settle with dampened bounce
      .to(ref.position, { y: origY - 0.015, duration: 0.18, ease: 'sine.inOut' })
      .to(ref.rotation, { x: origRx - 0.003, duration: 0.18, ease: 'sine.inOut' }, '<')

      // Final rest
      .to(ref.position, { y: origY, duration: 0.15, ease: 'sine.out' })
      .to(ref.rotation, { x: origRx, duration: 0.15, ease: 'sine.out' }, '<');

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

function FilmFrame3D({ frame, index, texture, zPos, isActive, onTap, onMount }: FilmFrame3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Register with parent for dip animation
  useEffect(() => {
    onMount(groupRef.current);
    return () => onMount(null);
  }, [onMount]);

  // Distinguish tap from scroll
  const pointerState = useRef({ downX: 0, downY: 0, moved: false });

  const handlePointerDown = useCallback((e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    pointerState.current.downX = e.point.x;
    pointerState.current.downY = e.point.z;
    pointerState.current.moved = false;
  }, []);

  const handlePointerUp = useCallback((e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    const dx = Math.abs(e.point.x - pointerState.current.downX);
    const dz = Math.abs(e.point.z - pointerState.current.downY);
    if (dx < 0.3 && dz < 0.3) {
      onTap();
    }
  }, [onTap]);

  const stripMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1008',
    roughness: 0.7,
    metalness: 0.05,
    side: THREE.DoubleSide,
  }), []);

  const photoMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.2,
  }), [texture]);

  // Organic negative-to-positive chemical development transition
  const devTarget = useRef(0);
  const devCurrent = useRef(0);

  useFrame(() => {
    devTarget.current = frame.developed ? 1 : 0;
    // Slower lerp for organic chemical development feel
    const speed = devCurrent.current < devTarget.current ? 0.035 : 0.06;
    devCurrent.current += (devTarget.current - devCurrent.current) * speed;
    const d = devCurrent.current;

    photoMat.map = texture;

    // Smoothstep for more natural transition curve
    const smooth = d * d * (3 - 2 * d);

    if (smooth < 0.4) {
      // Deep negative: heavy orange cast, dark, grainy look
      const neg = 1 - smooth * 2.5;
      photoMat.color.setRGB(
        0.7 * neg + (1 - neg) * 0.85,
        0.35 * neg + (1 - neg) * 0.75,
        0.1 * neg + (1 - neg) * 0.6,
      );
      photoMat.roughness = 0.75 - smooth * 0.3;
      photoMat.envMapIntensity = 0.05 + smooth * 0.15;
    } else if (smooth < 0.7) {
      // Mid-development: colors emerging, still slightly warm
      const mid = (smooth - 0.4) / 0.3;
      photoMat.color.setRGB(
        0.65 + mid * 0.2,
        0.6 + mid * 0.25,
        0.5 + mid * 0.3,
      );
      photoMat.roughness = 0.6 - mid * 0.2;
      photoMat.envMapIntensity = 0.2 + mid * 0.2;
    } else {
      // Full development: bright, clear, slight wet sheen
      const pos = (smooth - 0.7) / 0.3;
      photoMat.color.setRGB(
        0.85 + pos * 0.15,
        0.85 + pos * 0.15,
        0.8 + pos * 0.2,
      );
      photoMat.roughness = 0.4 - pos * 0.18;
      photoMat.envMapIntensity = 0.4 + pos * 0.2;
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
        onPointerDown={handlePointerDown as any}
        onPointerUp={handlePointerUp as any}
      >
        <planeGeometry args={[STRIP_W, FRAME_H + 0.5]} />
        <primitive object={stripMat} attach="material" />
      </mesh>

      {/* Photo */}
      <mesh
        position={[0, 0, 0.002]}
        onPointerDown={handlePointerDown as any}
        onPointerUp={handlePointerUp as any}
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

      {/* Frame number */}
      <Text
        position={[-FRAME_W / 2 + 0.15, -FRAME_H / 2 - 0.18, 0.003]}
        fontSize={0.06}
        color="#7a5a30"
        anchorX="left"
        anchorY="middle"
      >
        {`\u2192 ${index + 1}${index % 2 === 0 ? '' : 'A'}`}
      </Text>
      <Text
        position={[FRAME_W / 2 - 0.15, -FRAME_H / 2 - 0.18, 0.003]}
        fontSize={0.05}
        color="#7a5a30"
        anchorX="right"
        anchorY="middle"
      >
        KODAK 5219
      </Text>

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
