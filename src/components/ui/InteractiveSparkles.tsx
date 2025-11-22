'use client';

import { useEffect, useRef } from 'react';

export function InteractiveSparkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      life: number;
      color: string;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = (x: number, y: number) => {
      const colors = ['#FFF', '#C5A059', '#FFD700']; // White, Gold, Yellow Gold
      particles.push({
        x,
        y,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create multiple particles on movement for a trail effect
      for (let i = 0; i < 2; i++) {
         createParticle(x, y);
      }
    };

    // Also add particles randomly for ambient effect
    const addAmbientParticles = () => {
        if (Math.random() < 0.05) { // Occasional random sparkle
            createParticle(Math.random() * canvas.width, Math.random() * canvas.height);
        }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      addAmbientParticles();

      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.02;
        p.size *= 0.95; // Shrink over time

        if (p.life <= 0) {
          particles.splice(index, 1);
        } else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add a "glow"
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        }
      });
      
      // Reset shadow for next frame performance
      ctx.shadowBlur = 0; 

      animationFrameId = requestAnimationFrame(animate);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-auto z-20 opacity-60 mix-blend-screen"
    />
  );
}

