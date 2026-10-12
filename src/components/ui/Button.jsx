import React from 'react';

const Button = ({ children, variant = 'primary', className = '', style = {}, ...props }) => {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
      color: 'white',
      boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-primary)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--error)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant], ...style }} 
      className={className}
      onMouseOver={(e) => {
        if(variant === 'primary') e.currentTarget.style.transform = 'translateY(-2px)';
        if(variant === 'secondary') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseOut={(e) => {
        if(variant === 'primary') e.currentTarget.style.transform = 'translateY(0)';
        if(variant === 'secondary') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
