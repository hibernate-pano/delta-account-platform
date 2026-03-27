import React, { useMemo } from 'react';

const PARTICLE_COUNT = 20;
// Pre-generate particle configs with stable pseudo-random values (no SSR/client mismatch)
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const seed = (i + 1) * 9301 + 49297;
  const rand = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n;
  return {
    size: rand(4) + 2,
    x: rand(100),
    y: rand(100),
    delay: rand(8),
    duration: rand(6) + 6,
    opacity: rand(0.3) + 0.1,
    color: ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981'][i % 4],
  };
});

const AuthBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Base radial glows */}
    <div
      className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
      style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
    />
    <div
      className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
      style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)' }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
      style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)' }}
    />

    {/* Animated mesh orbs */}
    <div
      className="absolute top-[15%] left-[20%] w-72 h-72 rounded-full opacity-20 blur-3xl"
      style={{
        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
        animation: 'float1 8s ease-in-out infinite',
      }}
    />
    <div
      className="absolute bottom-[20%] right-[15%] w-64 h-64 rounded-full opacity-15 blur-3xl"
      style={{
        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        animation: 'float2 10s ease-in-out infinite',
        animationDelay: '-3s',
      }}
    />
    <div
      className="absolute top-[60%] left-[60%] w-48 h-48 rounded-full opacity-10 blur-3xl"
      style={{
        background: 'linear-gradient(135deg, #06b6d4, #10b981)',
        animation: 'float3 7s ease-in-out infinite',
        animationDelay: '-5s',
      }}
    />

    {/* Floating particles — deterministic, no hydration mismatch */}
    {PARTICLES.map((p, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${p.size}px`,
          height: `${p.size}px`,
          left: `${p.x}%`,
          top: `${p.y}%`,
          background: p.color,
          opacity: p.opacity,
          animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }}
      />
    ))}

    {/* Grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    />

    <style>{`
      @keyframes float1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -20px) scale(1.05); }
        66% { transform: translate(-20px, 30px) scale(0.95); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        40% { transform: translate(-40px, 20px) scale(1.08); }
        70% { transform: translate(20px, -30px) scale(0.92); }
      }
      @keyframes float3 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(20px, -20px) scale(1.1); }
      }
      @keyframes particle-float {
        0%, 100% { transform: translateY(0px); opacity: var(--op, 0.15); }
        50% { transform: translateY(-30px); opacity: calc(var(--op, 0.15) * 1.5); }
      }
    `}</style>
  </div>
);

export default AuthBackground;
