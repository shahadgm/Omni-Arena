import React from 'react';

const Button = ({ children, variant = 'primary', className = '', style = {}, disabled = false, ...props }) => {
  const variantClass = `btn-ui-${variant}`;
  const combinedClass = `btn-ui ${variantClass} ${className}`.trim();

  return (
    <button 
      style={style} 
      className={combinedClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
