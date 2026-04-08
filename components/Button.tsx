
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const baseStyles = 'font-black uppercase tracking-widest transition-all duration-200 ease-in-out focus:outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
    outline: 'border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white',
    ghost: 'hover:bg-white/5 text-gray-500 hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-[8px] rounded-md',
    md: 'px-3 py-1.5 text-[10px] rounded-lg',
    lg: 'px-5 py-2.5 text-xs rounded-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;