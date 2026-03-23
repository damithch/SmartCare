import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 as LoaderIcon } from 'lucide-react';

export const Button = forwardRef(
  (
  {
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading,
    fullWidth,
    children,
    disabled,
    ...props
  },
  ref) =>
  {
    const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500',
      outline:
      'border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900 focus:ring-slate-500',
      ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
    };
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg'
    };
    const widthClass = fullWidth ? 'w-full' : '';
    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;
    return (
      <motion.button
        ref={ref}
        whileTap={
        disabled || isLoading ?
        {} :
        {
          scale: 0.98
        }
        }
        className={classes}
        disabled={disabled || isLoading}
        {...props}>

        {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>);

  }
);
Button.displayName = 'Button';
