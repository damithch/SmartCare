import React, { forwardRef } from 'react';
export const Input = forwardRef(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-semibold text-slate-700 mb-2 tracking-[0.01em]">
            {label}
          </label>
        }
        <div className="relative">
          {icon &&
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          }
          <input
            ref={ref}
            className={`block w-full min-h-[52px] rounded-2xl border bg-white/95 text-[15px] leading-6 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 transition-all
              ${icon ? 'pl-11 pr-4' : 'px-4'}
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:ring-blue-100'}
              ${className}
            `}
            {...props} />

        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>);

  }
);
Input.displayName = 'Input';
