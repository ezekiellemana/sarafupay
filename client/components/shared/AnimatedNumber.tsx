"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  format = (nextValue) => String(Math.round(nextValue))
}: {
  value: number;
  format?: (value: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 520;
    const start = performance.now();
    const from = displayValue;
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (value - from) * eased);
      if (progress < 1) requestAnimationFrame(frame);
    };
    const animation = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animation);
    // displayValue is intentionally captured as the animation start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format(displayValue)}</>;
}
