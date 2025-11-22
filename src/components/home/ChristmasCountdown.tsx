'use client';

import { useEffect, useState } from 'react';

export function ChristmasCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let christmas = new Date(currentYear, 11, 25); // Month is 0-indexed (11 = December)

      // If Christmas has passed this year, countdown to next year's
      if (now.getTime() > christmas.getTime()) {
        christmas = new Date(currentYear + 1, 11, 25);
      }

      const difference = christmas.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center text-white">
      <div className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Time until Christmas</div>
      <div className="flex gap-4 md:gap-8">
        <div className="flex flex-col items-center">
          <span className="font-serif text-4xl md:text-6xl font-bold leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-[10px] md:text-xs uppercase tracking-widest mt-2 text-white/70">Days</span>
        </div>
        <div className="text-2xl md:text-4xl font-serif text-white/60 self-start mt-2">:</div>
        <div className="flex flex-col items-center">
          <span className="font-serif text-4xl md:text-6xl font-bold leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-[10px] md:text-xs uppercase tracking-widest mt-2 text-white/70">Hours</span>
        </div>
        <div className="text-2xl md:text-4xl font-serif text-white/60 self-start mt-2">:</div>
        <div className="flex flex-col items-center">
          <span className="font-serif text-4xl md:text-6xl font-bold leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-[10px] md:text-xs uppercase tracking-widest mt-2 text-white/70">Mins</span>
        </div>
        <div className="hidden md:flex flex-col items-center ml-4 opacity-60">
           <span className="font-serif text-2xl font-bold leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
           <span className="text-[10px] uppercase tracking-widest mt-2">Secs</span>
        </div>
      </div>
    </div>
  );
}

