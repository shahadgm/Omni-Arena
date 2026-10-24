import React from 'react';

const Button = ({ children, variant = 'primary', className = '', style = {}, disabled = false, ...props }) => {
  const baseStyle = {
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
  };

  const variants = {
    primary: {
      background: 'var(--primary)',
      color: '#ffffff',
      border: '1px solid transparent',
    },
    secondary: {
      background: 'var(--surface-2)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.12)',
      color: 'var(--danger)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant], ...style }} 
      className={className}
      disabled={disabled}
      onMouseOver={(e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
        if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--border)';
        if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'var(--surface-2)';
      }}
      onMouseOut={(e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary)';
        if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--surface-2)';
        if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
