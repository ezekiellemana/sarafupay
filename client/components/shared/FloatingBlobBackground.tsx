"use client";

import { motion } from "framer-motion";

export function FloatingBlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 sarafu-grid opacity-60" />
      <motion.div
        className="absolute -left-24 top-10 size-80 rounded-full bg-[#38BDF8]/28 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-5rem] top-24 size-96 rounded-full bg-[#8B5CF6]/22 blur-3xl"
        animate={{ x: [0, -28, 0], y: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-8rem] left-1/3 size-112 rounded-full bg-[#2563EB]/14 blur-3xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-16 -right-12 size-72 rounded-full bg-[#F59E0B]/10 blur-3xl"
        animate={{ x: [0, -18, 0], y: [0, -12, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
