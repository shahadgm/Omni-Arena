import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';

const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ArenaRouter = lazy(() => import('./pages/ArenaRouter'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const StudentHistory = lazy(() => import('./pages/StudentHistory'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CreateTournament = lazy(() => import('./pages/admin/CreateTournament'));

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
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="page-wrapper">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/arena/:id" element={<ArenaRouter />} />
            <Route path="/leaderboard/:id" element={<LeaderboardPage />} />
            <Route path="/history" element={<StudentHistory />} />
            
            <Route path="/tournament/create" element={<CreateTournament />} />
            <Route path="/tournament/edit/:id" element={<CreateTournament />} />
            <Route path="/admin/login" element={<AdminLogin />} />
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
