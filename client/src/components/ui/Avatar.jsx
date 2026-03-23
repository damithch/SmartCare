import React from 'react';

export const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl'
  };
  const safeName = typeof name === 'string' && name.trim() ? name.trim() : 'User';
  const initials = safeName.
  split(' ').
  map((n) => n[0]).
  join('').
  substring(0, 2).
  toUpperCase();
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold overflow-hidden shrink-0 ${sizes[size]} ${className}`}>

      {src ?
      <img
        src={src}
        alt={alt || safeName}
        className="h-full w-full object-cover" /> :


      <span>{initials}</span>
      }
    </div>);

};
