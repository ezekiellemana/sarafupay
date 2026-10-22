"use client";

import { useEffect, useRef } from "react";

/**
 * A field of gold "sarafu" coins drifting down through warm light, turning as they fall.
 * The camera leans toward the pointer (or device tilt) so the scene has real depth.
 *
 * Cost control: three.js loads only in the browser, the loop pauses when the hero is off
 * screen or the tab is hidden, pixel ratio is capped, phones get fewer coins, and people
 * who ask for reduced motion get a single still frame.
 */
export function CoinField({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = window.matchMedia("(max-width: 640px)").matches;
      const COUNT = small ? 22 : 46;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 14);

      // Warm studio light: sky/ground fill, a key light, and a gold rim from behind.
      scene.add(new THREE.HemisphereLight(0xfff4dc, 0x0e3b2c, 1.4));
      const key = new THREE.DirectionalLight(0xfff1cf, 2.6);
      key.position.set(5, 8, 10);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xf2a516, 2.2);
      rim.position.set(-6, -3, -6);
      scene.add(rim);

      // Coin face: an embossed "S" with a milled ring, drawn once to a canvas.
      const face = document.createElement("canvas");
      face.width = face.height = 256;
      const g = face.getContext("2d")!;
      const grad = g.createRadialGradient(100, 90, 20, 128, 128, 140);
      grad.addColorStop(0, "#ffe7a3");
      grad.addColorStop(0.55, "#e2a83a");
      grad.addColorStop(1, "#9a6a12");
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "rgba(90,55,5,0.55)";
      g.lineWidth = 10;
      g.beginPath();
      g.arc(128, 128, 104, 0, Math.PI * 2);
      g.stroke();
      g.font = "700 150px Georgia, serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "rgba(255,248,220,0.9)";
      g.fillText("S", 124, 136);
      g.fillStyle = "rgba(110,70,8,0.85)";
      g.fillText("S", 128, 140);
      const faceTex = new THREE.CanvasTexture(face);
      faceTex.colorSpace = THREE.SRGBColorSpace;
      faceTex.anisotropy = 4;

      const edge = new THREE.MeshStandardMaterial({ color: 0xd59a24, metalness: 0.85, roughness: 0.32 });
      const cap = new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.7, roughness: 0.35 });
      const geo = new THREE.CylinderGeometry(1, 1, 0.16, 48, 1);

      type Coin = { mesh: InstanceType<typeof THREE.Mesh>; vy: number; spin: number; wobble: number; phase: number };
      const coins: Coin[] = [];
      const spread = { x: 13, y: 9, z: 7 };
      for (let i = 0; i < COUNT; i++) {
        const mesh = new THREE.Mesh(geo, [edge, cap, cap]);
        const s = 0.35 + Math.random() * 0.55;
        mesh.scale.setScalar(s);
        mesh.position.set((Math.random() - 0.5) * spread.x, (Math.random() - 0.5) * spread.y * 2, -Math.random() * spread.z);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(mesh);
        coins.push({ mesh, vy: 0.006 + Math.random() * 0.012, spin: 0.004 + Math.random() * 0.018, wobble: 0.3 + Math.random() * 0.6, phase: Math.random() * 10 });
      }

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // Pointer / device tilt → target camera offset, eased each frame.
      const target = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      const onTilt = (e: DeviceOrientationEvent) => {
        if (e.gamma == null || e.beta == null) return;
        target.x = Math.max(-1, Math.min(1, e.gamma / 30));
        target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("deviceorientation", onTilt, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
      io.observe(el);

      let raf = 0;
      let t = 0;
      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;
        t += 1;
        camera.position.x += (target.x * 1.6 - camera.position.x) * 0.04;
        camera.position.y += (-target.y * 1.1 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, -2);
        for (const c of coins) {
          c.mesh.position.y -= c.vy;
          c.mesh.position.x += Math.sin((t + c.phase * 60) * 0.008) * 0.003 * c.wobble;
          c.mesh.rotation.x += c.spin;
          c.mesh.rotation.z += c.spin * 0.6;
          if (c.mesh.position.y < -spread.y) {
            c.mesh.position.y = spread.y;
            c.mesh.position.x = (Math.random() - 0.5) * spread.x;
          }
        }
        renderer.render(scene, camera);
      };
      if (reduce) renderer.render(scene, camera);
      else frame();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("deviceorientation", onTilt);
        geo.dispose();
        edge.dispose();
        cap.dispose();
        faceTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      /* No WebGL: the page still works without the coins. */
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className={`pointer-events-none ${className}`} aria-hidden />;
}
