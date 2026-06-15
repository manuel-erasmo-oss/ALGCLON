import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', overlay = false }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <Loader2
      className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-indigo-600`}
    />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {spinner}
    </div>
  );
}
