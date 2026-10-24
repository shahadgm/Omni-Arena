import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ArenaRouter from './pages/ArenaRouter';
import LeaderboardPage from './pages/LeaderboardPage';
import StudentHistory from './pages/StudentHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateTournament from './pages/admin/CreateTournament';

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
      </div>
    </Router>
  );
};

export default App;
