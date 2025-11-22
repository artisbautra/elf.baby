'use client';

import { useEffect, useState } from 'react';

export function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: string; duration: string; delay: string; size: string }>>([]);

  useEffect(() => {
    // Create fixed number of snowflakes to avoid performance issues
    const flakes = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 5 + 10}s`, // 10-15s fall duration
      delay: `${Math.random() * 5}s`,
      size: `${Math.random() * 0.5 + 0.2}rem`,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-20px] text-slate-200/60 animate-snow"
          style={{
            left: flake.left,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
            fontSize: flake.size,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}

