import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { FrameState } from '../hooks/useDarkroom';

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
    // Quick dunk down — gravity-like
    tl.to(ref.position, { y: origY - 0.85, duration: 0.25, ease: 'power3.in' })
      .to(ref.rotation, { x: origRx - 0.04, duration: 0.25, ease: 'power2.in' }, '<')
      // Brief hold submerged — the "soak"
      .to(ref.position, { y: origY - 0.9, duration: 0.15, ease: 'sine.inOut' })
      // Lift back out — slightly slower, like pulling against liquid resistance
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

function FilmFrame3D({ frame, index, texture, zPos, isActive, onTap, onMount }: FilmFrame3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Register with parent for dip animation
  useEffect(() => {
    onMount(groupRef.current);
    return () => onMount(null);
  }, [onMount]);

  // Distinguish tap from scroll — track pointer movement
  const pointerState = useRef({ downX: 0, downY: 0, moved: false });

  const handlePointerDown = useCallback((e: THREE.Event & { stopPropagation: () => void; clientX?: number; clientY?: number; point: THREE.Vector3 }) => {
    e.stopPropagation();
    pointerState.current.downX = e.point.x;
    pointerState.current.downY = e.point.z;
    pointerState.current.moved = false;
  }, []);

  const handlePointerUp = useCallback((e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    const dx = Math.abs(e.point.x - pointerState.current.downX);
    const dz = Math.abs(e.point.z - pointerState.current.downY);
    // Only count as tap if pointer barely moved
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

  // Smooth transition target for negative→positive
  const devTarget = useRef(0);
  const devCurrent = useRef(0);

  useFrame(() => {
    devTarget.current = frame.developed ? 1 : 0;
    // Smooth lerp — fast enough to see during the dip
    devCurrent.current += (devTarget.current - devCurrent.current) * 0.06;
    const d = devCurrent.current;

    photoMat.map = texture;

    if (d < 0.5) {
      // Negative look: orange-tinted, inverted brightness via dark color multiply
      const neg = 1 - d * 2; // 1→0 over first half
      photoMat.color.setRGB(
        0.75 * neg + (1 - neg),           // orange→white R
        0.45 * neg + (1 - neg),           // orange→white G
        0.15 * neg + (1 - neg) * 0.95,    // orange→white B
      );
      photoMat.roughness = 0.7;
      photoMat.envMapIntensity = 0.1;
    } else {
      // Positive: color brightens to full
      const pos = (d - 0.5) * 2; // 0→1 over second half
      photoMat.color.setRGB(
        0.7 + pos * 0.3,
        0.7 + pos * 0.3,
        0.68 + pos * 0.32,
      );
      photoMat.roughness = 0.5 - pos * 0.25;
      photoMat.envMapIntensity = 0.15 + pos * 0.4;
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
      {/* Film base — the clickable target */}
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
