import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/db';
import { Keyboard, LogOut, Shield, Sun, Moon, PlusCircle, Trophy, User, Menu, X, Clock } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  const displayName = currentUser?.displayName || currentUser?.username || localStorage.getItem('displayName') || localStorage.getItem('studentId');

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navStyle = {
    padding: '0 1.5rem',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontWeight: '700',
    fontSize: '1.25rem',
  };

  const linkItemStyle = {
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.95rem'
  };

  const mobileLinkItemStyle = {
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    fontSize: '1rem',
  };

  let logoLink = '/';
  if (isAuthenticated) {
    logoLink = isAdmin && location.pathname.startsWith('/admin') ? '/admin/dashboard' : '/dashboard';
  }

  return (
    <>
      <nav style={navStyle}>
        <Link to={logoLink} style={logoStyle}>
          <div style={{ padding: '0.45rem', background: 'var(--accent-primary)', borderRadius: '8px', display: 'flex' }}>
            <Keyboard size={20} color="white" />
          </div>
          <span className="text-gradient">OmniArena</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            style={{
              background: 'none', border: 'none', color: 'var(--text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem', borderRadius: '50%'
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <Trophy size={16} /> Tournaments
              </Link>
              
              <Link to="/tournament/create" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <PlusCircle size={16} /> Host
              </Link>

              <Link to="/history" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <Clock size={16} /> History
              </Link>

              {isAdmin && (
                <Link to="/admin/dashboard" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <Shield size={16} /> Admin
                </Link>
              )}

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                padding: '0.35rem 0.75rem', 
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}>
                <User size={14} color="var(--accent-primary)" />
                <span style={{ fontWeight: '600' }}>{displayName}</span>
                {isAdmin && (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                    ADMIN
                  </span>
                )}
              </div>

              <button 
                onClick={handleLogout}
                style={{
                  background: 'none', border: 'none', color: 'var(--error)', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontWeight: '500', fontSize: '0.95rem', fontFamily: 'inherit'
                }}
                title="Log out of account"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link to="/" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <User size={16} /> Enter Arena
            </Link>
          )}

          {/* Hamburger toggle for small screens */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 99,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                <User size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{displayName}</span>
                {isAdmin && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>ADMIN</span>}
              </div>

              <Link to="/dashboard" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                <Trophy size={18} color="var(--accent-primary)" /> Tournaments
              </Link>
              <Link to="/tournament/create" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                <PlusCircle size={18} color="var(--accent-primary)" /> Host Tournament
              </Link>
              <Link to="/history" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                <Clock size={18} color="var(--accent-primary)" /> My History
              </Link>
              {isAdmin && (
                <Link to="/admin/dashboard" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                  <Shield size={18} color="var(--accent-primary)" /> Admin Console
                </Link>
              )}
              <button 
                onClick={handleLogout}
                style={{
                  ...mobileLinkItemStyle,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <Link to="/" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
              <User size={18} color="var(--accent-primary)" /> Enter Arena
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
