import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
  outline: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg border
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
