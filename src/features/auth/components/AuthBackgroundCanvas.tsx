import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Edges } from "@react-three/drei";
import * as THREE from "three";

/** Particle Field: 80% soft circle dots + 20% pixel squares (pixel-art nod). Slow drift + pointer parallax. */
function AuthParticleField({
  count = 700,
  pointer,
  reducedMotion,
}: {
  count?: number;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const roundCount = Math.floor(count * 0.8); // 560 circle dots
  const squareCount = count - roundCount;      // 140 pixel squares

  // Soft circular texture — radial gradient fades to transparent at edge → looks round
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
      arr[i * 3]     = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [roundCount]);

  const squarePositions = useMemo(() => {
    const arr = new Float32Array(squareCount * 3);
    for (let i = 0; i < squareCount; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [squareCount]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    // Slow base drift — same speed for both layers so they stay visually cohesive
    groupRef.current.rotation.y += delta * 0.015;

    if (reducedMotion) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, 0, 3, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 3, delta);
    } else {
      const targetX = pointer.current.x * 0.45;
      const targetY = pointer.current.y * 0.3;
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 2, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 2, delta);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 80% — soft circle dots. sizeAttenuation gives natural depth-based size variation */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={roundCount}
            array={roundPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          color="#10b981"
          transparent
          opacity={0.50}
          sizeAttenuation
          depthWrite={false}
          map={circleTex}
          alphaTest={0.01}
          toneMapped={false}
        />
      </points>

      {/* 20% — bare pixel squares, subtler opacity for accent only */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={squareCount}
            array={squarePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#059669"
          transparent
          opacity={0.28}
          sizeAttenuation
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}


/** 1. House3D: Low-poly 3D house mesh with Edges and polygon offset for clean occlusion. */
function House3D({ position, scale, reducedMotion }: { position: [number, number, number]; scale: number; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y += delta * 0.18; // slow self-rotation
  });
  return (
    <Float
      speed={reducedMotion ? 0 : 1.6}
      rotationIntensity={reducedMotion ? 0 : 0.8}
      floatIntensity={reducedMotion ? 0 : 1.2}
    >
      <group ref={groupRef} position={position} scale={scale}>
        {/* Base house box */}
        <mesh position={[0, -0.2, 0]} renderOrder={1}>
          <boxGeometry args={[1.2, 0.9, 1.2]} />
          {/* depthWrite + polygonOffset pushes polygon depth back to prevent Z-fighting with lines */}
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.06}
            depthWrite={true}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
          <Edges threshold={15} color="#059669" opacity={0.45} transparent renderOrder={2} />
        </mesh>

        {/* Roof: 4-segment coneGeometry forms a pyramid roof */}
        <mesh position={[0, 0.45, 0]} rotation={[0, Math.PI / 4, 0]} renderOrder={1}>
          <coneGeometry args={[1.0, 0.6, 4]} />
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.08}
            depthWrite={true}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
          <Edges threshold={15} color="#059669" opacity={0.45} transparent renderOrder={2} />
        </mesh>

        {/* Door: thin box on front face */}
        <mesh position={[0, -0.4, 0.605]} renderOrder={1}>
          <boxGeometry args={[0.3, 0.48, 0.01]} />
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.1}
            depthWrite={true}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
          <Edges threshold={15} color="#10b981" opacity={0.5} transparent renderOrder={2} />
        </mesh>

        {/* Window: thin box on side face */}
        <mesh position={[0.605, 0, 0]} renderOrder={1}>
          <boxGeometry args={[0.01, 0.35, 0.35]} />
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.08}
            depthWrite={true}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
          <Edges threshold={15} color="#10b981" opacity={0.5} transparent renderOrder={2} />
        </mesh>
      </group>
    </Float>
  );
}

