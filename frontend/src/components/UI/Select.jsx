import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Seleccionar...', className = '', id, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition-colors duration-150
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});
