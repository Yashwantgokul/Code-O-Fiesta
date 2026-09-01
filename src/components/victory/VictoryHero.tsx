'use client';

import React from 'react';

interface VictoryHeroProps {
  teamName: string;
}

export default function VictoryHero({ teamName }: VictoryHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0d0d1a] p-8 md:p-12 text-center shadow-[0_0_50px_rgba(139,92,246,0.15)]">
      {/* Particle background container (CSS-only upward drifting particles) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Ambient radial glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Floating particles */}
        <div className="absolute rounded-full animate-float-particle bg-purple-400 w-2 h-2 left-[10%] bottom-0" style={{ animationDuration: '7s', animationDelay: '0s' }} />
        <div className="absolute rounded-full animate-float-particle bg-cyan-400 w-1.5 h-1.5 left-[25%] bottom-0" style={{ animationDuration: '9s', animationDelay: '2s' }} />
        <div className="absolute rounded-full animate-float-particle bg-pink-400 w-2 h-2 left-[45%] bottom-0" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute rounded-full animate-float-particle bg-purple-300 w-1 h-1 left-[65%] bottom-0" style={{ animationDuration: '8s', animationDelay: '3s' }} />
        <div className="absolute rounded-full animate-float-particle bg-cyan-300 w-2 h-2 left-[80%] bottom-0" style={{ animationDuration: '10s', animationDelay: '0.5s' }} />
        <div className="absolute rounded-full animate-float-particle bg-amber-300 w-1.5 h-1.5 left-[90%] bottom-0" style={{ animationDuration: '7.5s', animationDelay: '2.5s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 max-w-2xl mx-auto">
        {/* Top Tagline */}
        <div className="flex items-center gap-2 text-[13px] font-mono font-bold tracking-[0.3em] text-cyan-400 uppercase">
          <span className="text-cyan-400/70">✦</span>
          <span>CODE-O-FIESTA</span>
          <span className="text-cyan-400/70">✦</span>
        </div>

        {/* Dynamic Team Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] uppercase font-mono">
          CONGRATULATIONS, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300">{teamName || 'CHAMPIONS'}</span>!
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 italic max-w-lg leading-relaxed">
          You have successfully completed all rounds of COF25.
        </p>

        {/* Arena Conquered Badge */}
        <div className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-base sm:text-lg font-bold font-mono shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-bounce">
          <span className="text-xl">🏆</span>
          <span className="tracking-wider uppercase">ARENA CONQUERED</span>
        </div>
      </div>

      {/* Shimmering Bottom Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] shimmer-border" />
    </div>
  );
}