/** 2. SwipeMatching3D: Two profile cards showing 3D layout matching. */
function SwipeMatching3D({ position, scale, reducedMotion }: { position: [number, number, number]; scale: number; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y += delta * 0.12; // slower, feels like gentle drift
  });
  return (
    <Float
      speed={reducedMotion ? 0 : 1.4}
      rotationIntensity={reducedMotion ? 0 : 0.8}
      floatIntensity={reducedMotion ? 0 : 1.2}
    >
      <group ref={groupRef} position={position} scale={scale}>
        {/* Card 1 - Front-Left */}
        <group position={[-0.22, 0, 0.1]} rotation={[0.04, -0.15, -0.05]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[0.85, 1.25, 0.04]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.06}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#059669" opacity={0.45} transparent renderOrder={2} />
          </mesh>
          {/* Avatar box */}
          <mesh position={[0, 0.28, 0.021]} renderOrder={1}>
            <boxGeometry args={[0.38, 0.38, 0.01]} />
            <meshBasicMaterial
              color="#059669"
              transparent
              opacity={0.12}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#10b981" opacity={0.55} transparent renderOrder={2} />
          </mesh>
          {/* Text lines */}
          <mesh position={[0, -0.12, 0.021]} renderOrder={1}>
            <boxGeometry args={[0.5, 0.05, 0.01]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, -0.28, 0.021]} renderOrder={1}>
            <boxGeometry args={[0.35, 0.05, 0.01]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
          </mesh>
        </group>

        {/* Card 2 - Behind-Right */}
        <group position={[0.22, -0.12, -0.1]} rotation={[-0.05, 0.12, 0.08]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[0.85, 1.25, 0.04]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.05}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#059669" opacity={0.35} transparent renderOrder={2} />
          </mesh>
          {/* Avatar box */}
          <mesh position={[0, 0.28, 0.021]} renderOrder={1}>
            <boxGeometry args={[0.38, 0.38, 0.01]} />
            <meshBasicMaterial
              color="#059669"
              transparent
              opacity={0.08}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#10b981" opacity={0.4} transparent renderOrder={2} />
          </mesh>
          {/* Text lines */}
          <mesh position={[0, -0.12, 0.021]} renderOrder={1}>
            <boxGeometry args={[0.5, 0.05, 0.01]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, -0.28, 0.021]} renderOrder={1}>
            <boxGeometry args={[0.35, 0.05, 0.01]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/** 3. TradeRoom3D: Two rooms connected with 3D arrows. */
function TradeRoom3D({ position, scale, reducedMotion }: { position: [number, number, number]; scale: number; reducedMotion: boolean }) {
  // Curves end at x = -0.23 and x = 0.23. The houses walls are at -0.38 and 0.38, leaving a clear gap.
  const curve1 = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.23, 0.16, 0.02),
      new THREE.Vector3(0, 0.28, 0.08),
      new THREE.Vector3(0.23, 0.16, 0.02),
    ]);
  }, []);

  const curve2 = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.23, -0.16, 0.02),
      new THREE.Vector3(0, -0.28, 0.08),
      new THREE.Vector3(-0.23, -0.16, 0.02),
    ]);
  }, []);

  return (
    <Float
      speed={reducedMotion ? 0 : 1.8}
      rotationIntensity={reducedMotion ? 0 : 0.8}
      floatIntensity={reducedMotion ? 0 : 1.2}
    >
      <group position={position} scale={scale}>
        {/* Left Small Room */}
        <group position={[-0.65, 0, -0.1]} scale={0.6}>
          <mesh renderOrder={1}>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.06}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#059669" opacity={0.4} transparent renderOrder={2} />
          </mesh>
          <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI / 4, 0]} renderOrder={1}>
            <coneGeometry args={[0.75, 0.45, 4]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.08}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#059669" opacity={0.4} transparent renderOrder={2} />
          </mesh>
          {/* Door */}
          <mesh position={[0, -0.22, 0.451]} renderOrder={1}>
            <boxGeometry args={[0.25, 0.35, 0.01]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.1}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#10b981" opacity={0.5} transparent renderOrder={2} />
          </mesh>
        </group>

        {/* Right Small Room */}
        <group position={[0.65, 0, 0.1]} scale={0.6}>
          <mesh renderOrder={1}>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.06}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#059669" opacity={0.4} transparent renderOrder={2} />
          </mesh>
          <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI / 4, 0]} renderOrder={1}>
            <coneGeometry args={[0.75, 0.45, 4]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.08}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#059669" opacity={0.4} transparent renderOrder={2} />
          </mesh>
          {/* Door */}
          <mesh position={[0, -0.22, 0.451]} renderOrder={1}>
            <boxGeometry args={[0.25, 0.35, 0.01]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.1}
              depthWrite={true}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
            <Edges threshold={15} color="#10b981" opacity={0.5} transparent renderOrder={2} />
          </mesh>
        </group>

        {/* Tube arrows */}
        <mesh renderOrder={3}>
          <tubeGeometry args={[curve1, 16, 0.015, 6, false]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
        </mesh>
        <mesh renderOrder={3}>
          <tubeGeometry args={[curve2, 16, 0.015, 6, false]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
        </mesh>

        {/* Cone arrow heads */}
        <mesh position={[0.24, 0.15, 0.02]} rotation={[0, 0, -Math.PI / 2.3]} scale={0.75} renderOrder={3}>
          <coneGeometry args={[0.045, 0.12, 4]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.55} />
        </mesh>
        <mesh position={[-0.24, -0.15, 0.02]} rotation={[0, 0, Math.PI / 2.3]} scale={0.75} renderOrder={3}>
          <coneGeometry args={[0.045, 0.12, 4]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.55} />
        </mesh>
      </group>
    </Float>
  );
}

