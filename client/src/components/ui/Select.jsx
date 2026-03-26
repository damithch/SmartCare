import React, { forwardRef } from 'react';
export const Select = forwardRef(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-semibold text-slate-700 mb-2 tracking-[0.01em]">
            {label}
          </label>
        }
        <select
          ref={ref}
          className={`block w-full min-h-[52px] rounded-2xl border bg-white/95 px-4 pr-10 text-[15px] leading-6 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-blue-500 focus:ring-4 transition-all
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:ring-blue-100'}
            ${className}
          `}
          {...props}>

          <option value="" disabled>
            Select an option
          </option>
          {options.map((opt) =>
          <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>);

  }
);
Select.displayName = 'Select';
