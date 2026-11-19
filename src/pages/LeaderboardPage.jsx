import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import { dbService, authService } from '../services/db';
import { 
  Trophy, ArrowLeft, RotateCcw, Search, Award, Eye, EyeOff, Lock, Crown,
  ChevronDown, ChevronUp, Users, Calendar, Keyboard, MapPin, Grid, HelpCircle, Sparkles, Filter
} from 'lucide-react';

const LeaderboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [gameType, setGameType] = useState('typing');
  const [expandedId, setExpandedId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [retakeInput, setRetakeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'manage'
  
  // Directory state when no id is passed
  const [availableTournaments, setAvailableTournaments] = useState([]);
  const [dirCategoryFilter, setDirCategoryFilter] = useState('all');

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [confirmAction, setConfirmAction] = useState(null);

  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();
  const isGuest = authService.isGuest();
  const myStudentId = (currentUser?.username || localStorage.getItem('studentId') || '').toLowerCase();
  const isRegisteredCreator = !isGuest && currentUser?.username && typeof tournament?.createdBy === 'string' && !tournament.createdBy.startsWith('guest:') && tournament.createdBy.toLowerCase() === currentUser.username.toLowerCase();
  const isManager = isAdmin || isRegisteredCreator;
  
  // Dynamic hidden state: Only hidden from candidates if hideLeaderboard is true AND user is NOT a manager/host
  const isHidden = !!tournament?.hideLeaderboard && !isManager;

  const practiceModes = [
    { id: 'practice-english', name: 'English Speed Typing', format: 'Typing', icon: <Keyboard size={20} color="var(--disc-typing)" /> },
    { id: 'practice-arabic', name: 'Arabic Typing', format: 'Typing', icon: <Keyboard size={20} color="var(--disc-typing)" /> },
    { id: 'practice-urdu', name: 'Urdu Nastaliq Typing', format: 'Typing', icon: <Keyboard size={20} color="var(--disc-typing)" /> },
    { id: 'practice-quiz-gk', name: 'General Knowledge Quiz', format: 'Quiz', icon: <HelpCircle size={20} color="var(--disc-quiz)" /> },
    { id: 'practice-map', name: 'World Geography Map', format: 'Map', icon: <MapPin size={20} color="var(--disc-map)" /> },
    { id: 'practice-crossword', name: 'Crossword Challenge', format: 'Crossword', icon: <Sparkles size={20} color="var(--disc-crossword)" /> },
    { id: 'practice-nonogram-5x5', name: 'Nonogram (5x5)', format: 'Logic', icon: <Grid size={20} color="var(--disc-puzzle)" /> },
    { id: 'practice-shikaku-5x5', name: 'Shikaku (5x5)', format: 'Logic', icon: <Grid size={20} color="var(--disc-puzzle)" /> },
    { id: 'practice-sudoku-easy', name: 'Sudoku (Easy)', format: 'Logic', icon: <Grid size={20} color="var(--disc-puzzle)" /> }
  ];

  const handleToggleHideLeaderboard = () => {
    if (!tournament || !isManager) return;
    const newHide = !tournament.hideLeaderboard;
    setConfirmAction({
      title: newHide ? "Hide Leaderboard?" : "Make Leaderboard Public?",
      message: newHide 
        ? "Hide leaderboard from candidates? Candidates will see 'Leaderboard is Hidden' until results are published."
        : "Make leaderboard public to all candidates now?",
      confirmText: newHide ? "Hide Leaderboard" : "Make Public",
      variant: newHide ? "warning" : "primary",
      onConfirm: async () => {
        try {
          await dbService.updateTournament(id, { hideLeaderboard: newHide });
          setTournament(prev => ({ ...prev, hideLeaderboard: newHide }));
        } catch (err) {
          console.error("Error updating leaderboard visibility:", err);
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  const handleToggleShowQuizAnswers = () => {
    if (!tournament || !isManager) return;
    const newShow = !tournament.showQuizAnswers;
    setConfirmAction({
      title: newShow ? "Reveal Answers to Contestants?" : "Hide Answers from Contestants?",
      message: newShow 
        ? "Reveal correct quiz answers to contestants? Contestants will be able to see the full answer key upon submitting and on the leaderboard."
        : "Hide correct quiz answers from contestants? Contestants will only see their points, with answer keys hidden.",
      confirmText: newShow ? "Reveal Answers" : "Hide Answers",
      variant: newShow ? "warning" : "primary",
      onConfirm: async () => {
        try {
          await dbService.updateTournament(id, { showQuizAnswers: newShow });
          setTournament(prev => ({ ...prev, showQuizAnswers: newShow }));
        } catch (err) {
          console.error("Error updating quiz answer visibility:", err);
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  const handleAllowRetake = (targetStudentId) => {
    let resolvedId = targetStudentId;
    const match = leaderboard.find(e => 
      e.studentId.toLowerCase() === targetStudentId.toLowerCase() ||
      e.studentId.toLowerCase() === `guest:${targetStudentId.toLowerCase()}` ||
      (e.displayName && e.displayName.toLowerCase() === targetStudentId.toLowerCase())
    );
    if (match) {
      resolvedId = match.studentId;
    }

    const plainTarget = resolvedId.replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '');
    setConfirmAction({
      title: "Allow Retake?",
      message: `Are you sure you want to give "${plainTarget}" another chance? Their attempt lock will be cleared.`,
      confirmText: "Allow Retake",
      variant: "warning",
      icon: <RotateCcw size={26} />,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await dbService.allowStudentRetake(id, resolvedId);
          setLeaderboard(prev => prev.filter(e => e.studentId !== resolvedId));
        } catch (err) {
          console.error("Error resetting attempt:", err);
        } finally {
          setActionLoading(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleManualRetake = async (e) => {
    e.preventDefault();
    const targetId = retakeInput.trim();
    if (!targetId) return;
    await handleAllowRetake(targetId);
    setRetakeInput('');
  };

  useEffect(() => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}

    const fetchLeaderboard = async () => {
      setLoading(true);

      // Directory mode: When accessing /leaderboard with no :id
      if (!id) {
        try {
          const tournamentsList = await dbService.getTournaments();
          setAvailableTournaments(tournamentsList);
          setTitle('Standings & Leaderboards');
        } catch (err) {
          console.error('Error fetching tournaments list for leaderboard directory:', err);
        } finally {
          setLoading(false);
        }
        return;
      }

      const data = await dbService.getLeaderboard(id);
      setLeaderboard(data);
      
      if (id.startsWith('practice-')) {
        const type = id.replace('practice-', '');
        setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Practice Mode`);
        if (id.startsWith('practice-quiz')) setGameType('quiz');
        else if (id.startsWith('practice-nonogram')) setGameType('nonogram');
        else if (id.startsWith('practice-shikaku')) setGameType('shikaku');
        else if (id.startsWith('practice-sudoku')) setGameType('sudoku');
        else if (id.startsWith('practice-map')) setGameType('map');
        else if (id.startsWith('practice-crossword')) setGameType('crossword');
        else setGameType('typing');
      } else {
        const t = await dbService.getTournament(id);
        if (t) {
          setTournament(t);
          setTitle(t.name);
          setGameType(t.gameType || 'typing');
        } else {
          setNotFound(true);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    };
    
    fetchLeaderboard();
  }, [id, isAdmin]);

  const isPuzzle = gameType === 'nonogram' || gameType === 'shikaku' || gameType === 'sudoku' || gameType === 'logic-puzzle';
  const isCrossword = gameType === 'crossword';
  const isQuiz = gameType === 'quiz';
  const isMap = gameType === 'map';

  const handleGrantMarks = async (entryId, questionIndex) => {
    if (!isManager) return;
    
    const entry = leaderboard.find(e => e.id === entryId);
    if (!entry || !entry.quizDetails) return;
    
    const qDetails = [...entry.quizDetails];
    const targetQ = qDetails[questionIndex];
    if (targetQ.isCorrect) return;
    
    setConfirmAction({
      title: "Grant Marks?",
      message: "Are you sure you want to manually award full marks for this question?",
      confirmText: "Grant Marks",
      variant: "primary",
      onConfirm: async () => {
        targetQ.isCorrect = true;
        targetQ.pointsAwarded = targetQ.maxPoints;
        
        const newCorrectAnswers = qDetails.filter(q => q.isCorrect).length;
        const newScore = qDetails.reduce((sum, q) => sum + (q.pointsAwarded || 0), 0);
        const totalQuestions = entry.totalQuestions || qDetails.length;
        const newAccuracy = Math.round((newCorrectAnswers / totalQuestions) * 100);
        
        const updatedFields = {
          quizDetails: qDetails,
          correctAnswers: newCorrectAnswers,
          score: newScore,
          accuracy: newAccuracy
        };
        
        try {
          await dbService.updateResult(entryId, updatedFields);
          setLeaderboard(prev => {
            const newBoard = prev.map(e => e.id === entryId ? { ...e, ...updatedFields } : e);
            return newBoard.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
              if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
              return 0;
            });
          });
        } catch (error) {
          console.error('Error updating marks:', error);
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  // Filtered and Paginated Leaderboard
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase().trim();
    return leaderboard.filter(e => 
      (e.displayName && e.displayName.toLowerCase().includes(q)) ||
      (e.studentId && e.studentId.toLowerCase().includes(q))
    );
  }, [leaderboard, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const myRankIndex = useMemo(() => {
    if (!myStudentId) return -1;
    return leaderboard.findIndex(e => e.studentId.toLowerCase() === myStudentId);
  }, [leaderboard, myStudentId]);

  const top3 = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const gridCols = isMap
    ? (isManager ? '60px 1fr 110px 90px 90px 110px' : '60px 1fr 120px 100px 90px')
    : (isQuiz || isCrossword || isPuzzle)
      ? (isManager ? '60px 1fr 90px 90px 80px 80px 110px' : '60px 1fr 100px 90px 90px 80px')
      : (isManager ? '60px 1fr 80px 80px 80px 90px 80px 110px' : '60px 1fr 90px 90px 90px 100px 80px');

  const getBadgeClass = (gt = '') => {
    const norm = gt.toLowerCase();
    if (norm === 'quiz') return 'badge-disc badge-disc-quiz';
    if (norm === 'map') return 'badge-disc badge-disc-map';
    if (norm === 'crossword') return 'badge-disc badge-disc-crossword';
    if (norm === 'nonogram' || norm === 'shikaku' || norm === 'sudoku' || norm === 'logic' || norm === 'logic-puzzle') return 'badge-disc badge-disc-puzzle';
    return 'badge-disc badge-disc-typing';
  };

  // ========================================================
  // RENDER CASE 1: DIRECTORY MODE (When path is /leaderboard)
  // ========================================================
  if (!id) {
    const filteredTourneys = availableTournaments.filter(t => {
      const gType = t.gameType || 'typing';
      if (dirCategoryFilter !== 'all') {
        if (dirCategoryFilter === 'logic-puzzle') {
          if (!['logic-puzzle', 'nonogram', 'shikaku', 'sudoku'].includes(gType)) return false;
        } else if (gType !== dirCategoryFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (t.name || '').toLowerCase().includes(q) || (t.creatorName || t.createdBy || '').toLowerCase().includes(q);
      }
      return true;
    });

    const filteredPractice = practiceModes.filter(m => {
      if (dirCategoryFilter !== 'all') {
        const norm = m.format.toLowerCase();
        if (dirCategoryFilter === 'logic-puzzle' && norm === 'logic') return true;
        if (dirCategoryFilter !== norm) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.format.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <div className="container" style={{ maxWidth: '1040px', paddingBottom: '4rem', paddingTop: '1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', borderRadius: '14px', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.25)', fontSize: '0.75rem', fontWeight: '700', color: 'var(--gold)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Trophy size={13} /> Official Hall of Fame
          </div>
          <h1 style={{ fontSize: '2.1rem', margin: '0 0 0.4rem 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)' }}>
            Tournament &amp; Practice Standings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, maxWidth: '640px' }}>
            Inspect real-time candidate scores, accuracy metrics, and medal rankings across live competitions and training arenas.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search tournament name, discipline, or host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'typing', label: 'Typing' },
              { id: 'quiz', label: 'Quiz' },
              { id: 'map', label: 'Geography' },
              { id: 'crossword', label: 'Crossword' },
              { id: 'logic-puzzle', label: 'Logic' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDirCategoryFilter(f.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: dirCategoryFilter === f.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: dirCategoryFilter === f.id ? 'var(--primary)' : 'var(--surface-2)',
                  color: dirCategoryFilter === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Tournament Rooms */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Award size={18} color="var(--gold)" /> Live &amp; Historic Competitions ({filteredTourneys.length})
          </h2>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading competition leaderboards...</div>
          ) : filteredTourneys.length === 0 ? (
            <Card padding="2rem" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No tournaments matching your search filter.
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
              {filteredTourneys.map(t => (
                <Card key={t.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={getBadgeClass(t.gameType || 'typing')}>
                      {(t.gameType || 'typing').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      #{t.id.slice(0, 8)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    {t.name}
                  </h3>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem', flex: 1 }}>
                    Host: <strong>{t.creatorName || t.createdBy || 'Organizer'}</strong>
                  </p>

                  <Button 
                    variant="primary" 
                    onClick={() => navigate(`/leaderboard/${t.id}`)}
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Trophy size={15} /> View Standings
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Global Practice Disciplines */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Keyboard size={18} color="var(--primary-text)" /> Permanent Practice Arenas ({filteredPractice.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {filteredPractice.map(m => (
              <Card key={m.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                  <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--surface-2)' }}>
                    {m.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>{m.name}</h3>
                    <span className={getBadgeClass(m.format)} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>{m.format}</span>
                  </div>
                </div>

                <Button 
                  variant="secondary"
                  onClick={() => navigate(`/leaderboard/${m.id}`)}
                  style={{ width: '100%', marginTop: 'auto', padding: '0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Trophy size={14} /> Practice Standings
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER CASE 2: TOURNAMENT / ARENA STANDINGS (When id is present)
  // ========================================================
  if (notFound) {
    return (
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center', paddingTop: '4rem' }}>
        <Card padding="2.5rem">
          <Trophy size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tournament Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            The requested tournament does not exist or may have been deleted.
          </p>
          <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Browse All Leaderboards
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '980px', paddingBottom: '4rem', paddingTop: '1rem' }}>
      
      {/* Header Bar */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Link to="/leaderboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> All Leaderboards
          </Link>
          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            Dashboard
          </Link>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-text)', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
              {(gameType || 'competition').toUpperCase()} • {isHidden ? 'RESULTS HIDDEN' : `${leaderboard.length} CANDIDATES`}
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)', margin: 0 }}>
              <Trophy size={28} color="var(--primary)" /> {title || 'Tournament Standings'}
            </h1>
          </div>

          {/* User's Current Rank Chip */}
          {!isHidden && myRankIndex !== -1 && (
            <div style={{ 
              background: 'var(--surface)', 
              border: '1.5px solid var(--primary)', 
              borderRadius: '10px', 
              padding: '0.6rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.15)'
            }}>
              <Award size={22} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Your Standing</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Rank #{myRankIndex + 1} <span style={{ fontSize: '0.8rem', color: 'var(--primary-text)', fontWeight: '600' }}>({leaderboard[myRankIndex].score} pts)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Organizer Controls Tab Bar */}
      {!id.startsWith('practice-') && isManager && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('standings')}
              style={{
                padding: '0.45rem 0.9rem',
                background: activeTab === 'standings' ? 'var(--surface-2)' : 'transparent',
                border: '1px solid ' + (activeTab === 'standings' ? 'var(--border)' : 'transparent'),
                borderRadius: '8px',
                color: activeTab === 'standings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🏆 Standings Table
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              style={{
                padding: '0.45rem 0.9rem',
                background: activeTab === 'manage' ? 'var(--surface-2)' : 'transparent',
                border: '1px solid ' + (activeTab === 'manage' ? 'var(--border)' : 'transparent'),
                borderRadius: '8px',
                color: activeTab === 'manage' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <RotateCcw size={14} /> Retake Control
            </button>
            <button
              type="button"
              onClick={handleToggleHideLeaderboard}
              style={{
                padding: '0.45rem 0.85rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: tournament?.hideLeaderboard ? '#eab308' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title={tournament?.hideLeaderboard ? "Publish leaderboard to candidates" : "Hide leaderboard from candidates"}
            >
              {tournament?.hideLeaderboard ? <><Eye size={14} /> Publish Standings</> : <><EyeOff size={14} /> Hide Standings</>}
            </button>

            {tournament?.gameType === 'quiz' && (
              <button
                type="button"
                onClick={handleToggleShowQuizAnswers}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: tournament?.showQuizAnswers ? 'var(--success)' : '#eab308',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {tournament?.showQuizAnswers ? <><Eye size={14} /> Answers Revealed</> : <><EyeOff size={14} /> Answers Hidden</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MANAGER TAB CONTENT */}
      {activeTab === 'manage' && isManager && !id.startsWith('practice-') && (
        <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>
            Give Candidate Another Chance
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Clear any participant's attempt lock so they can re-enter this tournament and record a new score.
          </p>

          <form onSubmit={handleManualRetake} style={{ display: 'flex', gap: '0.75rem', maxWidth: '450px' }}>
            <Input 
              placeholder="Candidate Name or Admission No..."
              value={retakeInput}
              onChange={(e) => setRetakeInput(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '0.65rem 0.85rem' }}
            />
            <Button type="submit" disabled={actionLoading} style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.1rem' }}>
              Grant Retake
            </Button>
          </form>
        </Card>
      )}

      {/* STANDINGS TAB */}
      {activeTab === 'standings' && (
        <>
          {isHidden ? (
            <Card padding="3rem">
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <EyeOff size={28} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Leaderboard is Hidden</h2>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  The results and candidate rankings for this tournament have been hidden by the organizer until grading is completed.
                </p>
              </div>
            </Card>
          ) : (
            <div>
              {/* Host Visibility Notice Banner */}
              {tournament?.hideLeaderboard && isManager && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#eab308', fontSize: '0.875rem', fontWeight: '600' }}>
                    <EyeOff size={18} />
                    <span>Leaderboard is hidden from candidates (visible only to you as Host)</span>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={handleToggleHideLeaderboard}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={14} /> Make Public Now
                  </Button>
                </div>
              )}

              {/* Olympic 3-Position Podium (Responsive side-by-side layout) */}
              {top3.length > 0 && !searchQuery && currentPage === 1 && (
                <div className="leaderboard-podium-grid">
                  {/* Silver - 2nd Place (Left) */}
                  {top3[1] ? (
                    <div style={{
                      background: 'var(--surface)',
                      border: '1.5px solid rgba(148, 163, 184, 0.35)',
                      borderTop: '4px solid var(--silver)',
                      borderRadius: '12px',
                      padding: '1.1rem 0.65rem',
                      textAlign: 'center',
                      boxShadow: '0 6px 18px -4px var(--silver-glow)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      minHeight: '125px'
                    }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'var(--silver-glow)', border: '1.5px solid var(--silver)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.35rem'
                      }}>
                        <Award size={18} color="var(--silver)" />
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--silver)', letterSpacing: '0.05em' }}>
                        2ND PLACE
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', margin: '0.2rem 0', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(top3[1].displayName || top3[1].studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--silver)' }} className="tabular-nums font-mono-numbers">
                        {top3[1].displayScore !== undefined ? top3[1].displayScore : top3[1].score} pts
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {top3[1].wpm ? `${top3[1].wpm} WPM • ` : ''}{top3[1].accuracy}%
                      </div>
                    </div>
                  ) : <div />}

                  {/* Gold - 1st Place (Center & Elevated) */}
                  {top3[0] && (
                    <div style={{
                      background: 'var(--surface)',
                      border: '1.5px solid rgba(234, 179, 8, 0.4)',
                      borderTop: '4px solid var(--gold)',
                      borderRadius: '12px',
                      padding: '1.35rem 0.65rem',
                      textAlign: 'center',
                      boxShadow: '0 10px 24px -4px var(--gold-glow)',
                      transform: top3.length > 1 ? 'translateY(-6px)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      minHeight: '140px'
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--gold-glow)', border: '1.5px solid var(--gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.35rem'
                      }}>
                        <Crown size={22} color="var(--gold)" />
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--gold)', letterSpacing: '0.05em' }}>
                        1ST PLACE 👑
                      </div>
                      <div style={{ fontSize: '1.02rem', fontWeight: '800', margin: '0.2rem 0', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(top3[0].displayName || top3[0].studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--gold)' }} className="tabular-nums font-mono-numbers">
                        {top3[0].displayScore !== undefined ? top3[0].displayScore : top3[0].score} pts
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {top3[0].wpm ? `${top3[0].wpm} WPM • ` : ''}{top3[0].accuracy}%
                      </div>
                    </div>
                  )}

                  {/* Bronze - 3rd Place (Right) */}
                  {top3[2] ? (
                    <div style={{
                      background: 'var(--surface)',
                      border: '1.5px solid rgba(217, 119, 6, 0.35)',
                      borderTop: '4px solid var(--bronze)',
                      borderRadius: '12px',
                      padding: '1.1rem 0.65rem',
                      textAlign: 'center',
                      boxShadow: '0 6px 18px -4px var(--bronze-glow)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      minHeight: '125px'
                    }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'var(--bronze-glow)', border: '1.5px solid var(--bronze)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.35rem'
                      }}>
                        <Award size={18} color="var(--bronze)" />
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--bronze)', letterSpacing: '0.05em' }}>
                        3RD PLACE
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', margin: '0.2rem 0', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(top3[2].displayName || top3[2].studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--bronze)' }} className="tabular-nums font-mono-numbers">
                        {top3[2].displayScore !== undefined ? top3[2].displayScore : top3[2].score} pts
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {top3[2].wpm ? `${top3[2].wpm} WPM • ` : ''}{top3[2].accuracy}%
                      </div>
                    </div>
                  ) : <div />}
                </div>
              )}

              {/* Table Card with Search & Pagination */}
              <Card padding="0">
                {/* Search Header Bar */}
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <Input 
                      placeholder="Search candidate name or ID..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      style={{ paddingLeft: '2.25rem', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Showing {paginated.length} of {filtered.length} entries
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading leaderboard scores...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchQuery ? `No candidates found matching "${searchQuery}".` : 'No scores recorded yet. Be the first to compete!'}
                  </div>
                ) : (
                  <>
                    {/* DESKTOP VIEW: Multi-Column Table Grid (> 640px) */}
                    <div className="leaderboard-desktop-table" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div style={{ minWidth: isManager ? '720px' : '560px' }}>
                        {/* Table Header */}
                        <div style={{ 
                          padding: '0.85rem 1.25rem', 
                          borderBottom: '1px solid var(--border)', 
                          display: 'grid', 
                          gridTemplateColumns: gridCols, 
                          fontWeight: '700', 
                          fontSize: '0.78rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--text-tertiary)',
                          background: 'var(--surface-2)'
                        }}>
                          <div>Rank</div>
                          <div>Candidate</div>
                          {isMap ? (
                            <>
                              <div style={{ textAlign: 'center' }}>Score</div>
                              <div style={{ textAlign: 'center' }}>Time</div>
                              <div style={{ textAlign: 'center' }}>Accuracy</div>
                            </>
                          ) : (isQuiz || isCrossword || isPuzzle) ? (
                            <>
                              <div style={{ textAlign: 'center' }}>Score</div>
                              <div style={{ textAlign: 'center' }}>{isCrossword || isPuzzle ? 'Time' : 'Correct'}</div>
                              <div style={{ textAlign: 'center' }}>Accuracy</div>
                              <div style={{ textAlign: 'center' }}>Progress</div>
                            </>
                          ) : (
                            <>
                              <div style={{ textAlign: 'center' }}>Score</div>
                              <div style={{ textAlign: 'center' }}>WPM</div>
                              <div style={{ textAlign: 'center' }}>Accuracy</div>
                              <div style={{ textAlign: 'center' }}>Chars</div>
                              <div style={{ textAlign: 'center' }}>Progress</div>
                            </>
                          )}
                          {isManager && <div style={{ textAlign: 'right' }}>Actions</div>}
                        </div>

                        {/* Desktop Table Rows */}
                        <div>
                          {paginated.map((entry, idx) => {
                            const absoluteRank = (currentPage - 1) * pageSize + idx + 1;
                            const isMyRow = myStudentId && entry.studentId.toLowerCase() === myStudentId;
                            const canExpand = Boolean(
                              entry.sectionDetails || 
                              (isManager && (entry.quizDetails || entry.mapDetails)) || 
                              (tournament?.showQuizAnswers && isMyRow && entry.quizDetails)
                            );
                            const isExpanded = expandedId === entry.id;

                            return (
                              <React.Fragment key={entry.id}>
                                <div 
                                  style={{ 
                                    padding: '0.85rem 1.25rem', 
                                    borderBottom: idx < paginated.length - 1 && !isExpanded ? '1px solid var(--border)' : 'none',
                                    display: 'grid', 
                                    gridTemplateColumns: gridCols,
                                    alignItems: 'center',
                                    background: isMyRow ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                                    borderLeft: isMyRow ? '4px solid var(--primary)' : '4px solid transparent',
                                    transition: 'background-color 0.15s ease',
                                    cursor: canExpand ? 'pointer' : 'default',
                                    fontSize: '0.9rem'
                                  }}
                                  onClick={() => canExpand && setExpandedId(isExpanded ? null : entry.id)}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isMyRow ? 'rgba(79, 70, 229, 0.08)' : 'transparent'; }}
                                >
                                  <div style={{ 
                                    fontWeight: '800', 
                                    fontSize: '0.9rem',
                                    color: absoluteRank === 1 ? 'var(--gold)' : absoluteRank === 2 ? 'var(--silver)' : absoluteRank === 3 ? 'var(--bronze)' : 'var(--text-secondary)'
                                  }} className="tabular-nums font-mono-numbers">
                                    #{absoluteRank}
                                  </div>

                                  <div style={{ fontWeight: isMyRow ? '700' : '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {(entry.displayName || entry.studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                                    </span>
                                    {isMyRow && (
                                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--primary)', color: 'white', fontWeight: '700', flexShrink: 0 }}>
                                        YOU
                                      </span>
                                    )}
                                    {canExpand && (
                                      <span style={{ color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', marginLeft: '0.2rem' }}>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </span>
                                    )}
                                  </div>

                                  {/* Format Metrics */}
                                  {isMap ? (
                                    <>
                                      <div style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-primary)' }} className="tabular-nums font-mono-numbers">{entry.score}</div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.timeElapsed}s</div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.accuracy}%</div>
                                    </>
                                  ) : (isQuiz || isCrossword || isPuzzle) ? (
                                    <>
                                      <div style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-primary)' }} className="tabular-nums font-mono-numbers">
                                        {isPuzzle
                                          ? `${entry.displayScore !== undefined ? entry.displayScore : (entry.score > 100000 ? Math.floor(entry.score / 100000) : entry.score)}`
                                          : (entry.displayScore !== undefined ? entry.displayScore : entry.score)}
                                      </div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">
                                        {isCrossword || isPuzzle ? `${entry.timeElapsed}s` : `${entry.correctAnswers}/${entry.totalQuestions}`}
                                      </div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.accuracy}%</div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.progress || 0}%</div>
                                    </>
                                  ) : (
                                    <>
                                      <div style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-primary)' }} className="tabular-nums font-mono-numbers">
                                        {entry.displayScore !== undefined ? entry.displayScore : (entry.score ? Number(entry.score).toFixed(1) : ((entry.wpm * entry.accuracy) / 100).toFixed(1))}
                                      </div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.wpm}</div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.accuracy}%</div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }} className="tabular-nums font-mono-numbers">{entry.charsTyped || 0}</div>
                                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }} className="tabular-nums font-mono-numbers">{entry.progress || 0}%</div>
                                    </>
                                  )}

                                  {/* Manager Actions */}
                                  {isManager && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                      {!id.startsWith('practice-') && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAllowRetake(entry.studentId);
                                          }}
                                          disabled={actionLoading}
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: 'var(--danger)',
                                            border: '1px solid rgba(239, 68, 68, 0.25)',
                                            padding: '0.25rem 0.55rem',
                                            borderRadius: '6px',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: 'pointer'
                                          }}
                                          title="Reset attempt"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Desktop Expanded Detail Drawer */}
                                {isExpanded && (
                                  <div style={{ padding: '1.25rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                                    {entry.sectionDetails && (
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                        {entry.sectionDetails.map((sec, sIdx) => (
                                          <div key={sIdx} style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{sec.language || `Part ${sIdx + 1}`}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                              Speed: <strong>{sec.wpm} WPM</strong> • Acc: <strong>{sec.accuracy}%</strong>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {entry.quizDetails && (isManager || (tournament?.showQuizAnswers && isMyRow)) && (
                                      <div>
                                        <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.65rem' }}>
                                          {isManager ? 'Question-by-Question Grading:' : 'Your Quiz Answers & Review:'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                          {entry.quizDetails.map((qd, qIdx) => (
                                            <div key={qIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                              <div style={{ fontSize: '0.85rem', flex: 1 }}>
                                                <strong>Q{qIdx + 1}:</strong> {qd.question}
                                                <div style={{ color: qd.isCorrect ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                                                  Answer: "{qd.userAnswer}" {qd.isCorrect ? '✓ Correct' : `✗ (Expected: "${qd.correctAnswer}")`}
                                                </div>
                                              </div>
                                              {isManager && !qd.isCorrect && (
                                                <Button onClick={() => handleGrantMarks(entry.id, qIdx)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                                                  Grant Mark
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* MOBILE VIEW: Responsive Touch Cards (<= 640px) */}
                    <div className="leaderboard-mobile-list" style={{ padding: '0.75rem' }}>
                      {paginated.map((entry, idx) => {
                        const absoluteRank = (currentPage - 1) * pageSize + idx + 1;
                        const isMyRow = myStudentId && entry.studentId.toLowerCase() === myStudentId;
                        const canExpand = Boolean(
                          entry.sectionDetails || 
                          (isManager && (entry.quizDetails || entry.mapDetails)) || 
                          (tournament?.showQuizAnswers && isMyRow && entry.quizDetails)
                        );
                        const isExpanded = expandedId === entry.id;

                        let rankBadgeBg = 'var(--surface-2)';
                        let rankBadgeColor = 'var(--text-secondary)';
                        let rankBorder = 'var(--border)';
                        if (absoluteRank === 1) { rankBadgeBg = 'var(--gold-glow)'; rankBadgeColor = 'var(--gold)'; rankBorder = 'var(--gold)'; }
                        else if (absoluteRank === 2) { rankBadgeBg = 'var(--silver-glow)'; rankBadgeColor = 'var(--silver)'; rankBorder = 'var(--silver)'; }
                        else if (absoluteRank === 3) { rankBadgeBg = 'var(--bronze-glow)'; rankBadgeColor = 'var(--bronze)'; rankBorder = 'var(--bronze)'; }

                        return (
                          <div 
                            key={entry.id}
                            onClick={() => canExpand && setExpandedId(isExpanded ? null : entry.id)}
                            style={{
                              background: isMyRow ? 'rgba(79, 70, 229, 0.08)' : 'var(--surface)',
                              border: isMyRow ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              borderRadius: '10px',
                              padding: '0.75rem 0.85rem',
                              cursor: canExpand ? 'pointer' : 'default',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
                              {/* Left: Rank badge & Name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '8px',
                                  background: rankBadgeBg, color: rankBadgeColor, border: `1px solid ${rankBorder}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: '800', fontSize: '0.85rem', flexShrink: 0
                                }} className="font-mono-numbers">
                                  #{absoluteRank}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: isMyRow ? '800' : '700', fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {(entry.displayName || entry.studentId || '').replace(/^guest:/, '').replace(/_[a-z0-9]{5,8}$/, '')}
                                    </span>
                                    {isMyRow && (
                                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--primary)', color: 'white', fontWeight: '800' }}>
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                                    {isMap ? (
                                      <span>Time: <strong>{entry.timeElapsed}s</strong> • Acc: <strong>{entry.accuracy}%</strong></span>
                                    ) : (isQuiz || isCrossword || isPuzzle) ? (
                                      <span>{isCrossword || isPuzzle ? `Time: ${entry.timeElapsed}s` : `Correct: ${entry.correctAnswers}/${entry.totalQuestions}`} • Acc: <strong>{entry.accuracy}%</strong></span>
                                    ) : (
                                      <span>{entry.wpm ? `${entry.wpm} WPM • ` : ''}Acc: <strong>{entry.accuracy}%</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Score, expand chevron & Manager Reset */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }} className="tabular-nums font-mono-numbers">
                                    {isPuzzle 
                                      ? `${entry.displayScore !== undefined ? entry.displayScore : (entry.score > 100000 ? Math.floor(entry.score / 100000) : entry.score)}`
                                      : (entry.displayScore !== undefined ? entry.displayScore : (entry.score ? Number(entry.score).toFixed(1) : ((entry.wpm * entry.accuracy) / 100).toFixed(1)))}
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', marginLeft: '0.2rem', color: 'var(--text-secondary)' }}>pts</span>
                                  </div>
                                </div>

                                {canExpand && (
                                  <div style={{ color: 'var(--text-tertiary)' }}>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </div>
                                )}

                                {isManager && !id.startsWith('practice-') && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAllowRetake(entry.studentId);
                                    }}
                                    disabled={actionLoading}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: 'var(--danger)',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '6px',
                                      fontSize: '0.7rem',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Mobile Expanded Detail Section */}
                            {isExpanded && (
                              <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
                                {entry.sectionDetails && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {entry.sectionDetails.map((sec, sIdx) => (
                                      <div key={sIdx} style={{ background: 'var(--surface-2)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                        <strong>{sec.language || `Part ${sIdx + 1}`}:</strong> {sec.wpm} WPM • {sec.accuracy}% Acc
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {entry.quizDetails && (isManager || (tournament?.showQuizAnswers && isMyRow)) && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                      {isManager ? 'Questions & Grading:' : 'Answer Review:'}
                                    </div>
                                    {entry.quizDetails.map((qd, qIdx) => (
                                      <div key={qIdx} style={{ background: 'var(--surface-2)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                        <div><strong>Q{qIdx + 1}:</strong> {qd.question}</div>
                                        <div style={{ color: qd.isCorrect ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                                          Your answer: "{qd.userAnswer}" {qd.isCorrect ? '✓' : `✗ (Correct: "${qd.correctAnswer}")`}
                                        </div>
                                        {isManager && !qd.isCorrect && (
                                          <Button onClick={() => handleGrantMarks(entry.id, qIdx)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', marginTop: '0.35rem' }}>
                                            Grant Mark
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button 
                      variant="secondary"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      ← Previous
                    </Button>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button 
                      variant="secondary"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}

      {/* Themed In-Built Confirmation Dialog */}
      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.onConfirm}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          variant={confirmAction.variant}
          icon={confirmAction.icon}
        />
      )}
    </div>
  );
};

export default LeaderboardPage;
