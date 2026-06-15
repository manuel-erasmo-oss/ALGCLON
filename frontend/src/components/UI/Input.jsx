import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { label, error, helperText, className = '', id, type = 'text', ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition-colors duration-150
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
});
