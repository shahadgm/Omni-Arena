import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/db';
import { Keyboard, LogOut, Shield, Sun, Moon } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = authService.isAdmin();
  const studentId = localStorage.getItem('studentId');

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  const navStyle = {
    padding: '1rem 2rem',
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
    gap: '1.5rem',
  };

  const linkItemStyle = {
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  let logoLink = '/';
  if (isAdmin) {
    logoLink = '/admin/dashboard';
  } else if (studentId) {
    logoLink = '/dashboard';
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
        {isAdmin ? (
          <>
            <Link to="/admin/dashboard" style={linkItemStyle}>Dashboard</Link>
            <Link to="/admin/tournament/create" style={linkItemStyle}>Create Tournament</Link>
            <button 
              onClick={handleLogout}
              style={{
                background: 'none', border: 'none', color: 'var(--error)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: '500', fontSize: '1rem', fontFamily: 'inherit'
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            {studentId ? (
              <>
                <Link to="/history" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <Keyboard size={18} /> History
                </Link>
                <button 
                  onClick={() => { localStorage.removeItem('studentId'); navigate('/'); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--error)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontWeight: '500', fontSize: '1rem', fontFamily: 'inherit'
                  }}
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login" style={linkItemStyle} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <Shield size={18} /> Admin
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
