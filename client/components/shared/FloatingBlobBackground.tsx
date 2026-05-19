"use client";

import { motion } from "framer-motion";

export function FloatingBlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 sarafu-grid opacity-40" />
      {/* Emerald blob — top left */}
      <motion.div
        className="absolute -left-24 top-10 size-80 rounded-full blur-3xl"
        style={{ background: "rgba(25,162,84,0.18)" }}
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Dark green blob — top right */}
      <motion.div
        className="absolute -right-20 top-24 size-96 rounded-full blur-3xl"
        style={{ background: "rgba(3,80,52,0.22)" }}
        animate={{ x: [0, -28, 0], y: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Emerald blob — bottom center */}
      <motion.div
        className="absolute -bottom-32 left-1/3 size-112 rounded-full blur-3xl"
        style={{ background: "rgba(25,162,84,0.12)" }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Gold accent blob — bottom right */}
      <motion.div
        className="absolute -bottom-16 -right-12 size-72 rounded-full blur-3xl"
        style={{ background: "rgba(196,162,55,0.08)" }}
        animate={{ x: [0, -18, 0], y: [0, -12, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
