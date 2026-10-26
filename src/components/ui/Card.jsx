import React from 'react';

const Card = ({ children, className = '', padding = '1.75rem', hoverEffect = false, style: externalStyle = {}, ...props }) => {
  const style = {
    padding,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    borderRadius: '12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    position: 'relative',
    overflow: 'hidden',
    ...externalStyle,
  };

  const combinedClasses = `glass-panel animate-fade-in ${hoverEffect ? 'card-hoverable' : ''} ${className}`.trim();

  return (
    <div 
      className={combinedClasses} 
      style={style} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
