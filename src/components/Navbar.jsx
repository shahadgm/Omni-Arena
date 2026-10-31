import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/db';
import soundEngine from '../utils/soundEffects';
import { Keyboard, LogOut, Shield, Sun, Moon, PlusCircle, Trophy, User, Menu, X, Clock, MessageSquare, Volume2, VolumeX } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted());

  useEffect(() => {
    return soundEngine.subscribe(setIsMuted);
  }, []);
  const isAdmin = authService.isAdmin();
  const isGuest = authService.isGuest();
  const currentUser = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  const rawDisplayName = currentUser?.displayName || localStorage.getItem('displayName') || currentUser?.username || localStorage.getItem('studentId');
  const displayName = rawDisplayName ? rawDisplayName.replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '') : 'Contestant';

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
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
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
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    fontSize: '0.95rem',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
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

          <button 
            onClick={() => soundEngine.toggleMute()}
            style={{
              background: 'none', border: 'none', color: isMuted ? 'var(--text-tertiary)' : 'var(--primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem', borderRadius: '50%',
              transition: 'all 0.15s ease'
            }}
            aria-label={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
            title={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
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

              <Link to="/feedback" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <MessageSquare size={16} /> Feedback
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
                {isAdmin ? (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                    ADMIN
                  </span>
                ) : isGuest ? (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: '700' }}>
                    GUEST
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: '700' }}>
                    HOST
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
                title={isGuest ? "Exit guest session" : "Log out of account"}
              >
                <LogOut size={16} /> {isGuest ? 'Exit' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link to="/feedback" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <MessageSquare size={16} /> Feedback
              </Link>
              <Link to="/" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <User size={16} /> Enter Arena
              </Link>
            </>
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
          top: '64px',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 99,
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                <User size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{displayName}</span>
                {isAdmin ? (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>ADMIN</span>
                ) : isGuest ? (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: '700' }}>GUEST</span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: '700' }}>HOST</span>
                )}
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
              <Link to="/feedback" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare size={18} color="var(--accent-primary)" /> Feedback & Reports
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
                <LogOut size={18} /> {isGuest ? 'Exit Arena' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link to="/" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                <User size={18} color="var(--accent-primary)" /> Enter Arena
              </Link>
              <Link to="/feedback" style={mobileLinkItemStyle} onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare size={18} color="var(--accent-primary)" /> Feedback & Reports
              </Link>
            </>
          )}

          {/* Quick Controls: Theme & Sound (Mobile) */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={toggleTheme}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={() => soundEngine.toggleMute()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: isMuted ? 'var(--text-tertiary)' : 'var(--primary)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isMuted ? 'Sound Off' : 'Sound On'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
