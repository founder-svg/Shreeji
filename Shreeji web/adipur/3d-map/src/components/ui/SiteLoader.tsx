'use client';

import React, { useEffect, useState } from 'react';

interface SiteLoaderProps {
  onComplete?: () => void;
}

export const SiteLoader: React.FC<SiteLoaderProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0d0f12] transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Brand Icon */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-2xl shadow-emerald-500/20 animate-pulse">
          <div className="w-full h-full rounded-full bg-[#12151c] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-2">
          <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-[indeterminate_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
