import React from 'react';
import { cn } from '@/lib/utils';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <a href="/" className={cn("block", className)}>
      <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
            <feGaussianBlur stdDeviation="1.5" in="SourceAlpha" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#neon-glow)">
          <text x="10" y="30" className="font-black text-3xl fill-primary neon-text stroke-0">D</text>
          <text x="40" y="30" className="font-black text-3xl fill-accent neon-text stroke-0">C</text>
          <text x="70" y="30" className="font-black text-3xl fill-primary neon-text stroke-0">D</text>
        </g>
      </svg>
    </a>
  );
};