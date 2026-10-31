import React, { useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { X, AlertCircle } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = '500px',
  showCloseButton = true,
  icon = null,
  className = ''
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        className={`glass-panel ${className}`}
        style={{
          maxWidth,
          width: '100%',
          padding: '2rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          background: 'var(--surface)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.4rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <X size={18} />
          </button>
        )}

        {(title || icon) && (
          <div style={{ marginBottom: description ? '0.5rem' : '1.25rem', textAlign: 'center' }}>
            {icon && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px var(--primary-glow)'
                }}
              >
                {icon}
              </div>
            )}
            {title && (
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0,
                  fontFamily: 'var(--font-display)'
                }}
              >
                {title}
              </h2>
            )}
          </div>
        )}

        {description && (
          <p
            style={{
              fontSize: '0.925rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: '1.5rem',
              lineHeight: 1.55
            }}
          >
            {description}
          </p>
        )}

        {children}
      </Card>
    </div>
  );
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary", // 'primary' | 'danger' | 'warning'
  icon = null,
  loading = false,
  maxWidth = '460px'
}) => {
  const getVariantStyles = () => {
    if (variant === 'danger') {
      return {
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconBorder: 'rgba(239, 68, 68, 0.3)',
        iconColor: 'var(--danger)',
        buttonVariant: 'danger',
        buttonClass: 'btn-ui-danger'
      };
    }
    if (variant === 'warning') {
      return {
        iconBg: 'rgba(245, 158, 11, 0.12)',
        iconBorder: 'rgba(245, 158, 11, 0.3)',
        iconColor: 'var(--warning)',
        buttonVariant: 'primary',
        buttonClass: 'btn-ui-primary'
      };
    }
    return {
      iconBg: 'var(--primary-glow)',
      iconBorder: 'var(--primary)',
      iconColor: 'var(--primary)',
      buttonVariant: 'primary',
      buttonClass: 'btn-ui-primary'
    };
  };

  const vStyles = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      showCloseButton={!loading}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: vStyles.iconBg,
            border: `1px solid ${vStyles.iconBorder}`,
            color: vStyles.iconColor,
            marginBottom: '1.25rem'
          }}
        >
          {icon || <AlertCircle size={28} />}
        </div>

        <h3
          style={{
            fontSize: '1.35rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '0.65rem'
          }}
        >
          {title}
        </h3>

        {message && (
          <p
            style={{
              fontSize: '0.925rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: '1.75rem'
            }}
          >
            {message}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: cancelText ? 'stretch' : 'center' }}>
          {cancelText && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              style={{ flex: 1, padding: '0.75rem 1rem' }}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={vStyles.buttonVariant}
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: cancelText ? 1 : '0 1 200px', padding: '0.75rem 1rem', fontWeight: 'bold' }}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const AlertModal = ({
  isOpen,
  onClose,
  title = "Notice",
  message,
  buttonText = "Understood",
  variant = "primary",
  icon = null
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onClose}
    title={title}
    message={message}
    confirmText={buttonText}
    cancelText={null}
    variant={variant}
    icon={icon}
  />
);

export default Modal;
