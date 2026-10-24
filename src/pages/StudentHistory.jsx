import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { dbService } from '../services/db';
import { History, ArrowLeft } from 'lucide-react';

const StudentHistory = () => {
  const [history, setHistory] = useState([]);
  const [tournamentsMap, setTournamentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }

    const fetchHistory = async () => {
      try {
        const [data, tournaments] = await Promise.all([
          dbService.getStudentHistory(studentId),
          dbService.getTournaments()
        ]);
        const map = {};
        tournaments.forEach(t => { map[t.id] = t.name; });
        setTournamentsMap(map);
        setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate, studentId]);

  const getScoreDisplay = (entry) => {
    if (entry.abandoned) return '0.0 (Abandoned)';
    if (entry.displayScore !== undefined) return `${entry.displayScore} pts`;
    if (entry.score !== undefined && !entry.wpm) return `${entry.score} pts`;
    if (entry.wpm !== undefined) return ((entry.wpm * (entry.accuracy || 0)) / 100).toFixed(1);
    return entry.score || 0;
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <History className="text-gradient" size={40} /> My History
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>Track your performance across all competitions and practice tests.</p>
      </div>

      <Card padding="0" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: '700px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div>Competition</div>
              <div>Date</div>
              <div style={{ textAlign: 'center', color: 'var(--accent-primary)' }}>Score</div>
              <div style={{ textAlign: 'center' }}>WPM</div>
              <div style={{ textAlign: 'center' }}>Accuracy</div>
              <div style={{ textAlign: 'center' }}>Chars</div>
              <div style={{ textAlign: 'center' }}>Progress</div>
            </div>
            
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>You haven't participated in any competitions yet.</div>
            ) : (
              <div>
                {history.map((entry, idx) => (
                  <div key={idx} style={{ 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: idx < history.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                    alignItems: 'center',
                    fontSize: '0.95rem'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {tournamentsMap[entry.competitionId] || (entry.competitionId.startsWith('practice-') ? 
                        entry.competitionId.replace('practice-', '').charAt(0).toUpperCase() + entry.competitionId.replace('practice-', '').slice(1) + ' Practice' 
                        : 'Tournament ' + entry.competitionId.substring(0, 6))}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(entry.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1.15rem' }}>
                      {getScoreDisplay(entry)}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: '500' }}>
                      {entry.wpm !== undefined ? entry.wpm : '-'}
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--success)' }}>
                      {entry.accuracy !== undefined ? `${entry.accuracy}%` : '-'}
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {entry.charsTyped || entry.correctAnswers || '-'}
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>
                      {entry.progress || 0}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudentHistory;
