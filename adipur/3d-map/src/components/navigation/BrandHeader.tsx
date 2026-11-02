'use client';

import React from 'react';

export const BrandHeader: React.FC = () => {
  return (
    <div className="fixed top-4 left-4 z-40 flex items-center pointer-events-auto select-none">
      <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight drop-shadow-md">
        3D Plot Layout
      </h1>
    </div>
  );
};
