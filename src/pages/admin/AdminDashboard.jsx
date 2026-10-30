import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/Modal';
import { dbService, authService } from '../../services/db';
import { 
  Plus, Users, Calendar, Keyboard, Edit, Trash2, 
  RotateCcw, Square, MapPin, Hash, Lock, Search, Copy, Check, Eye, EyeOff, Filter,
  MessageSquare, Star, Bug, Lightbulb, Ban, UserCheck, Clock, Shield, Settings,
  Trophy, Globe, HelpCircle, Sparkles, ExternalLink, Link2
} from 'lucide-react';

const AdminDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'upcoming' | 'ended'
  const [disciplineFilter, setDisciplineFilter] = useState('all'); // 'all' | 'typing' | 'quiz' | 'map' | 'crossword' | 'logic-puzzle'
  const [revealedCodes, setRevealedCodes] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [activeTab, setActiveTab] = useState('tournaments'); // 'tournaments' | 'users' | 'feedback' | 'practice'

  // Feedback State
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');

  // User Management State
  const [userList, setUserList] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [genericConfirm, setGenericConfirm] = useState(null); // 'all' | 'active' | 'suspended' | 'banned'
  const [userActionModal, setUserActionModal] = useState(null); // { user, type: 'suspend' | 'ban' } | null
  const [suspendDurationHours, setSuspendDurationHours] = useState('24');
  const [customHours, setCustomHours] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await dbService.getTournaments();
      setTournaments(data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const data = await dbService.getFeedbackList();
      setFeedbackList(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const data = await dbService.getUsers();
      setUserList(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (!authService.isAdmin()) {
      navigate(authService.isAuthenticated() ? '/dashboard' : '/');
      return;
    }
    fetchTournaments();
    fetchFeedback();
    fetchUsers();
  }, [navigate]);

  const handleDelete = (id, name) => {
    setGenericConfirm({
      title: "Delete Tournament?",
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete Tournament",
      variant: "danger",
      icon: <Trash2 size={26} />,
      onConfirm: async () => {
        try {
          await dbService.deleteTournament(id);
          fetchTournaments();
        } catch (err) {
          console.error("Failed to delete tournament:", err);
        } finally {
          setGenericConfirm(null);
        }
      }
    });
  };

  const handleResetLeaderboard = (id, name) => {
    setGenericConfirm({
      title: "Reset Leaderboard?",
      message: `Are you sure you want to reset the leaderboard for "${name}"? All candidate scores and submissions will be wiped.`,
      confirmText: "Reset Scores",
      variant: "warning",
      icon: <RotateCcw size={26} />,
      onConfirm: async () => {
        try {
          await dbService.resetLeaderboard(id);
        } catch (err) {
          console.error("Failed to reset leaderboard:", err);
        } finally {
          setGenericConfirm(null);
        }
      }
    });
  };

  const toggleRevealCode = (id) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id, code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLink = (id, e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/arena/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleOpenSuspendModal = (user) => {
    setUserActionModal({ user, type: 'suspend' });
    setSuspendDurationHours('24');
    setCustomHours('');
    setActionReason('');
  };

  const handleOpenBanModal = (user) => {
    setUserActionModal({ user, type: 'ban' });
    setActionReason('');
  };

  const handleSubmitUserAction = async (e) => {
    e?.preventDefault();
    if (!userActionModal?.user) return;
    const { user, type } = userActionModal;
    setActionLoading(true);
    try {
      if (type === 'suspend') {
        const hours = suspendDurationHours === 'custom' ? parseFloat(customHours) : parseFloat(suspendDurationHours);
        if (!hours || isNaN(hours) || hours <= 0) {
          alert("Please enter a valid positive duration in hours.");
          setActionLoading(false);
          return;
        }
        await dbService.suspendUser(user.username, hours, actionReason);
        alert(`User @${user.username} has been suspended for ${hours} hours.`);
      } else if (type === 'ban') {
        await dbService.banUser(user.username, actionReason);
        alert(`User @${user.username} has been permanently banned.`);
      }
      setUserActionModal(null);
      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = (username) => {
    setGenericConfirm({
      title: "Reactivate Account?",
      message: `Reactivate account for @${username}? Any active suspension or ban will be lifted immediately.`,
      confirmText: "Reactivate Account",
      variant: "primary",
      icon: <UserCheck size={26} />,
      onConfirm: async () => {
        try {
          await dbService.reactivateUser(username);
          fetchUsers();
        } catch (err) {
          console.error("Error reactivating user:", err);
        } finally {
          setGenericConfirm(null);
        }
      }
    });
  };

  const handleDeleteUser = (username) => {
    setGenericConfirm({
      title: "Delete User?",
      message: `Are you sure you want to PERMANENTLY delete user @${username}? This action is irreversible.`,
      confirmText: "Delete User",
      variant: "danger",
      icon: <Trash2 size={26} />,
      onConfirm: async () => {
        try {
          await dbService.deleteUser(username);
          fetchUsers();
        } catch (err) {
          console.error("Error deleting user:", err);
        } finally {
          setGenericConfirm(null);
        }
      }
    });
  };

  const getStatus = (startStr, endStr) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (now >= start && now <= end) {
      return { label: 'LIVE', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.12)' };
    } else if (now < start) {
      return { label: 'SCHEDULED', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)' };
    }
    return { label: 'ENDED', color: 'var(--text-tertiary)', bg: 'var(--surface-2)' };
  };

  const getBadgeClass = (gt = '') => {
    const norm = gt.toLowerCase();
    if (norm === 'quiz') return 'badge-disc badge-disc-quiz';
    if (norm === 'map') return 'badge-disc badge-disc-map';
    if (norm === 'crossword') return 'badge-disc badge-disc-crossword';
    if (norm === 'nonogram' || norm === 'shikaku' || norm === 'sudoku' || norm === 'logic' || norm === 'logic-puzzle') return 'badge-disc badge-disc-puzzle';
    return 'badge-disc badge-disc-typing';
  };

  const practiceModes = [
    { id: 'practice-english', name: 'English Sprint', format: 'Typing', desc: 'Standard English typing speed & accuracy drill.' },
    { id: 'practice-arabic', name: 'Arabic Focus', format: 'Typing', desc: 'Standard Arabic typography test.' },
    { id: 'practice-urdu', name: 'Urdu Focus', format: 'Typing', desc: 'Nastaliq Urdu script practice sprint.' },
    { id: 'practice-bilingual', name: 'Bilingual Challenge', format: 'Typing', desc: 'English followed by Arabic script.' },
    { id: 'practice-trilingual', name: 'Trilingual Master', format: 'Typing', desc: 'English, Arabic, and Urdu in one test.' },
    { id: 'practice-quiz-gk', name: 'General Knowledge', format: 'Quiz', desc: 'Mock quiz trivia questions across world facts.' },
    { id: 'practice-quiz-tech', name: 'Tech & Science', format: 'Quiz', desc: 'Coding, physics, and science MCQ practice.' },
    { id: 'practice-nonogram-5x5', name: '5x5 Easy Nonogram', format: 'Logic', desc: 'Row and column clue painting deduction.' },
    { id: 'practice-nonogram-10x10', name: '10x10 Medium Nonogram', format: 'Logic', desc: 'Medium picture tile deduction challenge.' },
    { id: 'practice-shikaku-5x5', name: '5x5 Beginner Shikaku', format: 'Logic', desc: 'Rectangular grid area partitioning.' },
    { id: 'practice-sudoku-easy', name: 'Sudoku (Easy)', format: 'Logic', desc: 'Classic 9x9 number grid with starter clues.' },
    { id: 'practice-sudoku-medium', name: 'Sudoku (Medium)', format: 'Logic', desc: '9x9 logical number placement deduction.' },
    { id: 'practice-map', name: 'World Geography', format: 'Map', desc: 'Pinpoint world capitals, flags, and countries.' },
    { id: 'practice-crossword', name: 'Cryptic Crossword', format: 'Crossword', desc: 'Intersecting clue word puzzle practice.' }
  ];

  // Executive Metrics Calculations
  const now = new Date();
  const liveCount = tournaments.filter(t => new Date(t.startTime) <= now && new Date(t.endTime) >= now).length;
  const activeUsersCount = userList.filter(u => u.status === 'active' || !u.status || (u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) <= now)).length;
  const restrictedUsersCount = userList.filter(u => u.status === 'banned' || (u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) > now)).length;
  const bugCount = feedbackList.filter(f => f.type === 'bug').length;

  // Tournament Counts by Discipline
  const typingCount = tournaments.filter(t => (t.gameType || 'typing') === 'typing').length;
  const quizCount = tournaments.filter(t => t.gameType === 'quiz').length;
  const mapCount = tournaments.filter(t => t.gameType === 'map').length;
  const crosswordCount = tournaments.filter(t => t.gameType === 'crossword').length;
  const puzzleCount = tournaments.filter(t => ['logic-puzzle', 'nonogram', 'shikaku', 'sudoku'].includes(t.gameType)).length;

  // Filtered Tournaments
  const filteredTournaments = tournaments.filter(t => {
    const gType = t.gameType || 'typing';
    if (disciplineFilter !== 'all') {
      if (disciplineFilter === 'logic-puzzle') {
        if (!['logic-puzzle', 'nonogram', 'shikaku', 'sudoku'].includes(gType)) return false;
      } else if (gType !== disciplineFilter) {
        return false;
      }
    }

    if (statusFilter !== 'all') {
      const start = new Date(t.startTime);
      const end = new Date(t.endTime);
      if (statusFilter === 'active' && !(now >= start && now <= end)) return false;
      if (statusFilter === 'upcoming' && !(now < start)) return false;
      if (statusFilter === 'ended' && !(now > end)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (t.name || '').toLowerCase().includes(q);
      const matchCode = (t.accessCode || '').toLowerCase().includes(q);
      const matchHost = (t.creatorName || t.createdBy || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchHost) return false;
    }

    return true;
  });

  const mainTabs = [
    { id: 'tournaments', label: 'Tournaments', icon: <Trophy size={18} />, badge: tournaments.length },
    { id: 'users', label: 'User Control', icon: <Users size={18} />, badge: userList.length },
    { id: 'feedback', label: 'Feedback & Reports', icon: <MessageSquare size={18} />, badge: feedbackList.length },
    { id: 'practice', label: 'Practice Arenas', icon: <Keyboard size={18} />, badge: practiceModes.length }
  ];

  return (
    <div className="container" style={{ maxWidth: '1120px', margin: '0 auto', padding: '1rem', paddingBottom: '4rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-text)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Shield size={12} /> Master Admin Hub
          </div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: '800', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            OmniArena Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Oversee live competitions, manage leaderboards, inspect user reports, and maintain platform security.
          </p>
        </div>

        <Button 
          variant="primary" 
          onClick={() => navigate('/admin/tournament/create')} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: '700' }}
        >
          <Plus size={18} /> Create Tournament
        </Button>
      </div>

      {/* Top Executive Metric HUD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Live Tournaments */}
        <Card padding="1.25rem" hoverEffect={true} style={{ borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Now
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: '800', color: 'var(--success)' }} className="font-mono-numbers">
            {loading ? '...' : liveCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Active matches accepting contestant submissions
          </div>
        </Card>

        {/* Total Tournaments */}
        <Card padding="1.25rem" hoverEffect={true} style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Contests
            </span>
            <Trophy size={16} color="var(--primary-text)" />
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: '800', color: 'var(--text-primary)' }} className="font-mono-numbers">
            {loading ? '...' : tournaments.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Across Typing, Quiz, Maps, and Puzzles
          </div>
        </Card>

        {/* Registered Users */}
        <Card padding="1.25rem" hoverEffect={true} style={{ borderLeft: '4px solid var(--disc-quiz)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Registered Accounts
            </span>
            <Users size={16} color="var(--disc-quiz)" />
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: '800', color: 'var(--text-primary)' }} className="font-mono-numbers">
            {userLoading ? '...' : userList.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {activeUsersCount} active • {restrictedUsersCount} restricted
          </div>
        </Card>

        {/* Community Reports */}
        <Card padding="1.25rem" hoverEffect={true} style={{ borderLeft: '4px solid var(--gold)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Community Feedback
            </span>
            <MessageSquare size={16} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: '800', color: 'var(--gold)' }} className="font-mono-numbers">
            {feedbackLoading ? '...' : feedbackList.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {bugCount} open bug ticket{bugCount === 1 ? '' : 's'} reported
          </div>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.4rem', 
        marginBottom: '2rem', 
        background: 'var(--surface-2)', 
        padding: '0.35rem', 
        borderRadius: '10px', 
        border: '1px solid var(--border)',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {mainTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '7px',
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '12px',
                background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--surface)',
                color: isActive ? '#FFFFFF' : 'var(--text-tertiary)',
                fontWeight: '700',
                marginLeft: '0.15rem'
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: UNIFIED TOURNAMENTS MANAGER
         ======================================================== */}
      {activeTab === 'tournaments' && (
        <div>
          {/* Discipline Category Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: 'All Formats', count: tournaments.length, badgeClass: '' },
              { id: 'typing', label: 'Speed Typing', count: typingCount, badgeClass: 'badge-disc-typing' },
              { id: 'quiz', label: 'Live Quiz', count: quizCount, badgeClass: 'badge-disc-quiz' },
              { id: 'map', label: 'Geography Map', count: mapCount, badgeClass: 'badge-disc-map' },
              { id: 'crossword', label: 'Crossword', count: crosswordCount, badgeClass: 'badge-disc-crossword' },
              { id: 'logic-puzzle', label: 'Logic Puzzles', count: puzzleCount, badgeClass: 'badge-disc-puzzle' }
            ].map(disc => {
              const isSelected = disciplineFilter === disc.id;
              return (
                <button
                  key={disc.id}
                  onClick={() => setDisciplineFilter(disc.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface)',
                    color: isSelected ? 'var(--primary-text)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{disc.label}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8, padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--surface-2)' }}>
                    {disc.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text"
                placeholder="Search tournament name, 6-digit PIN, host..."
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} /> Status:
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Live' },
                { id: 'upcoming', label: 'Scheduled' },
                { id: 'ended', label: 'Ended' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: statusFilter === s.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: statusFilter === s.id ? 'var(--primary)' : 'var(--surface-2)',
                    color: statusFilter === s.id ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tournaments List Card */}
          <Card padding="0" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: '780px' }}>
                {/* Table Header */}
                <div style={{ 
                  padding: '0.875rem 1.25rem', 
                  background: 'var(--surface-2)', 
                  borderBottom: '1px solid var(--border)', 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(260px, 3fr) minmax(130px, 1.2fr) minmax(150px, 1.3fr) minmax(220px, 2fr)', 
                  fontWeight: '700', 
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-tertiary)' 
                }}>
                  <div>Tournament & Format</div>
                  <div>Live Status</div>
                  <div>Schedule</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {loading ? (
                  <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading tournaments...
                  </div>
                ) : filteredTournaments.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Calendar size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 0.75rem', opacity: 0.6 }} />
                    <p style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      No matching tournaments found
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      {searchQuery || statusFilter !== 'all' || disciplineFilter !== 'all'
                        ? 'Try clearing your search terms or adjusting the format filter.' 
                        : 'No tournaments have been created yet.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredTournaments.map((t, idx) => {
                      const status = getStatus(t.startTime, t.endTime);
                      const start = new Date(t.startTime);
                      const isRevealed = revealedCodes[t.id];
                      const isCopied = copiedId === t.id;
                      const isLinkCopied = copiedLinkId === t.id;
                      const gType = t.gameType || 'typing';

                      return (
                        <div 
                          key={t.id} 
                          style={{ 
                            padding: '1rem 1.25rem', 
                            borderBottom: idx < filteredTournaments.length - 1 ? '1px solid var(--border)' : 'none',
                            display: 'grid', 
                            gridTemplateColumns: 'minmax(260px, 3fr) minmax(130px, 1.2fr) minmax(150px, 1.3fr) minmax(220px, 2fr)',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.9rem',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {/* Tournament Details */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              <span className={getBadgeClass(gType)}>
                                {gType.toUpperCase()}
                              </span>
                              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                {t.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                              <span>Host: <strong style={{ color: 'var(--text-secondary)' }}>{t.creatorName || t.createdBy || 'Organizer'}</strong></span>
                              <span>•</span>
                              <span>ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{t.id.slice(0, 8)}</code></span>

                              {/* Access Code Pill */}
                              {t.isPrivate ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.1rem 0.45rem' }}>
                                  <Lock size={11} color="var(--primary-text)" />
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                                    {isRevealed ? t.accessCode : '••••••'}
                                  </span>
                                  <button 
                                    type="button"
                                    onClick={() => toggleRevealCode(t.id)} 
                                    title={isRevealed ? "Hide code" : "Reveal code"}
                                    style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                                  >
                                    {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => handleCopyCode(t.id, t.accessCode, e)} 
                                    title="Copy PIN code"
                                    style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: isCopied ? 'var(--success)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                                  >
                                    {isCopied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.05rem 0.35rem' }}>
                                  Public Room
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Live Status */}
                          <div>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '700', 
                              padding: '0.25rem 0.65rem', 
                              background: status.bg, 
                              color: status.color, 
                              borderRadius: '6px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              letterSpacing: '0.03em'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color, boxShadow: status.label === 'LIVE' ? '0 0 6px var(--success)' : 'none' }}></span>
                              {status.label}
                            </span>
                          </div>

                          {/* Schedule */}
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                            <div className="font-mono-numbers">
                              {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }} className="font-mono-numbers">
                              {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Button 
                              variant="secondary" 
                              onClick={() => navigate(`/leaderboard/${t.id}`)} 
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Users size={14} /> Standings
                            </Button>
                            
                            <Button 
                              variant="secondary" 
                              onClick={() => navigate(`/admin/tournament/edit/${t.id}`)} 
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Edit size={14} /> Edit
                            </Button>

                            {/* Copy Direct Arena Link */}
                            <button 
                              type="button"
                              onClick={(e) => handleCopyLink(t.id, e)} 
                              title={isLinkCopied ? "Link copied!" : "Copy direct contestant link"}
                              style={{ 
                                padding: '0.35rem 0.5rem', 
                                background: 'transparent', 
                                border: '1px solid var(--border)', 
                                borderRadius: '6px', 
                                color: isLinkCopied ? 'var(--success)' : 'var(--text-secondary)', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              {isLinkCopied ? <Check size={14} /> : <Link2 size={14} />}
                            </button>

                            {/* Reset Leaderboard */}
                            <button 
                              type="button"
                              onClick={() => handleResetLeaderboard(t.id, t.name)} 
                              title="Reset leaderboard scores"
                              style={{ 
                                padding: '0.35rem 0.5rem', 
                                background: 'transparent', 
                                border: '1px solid var(--border)', 
                                borderRadius: '6px', 
                                color: 'var(--warning)', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <RotateCcw size={14} />
                            </button>

                            {/* Delete Tournament */}
                            <button 
                              type="button"
                              onClick={() => handleDelete(t.id, t.name)} 
                              title="Permanently delete tournament"
                              style={{ 
                                padding: '0.35rem 0.5rem', 
                                background: 'transparent', 
                                border: '1px solid var(--border)', 
                                borderRadius: '6px', 
                                color: 'var(--danger)', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 2: USER & ORGANIZER CONTROL
         ======================================================== */}
      {activeTab === 'users' && (() => {
        let filteredUsers = userList;
        if (userSearch.trim()) {
          const q = userSearch.toLowerCase();
          filteredUsers = filteredUsers.filter(u => 
            u.username.toLowerCase().includes(q) ||
            (u.displayName && u.displayName.toLowerCase().includes(q))
          );
        }
        if (userStatusFilter !== 'all') {
          filteredUsers = filteredUsers.filter(u => {
            if (userStatusFilter === 'active') {
              return u.status === 'active' || !u.status || (u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) <= new Date());
            }
            if (userStatusFilter === 'suspended') {
              return u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
            }
            if (userStatusFilter === 'banned') {
              return u.status === 'banned';
            }
            return true;
          });
        }

        const totalCount = userList.length;
        const activeCount = userList.filter(u => u.status === 'active' || !u.status || (u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) <= new Date())).length;
        const suspendedCount = userList.filter(u => u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) > new Date()).length;
        const bannedCount = userList.filter(u => u.status === 'banned').length;

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-display)', margin: '0 0 0.25rem 0' }}>
                  User & Organizer Access Control
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Inspect registered organizers, enforce temporary contest cooldowns, or ban cheating accounts.
                </p>
              </div>

              <Button 
                variant="secondary" 
                onClick={fetchUsers} 
                disabled={userLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <RotateCcw size={14} /> Refresh Users
              </Button>
            </div>

            {/* Search & Status Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text"
                  placeholder="Search user by username or display name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Filter size={14} /> Status:
                </span>
                {[
                  { id: 'all', label: `All (${totalCount})` },
                  { id: 'active', label: `Active (${activeCount})` },
                  { id: 'suspended', label: `Suspended (${suspendedCount})` },
                  { id: 'banned', label: `Banned (${bannedCount})` }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setUserStatusFilter(s.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: userStatusFilter === s.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                      background: userStatusFilter === s.id ? 'var(--primary)' : 'var(--surface-2)',
                      color: userStatusFilter === s.id ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <Card padding="0" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: '740px' }}>
                  <div style={{ 
                    padding: '0.85rem 1.25rem', 
                    background: 'var(--surface-2)', 
                    borderBottom: '1px solid var(--border)',
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(220px, 2.5fr) minmax(110px, 1fr) minmax(140px, 1.4fr) minmax(220px, 2fr)',
                    fontSize: '0.78rem', 
                    fontWeight: '700', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-tertiary)' 
                  }}>
                    <div>User Account</div>
                    <div>Role</div>
                    <div>Account Status</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                  </div>

                  {userLoading ? (
                    <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Loading registered users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Users size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 0.75rem', opacity: 0.6 }} />
                      <p style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        No matching users found
                      </p>
                      <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        {userSearch || userStatusFilter !== 'all' ? 'Try adjusting your search query or filter.' : 'No registered users found.'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {filteredUsers.map((u, idx) => {
                        const isAdminUser = u.username.toLowerCase() === 'admin' || u.role === 'admin';
                        const isSuspendedNow = u.status === 'suspended' && u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
                        const isBannedNow = u.status === 'banned';

                        let remainingHours = 0;
                        if (isSuspendedNow) {
                          remainingHours = Math.max(1, Math.ceil((new Date(u.suspendedUntil) - Date.now()) / (3600 * 1000)));
                        }

                        return (
                          <div
                            key={u.username}
                            style={{
                              padding: '1rem 1.25rem',
                              borderBottom: idx < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none',
                              display: 'grid',
                              gridTemplateColumns: 'minmax(220px, 2.5fr) minmax(110px, 1fr) minmax(140px, 1.4fr) minmax(220px, 2fr)',
                              alignItems: 'center',
                              gap: '0.75rem',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {u.displayName || u.username}
                                {isAdminUser && (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                                @{u.username} {u.createdAt ? `• Joined ${new Date(u.createdAt).toLocaleDateString()}` : ''}
                              </div>
                              {(u.banReason && (isBannedNow || isSuspendedNow)) && (
                                <div style={{ fontSize: '0.75rem', color: isBannedNow ? 'var(--danger)' : 'var(--warning)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                  Note: "{u.banReason}"
                                </div>
                              )}
                            </div>

                            <div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 0.55rem', 
                                borderRadius: '6px', 
                                fontWeight: '700',
                                background: isAdminUser ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-2)',
                                color: isAdminUser ? 'var(--primary-text)' : 'var(--text-secondary)',
                                border: '1px solid var(--border)'
                              }}>
                                {isAdminUser ? 'ADMIN' : 'ORGANIZER'}
                              </span>
                            </div>

                            <div>
                              {isBannedNow ? (
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '0.25rem 0.6rem', 
                                  borderRadius: '6px', 
                                  fontWeight: '700',
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  color: 'var(--danger)',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}>
                                  <Ban size={12} /> BANNED
                                </span>
                              ) : isSuspendedNow ? (
                                <div>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '0.25rem 0.6rem', 
                                    borderRadius: '6px', 
                                    fontWeight: '700',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: 'var(--warning)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}>
                                    <Clock size={12} /> SUSPENDED
                                  </span>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                                    {remainingHours}h remaining
                                  </div>
                                </div>
                              ) : (
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '0.25rem 0.6rem', 
                                  borderRadius: '6px', 
                                  fontWeight: '700',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: 'var(--success)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}>
                                  <Check size={12} /> ACTIVE
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {isAdminUser ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                  <Shield size={14} color="var(--primary-text)" /> Protected
                                </div>
                              ) : (
                                <>
                                  {isSuspendedNow && (
                                    <button
                                      type="button"
                                      onClick={() => handleReactivateUser(u.username)}
                                      title="Lift suspension immediately"
                                      style={{
                                        padding: '0.35rem 0.65rem',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '6px',
                                        color: 'var(--success)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                      }}
                                    >
                                      <UserCheck size={13} /> Reactivate
                                    </button>
                                  )}

                                  {isBannedNow && (
                                    <button
                                      type="button"
                                      onClick={() => handleReactivateUser(u.username)}
                                      title="Unban account"
                                      style={{
                                        padding: '0.35rem 0.65rem',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '6px',
                                        color: 'var(--success)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                      }}
                                    >
                                      <UserCheck size={13} /> Unban
                                    </button>
                                  )}

                                  {!isSuspendedNow && !isBannedNow && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSuspendModal(u)}
                                        title="Apply cooldown suspension"
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          background: 'rgba(245, 158, 11, 0.12)',
                                          border: '1px solid rgba(245, 158, 11, 0.3)',
                                          borderRadius: '6px',
                                          color: 'var(--warning)',
                                          cursor: 'pointer',
                                          fontSize: '0.8rem',
                                          fontWeight: '600',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem'
                                        }}
                                      >
                                        <Clock size={13} /> Suspend
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenBanModal(u)}
                                        title="Permanently ban user"
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          background: 'rgba(244, 63, 94, 0.12)',
                                          border: '1px solid rgba(244, 63, 94, 0.3)',
                                          borderRadius: '6px',
                                          color: 'var(--danger)',
                                          cursor: 'pointer',
                                          fontSize: '0.8rem',
                                          fontWeight: '600',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem'
                                        }}
                                      >
                                        <Ban size={13} /> Ban
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.username)}
                                    title="Permanently delete user account"
                                    style={{
                                      padding: '0.35rem 0.5rem',
                                      background: 'transparent',
                                      border: '1px solid var(--border)',
                                      borderRadius: '6px',
                                      color: 'var(--danger)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ========================================================
          TAB 3: FEEDBACK & COMMUNITY REPORTS
         ======================================================== */}
      {activeTab === 'feedback' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-display)', margin: '0 0 0.25rem 0' }}>
                Feedback & Community Reports
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Review bug tickets, platform suggestions, and community ratings submitted by contestants and hosts.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={fetchFeedback}
              disabled={feedbackLoading}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} /> Refresh
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text"
                placeholder="Search feedback message, user, or category..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} /> Type:
              </span>
              {[
                { id: 'all', label: `All (${feedbackList.length})` },
                { id: 'bug', label: `Bugs (${feedbackList.filter(f => f.type === 'bug').length})` },
                { id: 'suggestion', label: `Suggestions (${feedbackList.filter(f => f.type === 'suggestion').length})` },
                { id: 'review', label: `Reviews (${feedbackList.filter(f => f.type === 'review').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFeedbackTypeFilter(f.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: feedbackTypeFilter === f.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: feedbackTypeFilter === f.id ? 'var(--primary)' : 'var(--surface-2)',
                    color: feedbackTypeFilter === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Items Grid */}
          {feedbackLoading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading feedback submissions...
            </div>
          ) : (() => {
            const filteredFeedback = feedbackList.filter(fb => {
              if (feedbackTypeFilter !== 'all' && fb.type !== feedbackTypeFilter) {
                return false;
              }
              if (feedbackSearch.trim()) {
                const q = feedbackSearch.toLowerCase();
                const matchTitle = (fb.title || '').toLowerCase().includes(q);
                const matchMessage = (fb.message || '').toLowerCase().includes(q);
                const matchUser = (fb.displayName || '').toLowerCase().includes(q);
                const matchCat = (fb.category || '').toLowerCase().includes(q);
                return matchTitle || matchMessage || matchUser || matchCat;
              }
              return true;
            });

            if (filteredFeedback.length === 0) {
              return (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <MessageSquare size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 0.75rem', opacity: 0.6 }} />
                  <p style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>No feedback items found</p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    {feedbackSearch || feedbackTypeFilter !== 'all' ? 'Try adjusting your search terms or filter.' : 'No community feedback submitted yet.'}
                  </p>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredFeedback.map(fb => (
                  <Card key={fb.id} padding="1.25rem" style={{ border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {/* Type Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: fb.type === 'bug' ? 'rgba(244, 63, 94, 0.15)' : fb.type === 'suggestion' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: fb.type === 'bug' ? 'var(--danger)' : fb.type === 'suggestion' ? 'var(--disc-quiz)' : 'var(--gold)',
                          border: `1px solid ${fb.type === 'bug' ? 'rgba(244, 63, 94, 0.3)' : fb.type === 'suggestion' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {fb.type === 'bug' && <Bug size={12} />}
                          {fb.type === 'suggestion' && <Lightbulb size={12} />}
                          {fb.type === 'review' && <Star size={12} />}
                          {fb.type}
                        </span>

                        {fb.category && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.55rem' }}>
                            {fb.category}
                          </span>
                        )}

                        {fb.type === 'review' && fb.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                size={14} 
                                fill={star <= fb.rating ? 'var(--gold)' : 'transparent'} 
                                color={star <= fb.rating ? 'var(--gold)' : 'var(--text-tertiary)'} 
                              />
                            ))}
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gold)', marginLeft: '0.35rem' }}>
                              {fb.rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date'}
                      </div>
                    </div>

                    {fb.title && (
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        {fb.title}
                      </h3>
                    )}

                    <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: '1.5', margin: '0 0 0.85rem 0', whiteSpace: 'pre-wrap' }}>
                      {fb.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      <div>
                        Submitted by: <strong style={{ color: 'var(--text-secondary)' }}>{fb.displayName || 'Anonymous'}</strong>
                        {fb.submittedBy && fb.submittedBy !== 'anonymous' && (
                          <span style={{ opacity: 0.7, marginLeft: '0.35rem' }}>({fb.submittedBy})</span>
                        )}
                      </div>
                      {fb.deviceInfo && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fb.deviceInfo}>
                          {fb.deviceInfo}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================
          TAB 4: PRACTICE ARENAS HUB
         ======================================================== */}
      {activeTab === 'practice' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-display)', margin: '0 0 0.25rem 0' }}>
              Permanent Practice Leaderboards
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Inspect global scores and leaderboards for unseeded training arenas across all 5 disciplines.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {practiceModes.map(m => (
              <Card key={m.id} hoverEffect={true} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={getBadgeClass(m.format)}>
                      {m.format.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                    {m.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                    {m.desc}
                  </p>
                </div>
                
                <Button 
                  variant="secondary"
                  onClick={() => navigate(`/leaderboard/${m.id}`)} 
                  style={{ width: '100%', marginTop: '1.25rem', fontWeight: '700', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Users size={14} /> View Leaderboard
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Suspend / Ban Modal Dialog */}
      {userActionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <Card style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ 
                width: '52px', height: '52px', borderRadius: '50%', 
                background: userActionModal.type === 'ban' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                border: `1px solid ${userActionModal.type === 'ban' ? 'var(--danger)' : 'var(--warning)'}`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem',
                color: userActionModal.type === 'ban' ? 'var(--danger)' : 'var(--warning)'
              }}>
                {userActionModal.type === 'ban' ? <Ban size={26} /> : <Clock size={26} />}
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                {userActionModal.type === 'ban' ? 'Permanently Ban User' : 'Suspend Account'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Applying action to: <strong style={{ color: 'var(--text-primary)' }}>@{userActionModal.user.username}</strong> ({userActionModal.user.displayName || userActionModal.user.username})
              </p>
            </div>

            <form onSubmit={handleSubmitUserAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userActionModal.type === 'suspend' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Suspension Duration
                  </label>
                  <select
                    value={suspendDurationHours}
                    onChange={(e) => setSuspendDurationHours(e.target.value)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="1">1 Hour (Cooling off)</option>
                    <option value="6">6 Hours (Match day lockout)</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="72">72 Hours (3 Days)</option>
                    <option value="168">7 Days (1 Week)</option>
                    <option value="720">30 Days (1 Month)</option>
                    <option value="custom">Custom duration in hours...</option>
                  </select>

                  {suspendDurationHours === 'custom' && (
                    <Input
                      type="number"
                      placeholder="Enter hours (e.g. 12 or 48)..."
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      min="1"
                      required
                      style={{ marginTop: '0.35rem' }}
                    />
                  )}
                </div>
              )}

              {userActionModal.type === 'ban' && (
                <div style={{ padding: '0.85rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.825rem', lineHeight: '1.5' }}>
                  ⚠️ <strong>Permanent Action:</strong> The user will be immediately rejected from logging in or hosting tournaments until an admin explicitly unbans them.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Reason (Optional)
                </label>
                <Input
                  placeholder={userActionModal.type === 'ban' ? 'e.g. Repeated cheating or anti-cheat violation' : 'e.g. Match misconduct or suspicious speed'}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <Button 
                  type="submit" 
                  disabled={actionLoading}
                  variant={userActionModal.type === 'ban' ? 'danger' : 'primary'}
                  style={{ flex: 1, padding: '0.75rem', fontWeight: '700' }}
                >
                  {actionLoading ? 'Processing...' : (userActionModal.type === 'ban' ? 'Ban Permanently' : 'Apply Suspension')}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setUserActionModal(null)} 
                  disabled={actionLoading}
                  style={{ padding: '0.75rem 1rem' }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Themed In-Built Confirmation Dialog (Replaces Browser Dialog Boxes) */}
      {genericConfirm && (
        <ConfirmModal
          isOpen={!!genericConfirm}
          onClose={() => setGenericConfirm(null)}
          onConfirm={genericConfirm.onConfirm}
          title={genericConfirm.title}
          message={genericConfirm.message}
          confirmText={genericConfirm.confirmText}
          variant={genericConfirm.variant}
          icon={genericConfirm.icon}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
