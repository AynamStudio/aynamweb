"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import { cn } from "@/lib/utils";

/**
 * Interactive monochrome Earth for the closing contact composition.
 * Dark matte globe, soft grey continents, restrained key + rim light,
 * ~50s/rotation, sub-5° pointer drift, ScrollTrigger entrance.
 * Decorative: aria-hidden, pointer-events none, static fallback image
 * when WebGL is unavailable or reduced motion is preferred.
 */

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Globe({ reduced, mobile, pointer }: { reduced: boolean; mobile: boolean; pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/textures/earth-mono.jpg");
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
  const lights = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/textures/earth-lights.jpg");
    /* emission DATA, not albedo: sample raw so mid-tone city glow isn't
       crushed by sRGB→linear decode (0.3 would become 0.07) */
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  }, []);

  // city lights live only on the night hemisphere: mask the emissive
  // layer by the key-light terminator (view space == world space here,
  // the camera sits on +Z with no rotation).
  const patchMaterial = useMemo(
    () => (shader: { fragmentShader: string; vertexShader: string; uniforms: Record<string, THREE.IUniform> }) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         float dayFactor = dot( normalize( vNormal ), vec3( 0.81, 0.36, 0.50 ) );
         float nightMask = 1.0 - smoothstep( -0.28, 0.32, dayFactor );
         totalEmissiveRadiance *= nightMask;`
      );
    },
    []
  );
  const { invalidate } = useThree();

  useEffect(() => {
    if (reduced) invalidate();
  }, [reduced, invalidate]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    if (!reduced) {
      // one full rotation ≈ 50s
      mesh.current.rotation.y += delta * ((Math.PI * 2) / 50);
    }
    // pointer drift, max ≈ 4°, smoothly interpolated
    const tx = pointer.current.y * 0.06;
    const ty = pointer.current.x * 0.07;
    tilt.current.x += (tx - tilt.current.x) * 0.045;
    tilt.current.y += (ty - tilt.current.y) * 0.045;
    mesh.current.rotation.x = tilt.current.x;
    mesh.current.rotation.z = tilt.current.y * 0.5;
    if (reduced) invalidate();
  });

  return (
    <mesh ref={mesh} rotation={[0.12, 2.4, 0]}>
      <sphereGeometry args={[1, mobile ? 40 : 64, mobile ? 40 : 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0.08}
        emissive="#ffffff"
        emissiveMap={lights}
        emissiveIntensity={2.9}
        onBeforeCompile={patchMaterial}
      />
    </mesh>
  );
}

export default function EarthGlobe({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reduced = typeof window !== "undefined" && prefersReducedMotion();
  const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const webgl = typeof window !== "undefined" && webglAvailable();

  useEffect(() => {
    if (reduced || !webgl) return;
    const onMove = (e: MouseEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, webgl]);

  useEffect(() => {
    if (reduced || !webgl || !wrapRef.current) return;
    const { gsap: g } = ensureGsap();
    const el = wrapRef.current;
    const ctx = g.context(() => {
      /* fade-only entrance: the globe keeps one fixed size — no scale on
         enter, no scroll-scrubbed growth/shrink at any scroll position */
      g.fromTo(
        el,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced, webgl]);

  if (!webgl || reduced) {
    return (
      <div aria-hidden="true" className={cn("relative", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/earth-fallback.jpg"
          alt=""
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div aria-hidden="true" ref={wrapRef} className={cn("relative opacity-0", className)}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 3.25], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.42} />
        <directionalLight position={[3.6, 1.6, 2.2]} intensity={1.25} />
        <directionalLight position={[-4, 1, -3.5]} intensity={0.55} color="#cccccc" />
        <Globe reduced={false} mobile={mobile} pointer={pointer} />
      </Canvas>
    </div>
  );
}
