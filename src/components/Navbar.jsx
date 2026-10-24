import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/db';
import { Keyboard, LogOut, Shield, Sun, Moon, PlusCircle, Trophy, User } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  const displayName = currentUser?.displayName || currentUser?.username || localStorage.getItem('studentId');

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const navStyle = {
    padding: '0.9rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--glass-border)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
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

  const linksStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
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

  let logoLink = '/';
  if (isAuthenticated) {
    logoLink = isAdmin && location.pathname.startsWith('/admin') ? '/admin/dashboard' : '/dashboard';
  }

  return (
    <nav style={navStyle}>
      <Link to={logoLink} style={logoStyle}>
        <div style={{ padding: '0.5rem', background: 'var(--accent-primary)', borderRadius: '8px', display: 'flex' }}>
          <Keyboard size={20} color="white" />
        </div>
        <span className="text-gradient">OmniArena</span>
      </Link>
      
      <div style={linksStyle}>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'none', border: 'none', color: 'var(--text-primary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem', borderRadius: '50%'
          }}
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
              <Keyboard size={16} /> History
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
          <>
            <Link to="/" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <User size={16} /> Log In / Register
            </Link>
            <Link to="/admin/login" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <Shield size={16} /> Admin Portal
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
