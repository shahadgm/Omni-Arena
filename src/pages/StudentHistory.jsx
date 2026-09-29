import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { dbService } from '../services/db';
import { History, ArrowLeft } from 'lucide-react';

const StudentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }

    const fetchHistory = async () => {
      const data = await dbService.getStudentHistory(studentId);
      setHistory(data);
      setLoading(false);
    };

    fetchHistory();
  }, [navigate, studentId]);

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <History className="text-gradient" size={40} /> My History
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>Track your typing progress across all competitions.</p>
      </div>

      <Card padding="0">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', fontWeight: '600', color: 'var(--text-secondary)' }}>
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
                padding: '1.5rem', 
                borderBottom: idx < history.length - 1 ? '1px solid var(--glass-border)' : 'none',
                display: 'grid', 
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                alignItems: 'center'
              }}>
                <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>
                  {entry.competitionId.startsWith('practice-') ? 
                    entry.competitionId.replace('practice-', '').charAt(0).toUpperCase() + entry.competitionId.replace('practice-', '').slice(1) + ' Practice' 
                    : 'Tournament ' + entry.competitionId.substring(0, 5)}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {new Date(entry.date).toLocaleString()}
                </div>
                <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1.25rem' }}>
                  {((entry.wpm * entry.accuracy) / 100).toFixed(1)}
                </div>
                <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '1.1rem' }}>
                  {entry.wpm}
                </div>
                <div style={{ textAlign: 'center', color: 'var(--success)' }}>
                  {entry.accuracy}%
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {entry.charsTyped || 0}
                </div>
                <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>
                  {entry.progress || 0}%
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentHistory;
