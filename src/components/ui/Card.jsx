import React from 'react';

const Card = ({ children, className = '', padding = '1.75rem', hoverEffect = false, style: externalStyle = {}, ...props }) => {
  const style = {
    padding: padding,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    borderRadius: '12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    ...externalStyle,
  };

  return (
    <div 
      className={`glass-panel animate-fade-in ${className}`} 
      style={style} 
      onMouseOver={(e) => {
        if (hoverEffect) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseOut={(e) => {
        if (hoverEffect) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
