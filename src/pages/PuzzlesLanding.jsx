import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Grid, Sparkles, Trophy, Zap, Brain, CheckSquare, 
  HelpCircle, ChevronRight, Hash, Layers
} from 'lucide-react';
import { authService } from '../services/db';

const PuzzlesLanding = () => {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const startPlaying = (targetPath = '/dashboard') => {
    const isLoggedIn = !!localStorage.getItem('studentId') || authService.isAuthenticated();
    if (isLoggedIn) {
      navigate(targetPath);
    } else {
      setPendingAction(targetPath);
      setShowNameModal(true);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const finalName = guestName.trim() || `Solver-${Math.floor(1000 + Math.random() * 9000)}`;
    authService.setGuestContestant(finalName);
    setShowNameModal(false);
    navigate(pendingAction || '/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: 'var(--disc-puzzle)', fontWeight: '600' }}>Logic &amp; Word Puzzles</span>
      </nav>

      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '24px',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          marginBottom: '1.25rem',
          color: 'var(--disc-puzzle)',
          fontSize: '0.85rem',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Grid size={16} /> Daily Word &amp; Spatial Deduction Arenas
        </div>

        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 'clamp(2rem, 5vw, 3.25rem)', 
          fontWeight: '800', 
          lineHeight: '1.15', 
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          Daily Online <span style={{ color: 'var(--disc-puzzle)' }}>Crosswords, Sudoku &amp; Nonograms</span>
        </h1>

        <p style={{ 
          fontSize: '1.15rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '720px', 
          margin: '0 auto 2rem auto', 
          lineHeight: 1.6 
        }}>
          Challenge your vocabulary, spatial reasoning, and deduction skills with free interactive crossword grids, daily Sudoku, Nonograms (Picross), and Shikaku logic puzzles.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Button 
            variant="primary" 
            onClick={() => startPlaying('/dashboard')}
            style={{ 
              padding: '0.85rem 1.75rem', 
              fontSize: '1.05rem', 
              fontWeight: '700', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: 'var(--disc-puzzle)',
              borderColor: 'var(--disc-puzzle)'
            }}
          >
            Play Daily Puzzles Free <Zap size={18} />
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => {
              const el = document.getElementById('disciplines-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: '600' }}
          >
            Explore Puzzle Types <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* The 3 Logic Disciplines */}
      <section id="disciplines-section" style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            3 Interactive Puzzle Disciplines
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Engineered for pure deductive problem solving, responsive keyboard navigation, and competitive live timing.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.5rem' }}>
          {/* Crossword Card */}
          <Card hoverEffect={true} style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(245, 158, 11, 0.15)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.25rem' 
            }}>
              <Sparkles size={26} color="var(--disc-crossword)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge-disc badge-disc-crossword">Word Grid</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily Clues</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Interactive Crosswords
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
              Solve intersecting letter grids with live across &amp; down clues, arrow key navigation, automatic word transitions, and instantaneous validation upon submission.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => startPlaying('/dashboard')}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              Solve Crossword <ChevronRight size={16} />
            </Button>
          </Card>

          {/* Sudoku Card */}
          <Card hoverEffect={true} style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(99, 102, 241, 0.15)', 
              border: '1px solid rgba(99, 102, 241, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.25rem' 
            }}>
              <Hash size={26} color="var(--primary)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-text)', fontSize: '0.75rem', fontWeight: '700' }}>Number Logic</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>9x9 Grids</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Sudoku Master
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
              Classic 9x9 Japanese number puzzles. Place numbers 1 through 9 into every row, column, and 3x3 quadrant without duplicates. Includes mistake highlighting and time tracking.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => startPlaying('/dashboard')}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              Play Sudoku <ChevronRight size={16} />
            </Button>
          </Card>

          {/* Nonograms & Shikaku Card */}
          <Card hoverEffect={true} style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(244, 63, 94, 0.15)', 
              border: '1px solid rgba(244, 63, 94, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.25rem' 
            }}>
              <Grid size={26} color="var(--disc-puzzle)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge-disc badge-disc-puzzle">Spatial Logic</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Picross &amp; Shikaku</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Nonograms &amp; Shikaku
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
              Deduce hidden pixel pictures using numerical row and column clues, or partition geometric grids into rectangles in Shikaku. Tests pure spatial deduction and reasoning.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => startPlaying('/dashboard')}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              Solve Nonogram <ChevronRight size={16} />
            </Button>
          </Card>
        </div>
      </section>

      {/* Competitive Solving Mechanics */}
      <section style={{ 
        background: 'var(--surface-2)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px', 
        padding: '2.5rem 2rem', 
        marginBottom: '4rem' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '2rem' }}>
            Competitive Tournament Scoring System
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckSquare size={22} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Completion Accuracy</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Earn base points for every correctly placed crossword letter, Sudoku cell, and Nonogram block.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Zap size={22} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Speed Multipliers</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Bonus points awarded for rapid solutions completed well before tournament round timer expiration.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Trophy size={22} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Olympic Podiums</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Instant real-time medal ceremonies awarding Gold, Silver, and Bronze rankings to top solvers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Frequently Asked Questions Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '2rem' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '850px', margin: '0 auto' }}>
          {[
            {
              q: 'Can I play crosswords and Sudoku on mobile phones or tablets?',
              a: 'Yes! OmniArena puzzle boards are 100% responsive and touch-optimized for smartphones, iPads, Android tablets, and desktop computers.'
            },
            {
              q: 'Are these logic puzzles suitable for school competitions and clubs?',
              a: 'Yes, teachers and club organizers use OmniArena to run classroom puzzle bees, Sudoku tournaments, and logic olympiads with automated instant grading.'
            },
            {
              q: 'What is a Nonogram and how do I solve it?',
              a: 'A Nonogram (also known as Picross or Griddlers) is a picture logic puzzle where cells in a grid must be colored or left blank according to numbers given at the side of the grid.'
            },
            {
              q: 'Do I need an account to solve daily puzzles?',
              a: 'No account is required to play. Simply enter as a guest contestant to solve puzzles and submit your completion times.'
            }
          ].map((faq, idx) => (
            <Card key={idx} style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {faq.q}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem', 
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(99, 102, 241, 0.15))',
        border: '1px solid var(--border)',
        borderRadius: '16px'
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          Test Your Brain with Daily Puzzles
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Jump into daily crossword grids, Sudoku challenges, and logic nonograms right in your browser.
        </p>
        <Button 
          variant="primary" 
          onClick={() => startPlaying('/dashboard')}
          style={{ 
            padding: '0.9rem 2rem', 
            fontSize: '1.05rem', 
            fontWeight: '700',
            backgroundColor: 'var(--disc-puzzle)',
            borderColor: 'var(--disc-puzzle)'
          }}
        >
          Play Free Logic Puzzles <Zap size={18} style={{ marginLeft: '0.4rem' }} />
        </Button>
      </div>

      {/* Guest Name Modal if not logged in */}
      {showNameModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Enter Puzzle Arena</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Choose a display name to enter the puzzle competition leaderboard.
            </p>
            <form onSubmit={handleGuestSubmit}>
              <input
                type="text"
                placeholder="e.g. LogicMaster or Robin"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowNameModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--disc-puzzle)', borderColor: 'var(--disc-puzzle)' }}>
                  Start Solving
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "OmniArena Crosswords, Sudoku & Logic Puzzles",
          "url": "https://omni-arena.vercel.app/puzzles",
          "applicationCategory": "GameApplication",
          "operatingSystem": "All modern web browsers",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Daily interactive crossword puzzles with clue highlighting",
            "Sudoku 9x9 logic number grids with conflict detection",
            "Nonogram Picross picture deduction logic games",
            "Shikaku geometric rectangle partition challenges",
            "Timed competitive scoring and live Olympic podiums"
          ]
        })
      }} />
    </div>
  );
};

export default PuzzlesLanding;