/** Group container to group models together and apply unified parallax rotation & damping. */
function SceneModels({
  pointer,
  reducedMotion,
  showFullModels,
  showTabletModels,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
  showFullModels: boolean;
  showTabletModels: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // X tilt (0.32) hides bottom face. Y rotation REMOVED: when ry≠0, local x ≠ world x,
    // making models drift unpredictably behind the card regardless of local position values.
    const targetRotX = 0.32;
    const targetRotY = 0.0; // must be 0 for predictable screen positioning

    if (reducedMotion) {
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 3, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 3, delta);
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, 0, 3, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 3, delta);
    } else {
      // Parallax: translation-only, small range so models never drift behind card
      const targetPosX = pointer.current.x * 0.06;
      const targetPosY = pointer.current.y * 0.05;

      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 2.2, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 2.2, delta);
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetPosX, 2.2, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPosY, 2.2, delta);
    }
  });

  if (!showTabletModels && !showFullModels) return null;

  return (
    <group ref={groupRef}>
      {showFullModels ? (
        <>
          {/* With ry=0: local x == world x. Card edges ≈ ±3.0 world units. Left margin center = -4.5, right = +4.0 */}
          <House3D position={[-4.5, 1.3, -1.0]} scale={0.78} reducedMotion={reducedMotion} />
          <SwipeMatching3D position={[4.0, 0.2, -1.0]} scale={0.80} reducedMotion={reducedMotion} />
          <TradeRoom3D position={[-4.5, -1.9, -1.0]} scale={0.78} reducedMotion={reducedMotion} />
        </>
      ) : (
        <>
          <House3D position={[-3.2, 1.0, -0.8]} scale={0.6} reducedMotion={reducedMotion} />
          <SwipeMatching3D position={[3.2, -0.8, -0.8]} scale={0.65} reducedMotion={reducedMotion} />
        </>
      )}
    </group>
  );
}

/** Full-screen Three.js Background. Passes pointer coordinate refs and handles layout states. */
export default function AuthBackgroundCanvas() {
  const pointer = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    // 1. Listen for mouse coordinate moves
    const handlePointerMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // 2. Track screen width resize
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // 3. Accessibility query for reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", handleResize);
    motionQuery.addEventListener("change", motionListener);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener("change", motionListener);
    };
  }, []);

  // Responsive variables
  const isMobile = width <= 700;
  const isTablet = width > 700 && width < 1024;
  const isDesktop = width >= 1024;

  const particleCount = isMobile ? 250 : isTablet ? 500 : 900;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 3]} intensity={0.9} />
        <AuthParticleField
          count={particleCount}
          pointer={pointer}
          reducedMotion={reducedMotion}
        />
        <SceneModels
          pointer={pointer}
          reducedMotion={reducedMotion}
          showFullModels={isDesktop}
          showTabletModels={isTablet}
        />
      </Canvas>
    </div>
  );
}
