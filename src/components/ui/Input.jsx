import React, { forwardRef, useId } from 'react';

const Input = forwardRef(({ label, error, id, className = '', style: externalStyle = {}, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || (label ? `input-${generatedId}` : undefined);
  const errorId = error && inputId ? `error-${inputId}` : undefined;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'var(--surface-2)',
    border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
    width: '100%',
    ...externalStyle, // Merged cleanly so base input attributes are preserved
  };

  const errorStyle = {
    fontSize: '0.75rem',
    color: 'var(--error)',
    marginTop: '0.2rem',
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label htmlFor={inputId} style={labelStyle}>{label}</label>}
      <input 
        id={inputId}
        ref={ref}
        style={inputStyle}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--accent-primary)';
            e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
          }
        }}
        {...props} 
      />
      {error && <span id={errorId} style={errorStyle}>{error}</span>}
    </div>
  );
});

export default Input;
