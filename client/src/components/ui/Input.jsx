import React, { forwardRef } from 'react';
export const Input = forwardRef(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        }
        <div className="relative">
          {icon &&
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          }
          <input
            ref={ref}
            className={`block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors
              ${icon ? 'pl-10' : 'pl-3'} 
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}
              ${className}
            `}
            {...props} />

        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>);

  }
);
Input.displayName = 'Input';