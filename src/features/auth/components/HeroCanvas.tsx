import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/** 80% soft circle dots + 20% pixel squares — matches auth page particle style. */
function ParticleField({ count = 900, pointer }: { count?: number; pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const roundCount = Math.floor(count * 0.8); // 720 circle dots
  const squareCount = count - roundCount;      // 180 pixel squares

  // Soft circular texture — radial gradient → round shape
  const circleTex = useMemo(() => {
    const sz = 64;
    const canvas = document.createElement("canvas");
    canvas.width = sz;
    canvas.height = sz;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
    g.addColorStop(0,    "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,0.85)");
    g.addColorStop(1,    "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const roundPositions = useMemo(() => {
    const arr = new Float32Array(roundCount * 3);
    for (let i = 0; i < roundCount; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [roundCount]);

  const squarePositions = useMemo(() => {
    const arr = new Float32Array(squareCount * 3);
    for (let i = 0; i < squareCount; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [squareCount]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    // Slow base drift
    groupRef.current.rotation.y += delta * 0.025;
    // Smooth parallax from global pointer — responds everywhere on the page
    const targetX = pointer.current.x * 0.45;
    const targetY = pointer.current.y * 0.3;
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 2.5, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 2.5, delta);
  });

  return (
    <group ref={groupRef}>
      {/* 80% soft circle dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={roundCount} array={roundPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#10b981"
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          map={circleTex}
          alphaTest={0.01}
          toneMapped={false}
        />
      </points>

      {/* 20% pixel squares — pixel-art accent */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={squareCount} array={squarePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.038}
          color="#059669"
          transparent
          opacity={0.32}
          sizeAttenuation
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/** Low-poly wireframe shapes floating around the hero for depth. */
function FloatingShapes() {
  const shapes: { pos: [number, number, number]; geo: string; scale: number }[] = [
    { pos: [-3.6, 1.4, -1], geo: "ico", scale: 0.9 },
    { pos: [3.8, -0.8, -2], geo: "oct", scale: 1.1 },
    { pos: [2.6, 1.8, -1.5], geo: "tet", scale: 0.7 },
    { pos: [-3.2, -1.6, -1.5], geo: "oct", scale: 0.6 },
  ];
  return (
    <>
      {shapes.map((s, i) => (
        <Float
          key={i}
          speed={1.4 + i * 0.2}
          rotationIntensity={0.8}
          floatIntensity={1.2}
        >
          <mesh position={s.pos} scale={s.scale}>
            {s.geo === "ico" && <icosahedronGeometry args={[1, 0]} />}
            {s.geo === "oct" && <octahedronGeometry args={[1, 0]} />}
            {s.geo === "tet" && <tetrahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial
              color="#34d399"
              roughness={0.35}
              metalness={0.1}
              transparent
              opacity={0.16}
              wireframe
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

/** Three.js Canvas with particle field + floating shapes for Landing hero. */
export default function HeroCanvas() {
  // Global window mousemove → smooth parallax across the ENTIRE page, not just canvas bounds
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} />
      <ParticleField pointer={pointer} />
      <FloatingShapes />
    </Canvas>
  );
}
