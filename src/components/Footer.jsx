import React from 'react';
import { Link } from 'react-router-dom';
import { Keyboard, MapPin, Grid, Trophy, MessageSquare, Shield, Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer 
      role="contentinfo"
      style={{
        width: '100%',
        marginTop: 'auto',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '3rem 1.5rem 2rem',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          {/* Brand Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Link 
              to="/" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.65rem', 
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: '800',
                fontSize: '1.25rem'
              }}
              title="Omni Arena — Official Website"
            >
              <div style={{ 
                padding: '0.4rem', 
                background: 'var(--accent-primary)', 
                borderRadius: '8px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center' 
              }}>
                <Keyboard size={18} color="white" />
              </div>
              <span className="text-gradient">Omni Arena</span>
            </Link>
            
            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              The official <strong>Omni Arena</strong> online platform. Free competitive esports and educational arena featuring live speed typing sprints, interactive India and world geography map challenges, crosswords, and spatial logic puzzles.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                Official Web Application
              </span>
            </div>
          </div>

          {/* Arena Disciplines */}
          <div>
            <h4 style={{ 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              letterSpacing: '0.02em'
            }}>
              Arena Disciplines
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>
                <Link 
                  to="/typing" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--disc-typing)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Keyboard size={15} color="var(--disc-typing)" /> Speed Typing Contests
                </Link>
              </li>
              <li>
                <Link 
                  to="/geography" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--disc-map)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <MapPin size={15} color="var(--disc-map)" /> Geography Map Quiz
                </Link>
              </li>
              <li>
                <Link 
                  to="/puzzles" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--disc-puzzle)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Grid size={15} color="var(--disc-puzzle)" /> Crosswords & Sudoku
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--disc-quiz)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Trophy size={15} color="var(--disc-quiz)" /> Knowledge Quiz Arena
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h4 style={{ 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              letterSpacing: '0.02em'
            }}>
              Omni Arena Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>
                <Link 
                  to="/dashboard" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--primary-text)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  Competitions Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/tournament/create" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--primary-text)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  Host a Tournament (PIN Access)
                </Link>
              </li>
              <li>
                <Link 
                  to="/history" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--primary-text)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  My Player History & Best Records
                </Link>
              </li>
              <li>
                <Link 
                  to="/feedback" 
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'color 0.15s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--primary-text)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <MessageSquare size={14} /> Community Feedback & Suggestions
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Tech Stack Column */}
          <div>
            <h4 style={{ 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              letterSpacing: '0.02em'
            }}>
              Trust & Authority
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Shield size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span>Anti-cheat telemetry with tab-switch & clipboard integrity guards.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <a 
                  href="https://github.com/shahadgm/Omni-Arena" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--primary-text)', textDecoration: 'none' }}
                >
                  GitHub Source Repository
                </a>
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Verified Official Domain: <br />
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>https://omni-arena.vercel.app/</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Sitelinks Bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          <div>
            © {new Date().getFullYear()} <strong>Omni Arena</strong> (OmniArena). All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Crafted with</span>
            <Heart size={13} color="var(--danger)" fill="var(--danger)" />
            <span>for global learners and esports athletes</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
