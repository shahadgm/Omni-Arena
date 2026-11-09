import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import RouteSEO from './components/RouteSEO';
import LandingPage from './pages/LandingPage';

// Self-healing dynamic import: if a new release changed chunk hashes, auto-refresh to fetch fresh assets
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const hasRefreshed = sessionStorage.getItem('chunk_retry_refreshed');
    try {
      const component = await componentImport();
      sessionStorage.removeItem('chunk_retry_refreshed');
      return component;
    } catch (error) {
      if (!hasRefreshed) {
        sessionStorage.setItem('chunk_retry_refreshed', 'true');
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });

const StudentDashboard = lazyWithRetry(() => import('./pages/StudentDashboard'));
const ArenaRouter = lazyWithRetry(() => import('./pages/ArenaRouter'));
const LeaderboardPage = lazyWithRetry(() => import('./pages/LeaderboardPage'));
const StudentHistory = lazyWithRetry(() => import('./pages/StudentHistory'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const CreateTournament = lazyWithRetry(() => import('./pages/admin/CreateTournament'));
const FeedbackPage = lazyWithRetry(() => import('./pages/FeedbackPage'));
const GeographyLanding = lazyWithRetry(() => import('./pages/GeographyLanding'));
const TypingLanding = lazyWithRetry(() => import('./pages/TypingLanding'));
const PuzzlesLanding = lazyWithRetry(() => import('./pages/PuzzlesLanding'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
    Loading...
  </div>
);

const App = () => {
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('omni-theme') || 'dark';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omni-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <RouteSEO />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="page-wrapper">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/geography" element={<GeographyLanding />} />
            <Route path="/typing" element={<TypingLanding />} />
            <Route path="/puzzles" element={<PuzzlesLanding />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/arena/:id" element={<ArenaRouter />} />
            <Route path="/leaderboard/:id" element={<LeaderboardPage />} />
            <Route path="/history" element={<StudentHistory />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            
            <Route path="/tournament/create" element={<CreateTournament />} />
            <Route path="/tournament/edit/:id" element={<CreateTournament />} />
            <Route path="/admin/login" element={<Navigate to="/" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tournament/create" element={<CreateTournament />} />
            <Route path="/admin/tournament/edit/:id" element={<CreateTournament />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
