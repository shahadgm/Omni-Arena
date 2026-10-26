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

  const errorStyle = {
    fontSize: '0.75rem',
    color: 'var(--error)',
    marginTop: '0.2rem',
  };

  const inputClasses = `input-ui ${error ? 'has-error' : ''}`.trim();

  return (
    <div style={containerStyle} className={className}>
      {label && <label htmlFor={inputId} style={labelStyle}>{label}</label>}
      <input 
        id={inputId}
        ref={ref}
        className={inputClasses}
        style={externalStyle}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props} 
      />
      {error && <span id={errorId} style={errorStyle}>{error}</span>}
    </div>
  );
});

export default Input;
