import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService } from '../services/db';
import { Play, Trophy, Clock, Keyboard, Grid, Square, HelpCircle, Lock } from 'lucide-react';

const StudentDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }

    // Ensure we are not in fullscreen on the dashboard
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}

    const fetchTournaments = async () => {
      const data = await dbService.getTournaments();
      // Filter active tournaments
      const now = new Date();
      const active = data.filter(t => new Date(t.startTime) <= now && new Date(t.endTime) >= now);
      setTournaments(active);
      setLoading(false);
    };

    fetchTournaments();
  }, [navigate, studentId]);

  const practiceModes = {
    typing: [
      { id: 'practice-english', name: 'English Sprint', desc: 'Standard English typing test.' },
      { id: 'practice-arabic', name: 'Arabic Focus', desc: 'Standard Arabic typing test.' },
      { id: 'practice-urdu', name: 'Urdu Focus', desc: 'Standard Urdu typing test.' },
      { id: 'practice-bilingual', name: 'Bilingual Challenge', desc: 'English followed by Arabic.' },
      { id: 'practice-trilingual', name: 'Trilingual Master', desc: 'English, Arabic, and Urdu.' }
    ],
    quiz: [
      { id: 'practice-quiz-gk', name: 'General Knowledge', desc: 'Test your everyday knowledge.' },
      { id: 'practice-quiz-tech', name: 'Tech & Science', desc: 'Questions about programming and space.' }
    ],
    nonogram: [
      { id: 'practice-nonogram-5x5', name: '5x5 Easy', desc: 'A simple 5x5 Nonogram grid.' },
      { id: 'practice-nonogram-10x10', name: '10x10 Medium', desc: 'A challenging 10x10 Nonogram.' },
      { id: 'practice-nonogram-15x15', name: '15x15 Hard', desc: 'A massive 15x15 Nonogram.' }
    ],
    shikaku: [
      { id: 'practice-shikaku-5x5', name: '5x5 Beginner', desc: 'A small Shikaku puzzle to get started.' },
      { id: 'practice-shikaku-7x7', name: '7x7 Intermediate', desc: 'A standard size Shikaku puzzle.' },
      { id: 'practice-shikaku-10x10', name: '10x10 Expert', desc: 'A massive Shikaku puzzle for pros.' }
    ]
  };

  const handleJoin = async (t) => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed", err);
    }

    if (typeof t === 'string') {
      navigate(`/arena/${t}`);
      return;
    }

    if (t.isPrivate) {
      const code = window.prompt("This tournament is private. Enter the access code:");
      if (code !== t.accessCode) {
        alert("Incorrect access code!");
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch (e) {}
        return;
      }
    }
    navigate(`/arena/${t.id}`);
  };

  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    { id: 'typing', name: 'Practice Typing', icon: <Keyboard size={36} /> },
    { id: 'nonogram', name: 'Practice Nonogram', icon: <Grid size={36} /> },
    { id: 'shikaku', name: 'Practice Shikaku', icon: <Square size={36} /> },
    { id: 'quiz', name: 'Practice Quizzes', icon: <HelpCircle size={36} /> },
  ];

  return (
    <div className="container" style={{ width: '100%', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome, {studentId}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Select a competition or practice mode to begin.</p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy className="text-gradient" /> Live Tournaments
      </h2>
      
      {loading ? (
        <p>Loading tournaments...</p>
      ) : tournaments.length === 0 ? (
        <Card style={{ marginBottom: '3rem', textAlign: 'center', padding: '3rem' }}>
          <Clock size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No live tournaments at the moment.</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Try one of the practice modes below.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {tournaments.map(t => (
            <Card key={t.id} hoverEffect={true}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {t.name}
                  {t.isPrivate && <Lock size={16} color="var(--text-tertiary)" title="Private Tournament" />}
                </h3>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '4px' }}>
                  LIVE
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Game: {t.gameType === 'logic-puzzle' ? 'Logic Puzzles' : (t.gameType || 'typing').charAt(0).toUpperCase() + (t.gameType || 'typing').slice(1)} {t.gameType === 'typing' || !t.gameType ? `(${t.type})` : ''}
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <Button onClick={() => handleJoin(t)} style={{ flex: 1 }}>
                  Join <Play size={16} />
                </Button>
                <Button variant="secondary" onClick={() => navigate(`/leaderboard/${t.id}`)}>
                  Leaderboard
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Keyboard className="text-gradient" /> Practice Hub
      </h2>
      
      {!activeCategory ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {categories.map(c => (
            <Card key={c.id} hoverEffect={true} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveCategory(c.id)}>
              <div style={{ margin: '0 auto 1rem', display: 'flex', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                {c.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{c.name}</h3>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setActiveCategory(null)}>
              ← Back to Categories
            </Button>
          </div>
          
          {activeCategory && practiceModes[activeCategory] && practiceModes[activeCategory].length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {practiceModes[activeCategory].map(m => (
                <Card key={m.id} hoverEffect={true}>
                  <h3 style={{ fontSize: '1.25rem' }}>{m.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{m.desc}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => handleJoin(m.id)} style={{ flex: 1 }}>
                      Practice <Play size={16} />
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/leaderboard/${m.id}`)}>
                      Leaderboard
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
             <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{categories.find(c => c.id === activeCategory)?.name}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>This practice mode is currently in development!</p>
             </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
