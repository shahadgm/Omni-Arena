import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    background: 'rgba(10, 10, 15, 0.5)',
    border: `1px solid ${error ? 'var(--error)' : 'rgba(255,255,255,0.08)'}`,
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    width: '100%',
    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)',
  };

  const errorStyle = {
    fontSize: '0.75rem',
    color: 'var(--error)',
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <input 
        ref={ref}
        style={inputStyle}
        onFocus={(e) => {
          if(!error) {
            e.target.style.borderColor = 'var(--accent-primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2), inset 0 2px 5px rgba(0,0,0,0.2)';
          }
        }}
        onBlur={(e) => {
          if(!error) {
            e.target.style.borderColor = 'rgba(255,255,255,0.08)';
            e.target.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,0.2)';
          }
        }}
        {...props} 
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
});

export default Input;
