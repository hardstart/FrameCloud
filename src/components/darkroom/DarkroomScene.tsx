'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { FilmStrip3D } from './FilmStrip3D';
import type { FrameState } from './useDarkroom';

interface DarkroomSceneProps {
  frames: FrameState[];
  activeFrame: number | null;
  scrollOffset: number;
  onDip: (frameId: number) => void;
}

export function DarkroomScene({ frames, activeFrame, scrollOffset, onDip }: DarkroomSceneProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{
          position: [0, 4.5, 3.2],
          fov: 36,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.65,
        }}
        style={{ background: '#060302' }}
        shadows
      >
        <Suspense fallback={null}>
          <CameraRig dipActive={activeFrame !== null} />
          <Lighting />
          <Tub />
          <Liquid dipActive={activeFrame !== null} />

          <FilmStrip3D
            frames={frames}
            activeFrame={activeFrame}
            scrollOffset={scrollOffset}
            onDip={onDip}
          />

          <Particles />
          <Tabletop />
        </Suspense>
      </Canvas>
    </div>
  );
}

function CameraRig({ dipActive }: { dipActive: boolean }) {
  const { camera } = useThree();
  const t = useRef(0);
  const shakeEnergy = useRef(0);
  const wasDipping = useRef(false);

  useFrame((_, delta) => {
    t.current += delta * 0.25;

    // Trigger shake on dip start
    if (dipActive && !wasDipping.current) {
      shakeEnergy.current = 1.0;
    }
    wasDipping.current = dipActive;
    shakeEnergy.current *= 0.94;

    const shake = shakeEnergy.current;
    const shakeX = shake * (Math.sin(t.current * 45) * 0.012 + Math.sin(t.current * 67) * 0.006);
    const shakeY = shake * (Math.cos(t.current * 53) * 0.008);

    camera.position.x = Math.sin(t.current * 0.6) * 0.06 + shakeX;
    camera.position.y = 4.5 + Math.sin(t.current * 0.4) * 0.025 + shakeY;
    camera.lookAt(0, -0.6, -0.3);
  });

  return null;
}

function Lighting() {
  const safelightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (safelightRef.current) {
      const t = performance.now() * 0.001;
      safelightRef.current.intensity = 3.5 + Math.sin(t * 0.8) * 0.4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.05} color="#1a0a04" />

      {/* Red safelight */}
      <pointLight
        ref={safelightRef}
        position={[3, 5.5, -2]}
        intensity={3.5}
        color="#ff1a00"
        distance={15}
        decay={1.5}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      {/* Warm fill */}
      <pointLight
        position={[0, 1, 4]}
        intensity={0.4}
        color="#c87830"
        distance={8}
        decay={2}
      />

      {/* Cool rim */}
      <pointLight
        position={[-2, 3, -5]}
        intensity={0.12}
        color="#334466"
        distance={10}
        decay={2}
      />

      {/* Subtle down light for film frames */}
      <spotLight
        position={[0, 4, 0]}
        angle={0.5}
        penumbra={0.8}
        intensity={0.8}
        color="#ffeedd"
        distance={10}
        target-position={[0, -1, 0]}
        castShadow={false}
      />
    </>
  );
}

