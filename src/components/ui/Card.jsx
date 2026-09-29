import React from 'react';

const Card = ({ children, className = '', padding = '2rem', hoverEffect = false, style: externalStyle = {}, ...props }) => {
  const style = {
    padding: padding,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    ...externalStyle, // Merge external styles correctly
  };

  return (
    <div 
      className={`glass-panel animate-fade-in ${className}`} 
      style={style} 
      onMouseOver={(e) => {
        if(hoverEffect) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(99,102,241,0.2), var(--glass-shadow)';
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
        }
      }}
      onMouseOut={(e) => {
        if(hoverEffect) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }
      }}
      {...props}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
      {children}
    </div>
  );
};

export default Card;