function Tub() {
  const W = 3.6;
  const L = 5.4;
  const H = 2.0;
  const WALL = 0.12;
  const FLOOR_Y = -1.6;

  return (
    <group position={[0, FLOOR_Y, 0]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} raycast={() => {}}>
        <planeGeometry args={[W, L]} />
        <MeshReflectorMaterial
          mirror={0.12}
          resolution={256}
          mixBlur={8}
          mixStrength={0.4}
          color="#080604"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Inner walls */}
      {[
        { pos: [-W / 2 + WALL / 2, H / 2, 0] as const, size: [WALL, H, L] as const },
        { pos: [W / 2 - WALL / 2, H / 2, 0] as const, size: [WALL, H, L] as const },
        { pos: [0, H / 2, -L / 2 + WALL / 2] as const, size: [W, H, WALL] as const },
        { pos: [0, H / 2, L / 2 - WALL / 2] as const, size: [W, H, WALL] as const },
      ].map(({ pos, size }, i) => (
        <mesh key={`inner-${i}`} position={[pos[0], pos[1], pos[2]]}>
          <boxGeometry args={[size[0], size[1], size[2]]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.15} metalness={0.05} envMapIntensity={0.3} />
        </mesh>
      ))}

      {/* Outer walls */}
      {[
        { pos: [-W / 2 - WALL / 2, H / 2, 0] as const, size: [WALL, H + 0.04, L + WALL * 2] as const },
        { pos: [W / 2 + WALL / 2, H / 2, 0] as const, size: [WALL, H + 0.04, L + WALL * 2] as const },
        { pos: [0, H / 2, -L / 2 - WALL / 2] as const, size: [W + WALL * 4, H + 0.04, WALL] as const },
        { pos: [0, H / 2, L / 2 + WALL / 2] as const, size: [W + WALL * 4, H + 0.04, WALL] as const },
      ].map(({ pos, size }, i) => (
        <mesh key={`outer-${i}`} position={[pos[0], pos[1], pos[2]]}>
          <boxGeometry args={[size[0], size[1], size[2]]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}

      {/* Rim */}
      {[
        [-W / 2, H + 0.04, 0, 0.22, 0.08, L + 0.22],
        [W / 2, H + 0.04, 0, 0.22, 0.08, L + 0.22],
        [0, H + 0.04, -L / 2, W + 0.44, 0.08, 0.22],
        [0, H + 0.04, L / 2, W + 0.44, 0.08, 0.22],
      ].map(([x, y, z, w, h, l], i) => (
        <mesh key={`rim-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, l]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.6} envMapIntensity={0.5} />
        </mesh>
      ))}

      {/* Tongs */}
      <Tongs position={[W / 2 + 0.15, H + 0.05, 1.0]} />
    </group>
  );
}

function Tongs({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0.1, -0.4, -0.2]}>
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.012, 0.45, 4, 8]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[0.04, 0.12, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.012, 0.45, 4, 8]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[0.02, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 12]} />
        <meshStandardMaterial color="#666" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[-0.008, -0.16, 0]}>
        <boxGeometry args={[0.025, 0.18, 0.008]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0.048, -0.16, 0]}>
        <boxGeometry args={[0.025, 0.18, 0.008]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}

function Liquid({ dipActive }: { dipActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const dipStartTime = useRef(0);
  const wasDipping = useRef(false);
  const settleEnergy = useRef(0);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    const t = performance.now() * 0.001;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position;

    if (dipActive && !wasDipping.current) {
      dipStartTime.current = t;
      wasDipping.current = true;
      settleEnergy.current = 1.0;
    } else if (!dipActive && wasDipping.current) {
      wasDipping.current = false;
    }

    // Decay settle energy after dip ends
    if (!dipActive) {
      settleEnergy.current *= 0.97;
    }

    const dipElapsed = t - dipStartTime.current;
    const isRecentDip = dipActive || settleEnergy.current > 0.01;

    // Animate liquid surface with vertex displacement
    if (isRecentDip) {
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);

        // Radial distance from center (where frame dips)
        const dist = Math.sqrt(x * x + y * y);

        let displacement = 0;

        if (dipActive) {
          // Impact phase: concentric waves radiating from center
          const impactPhase = Math.min(dipElapsed * 2, 1);
          const waveSpeed = 3.0;
          const wave = Math.sin(dist * 4 - dipElapsed * waveSpeed * 6) * 0.015;
          const falloff = Math.exp(-dist * 0.6) * impactPhase;
          displacement = wave * falloff;

          // Central depression from the film strip entering
          const centralDip = Math.exp(-dist * 1.2) * 0.02 * impactPhase;
          displacement -= centralDip;
        } else {
          // Settling: damped oscillation
          const energy = settleEnergy.current;
          const wave = Math.sin(dist * 3 - t * 4) * 0.008 * energy;
          const falloff = Math.exp(-dist * 0.4);
          displacement = wave * falloff;
        }

        posAttr.setZ(i, displacement);
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // Material responds to disturbance
    const disturbance = dipActive ? 0.4 : settleEnergy.current * 0.3;
    mat.roughness = 0.06 + Math.sin(t * 0.6) * 0.015 + disturbance * 0.08;
    mat.clearcoatRoughness = 0.04 + disturbance * 0.06;

    // Gentle sway
    if (dipActive) {
      meshRef.current.position.y = -0.5 + Math.sin(t * 4) * 0.008 + Math.sin(t * 7) * 0.004;
    } else {
      meshRef.current.position.y += (-0.5 - meshRef.current.position.y) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} raycast={() => {}}>
      <planeGeometry args={[3.36, 5.16, 128, 128]} />
      <meshPhysicalMaterial
        color="#1a0e04"
        roughness={0.06}
        metalness={0.05}
        transmission={0.18}
        thickness={2.5}
        ior={1.33}
        clearcoat={1}
        clearcoatRoughness={0.04}
        envMapIntensity={0.9}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const count = 80;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 1] = -0.6 - Math.random() * 1.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    velocities[i] = 0.001 + Math.random() * 0.003;
  }

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    const t = performance.now() * 0.001;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * 0.5 + i * 2) * 0.0004;
      arr[i * 3 + 1] += velocities[i];
      arr[i * 3 + 2] += Math.cos(t * 0.3 + i) * 0.0003;

      if (arr[i * 3 + 1] > -0.55) {
        arr[i * 3 + 1] = -1.55;
        arr[i * 3] = (Math.random() - 0.5) * 3;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 5;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#c89860" transparent opacity={0.2} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Tabletop() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]} raycast={() => {}}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#0a0704" roughness={0.85} metalness={0.02} />
    </mesh>
  );
}
