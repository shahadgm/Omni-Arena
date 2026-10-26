import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService, authService } from '../services/db';
import { Trophy, Clock, Target, Lock } from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';

const QuizArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  const isSubmitting = useRef(false);
  
  const [tournament, setTournament] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // Array of selected option indices
  const [timeLeft, setTimeLeft] = useState(null);
  
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    
    const init = async () => {
      let t;
      if (id === 'practice-quiz-gk') {
        t = {
          name: 'General Knowledge',
          quizQuestions: [
            { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctOptionIndex: 2, timeLimitSec: 30 },
            { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctOptionIndex: 1, timeLimitSec: 30 },
            { question: 'What is the largest ocean on Earth?', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], correctOptionIndex: 3, timeLimitSec: 30 }
          ]
        };
      } else if (id === 'practice-quiz-tech') {
        t = {
          name: 'Tech & Science',
          quizQuestions: [
            { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyperlink Text Module Logic', 'Home Tool Markup Language'], correctOptionIndex: 0, timeLimitSec: 30 },
            { question: 'Who is known as the father of computer?', options: ['Alan Turing', 'Charles Babbage', 'Bill Gates', 'Steve Jobs'], correctOptionIndex: 1, timeLimitSec: 30 },
            { question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], correctOptionIndex: 2, timeLimitSec: 30 }
          ]
        };
      } else {
        t = await dbService.getTournament(id);
      }

      if (t && t.quizQuestions && t.quizQuestions.length > 0) {
        // Shuffle questions within their sections
        const sectionsMap = {};
        t.quizQuestions.forEach(q => {
          const sec = q.section || 'General';
          if (!sectionsMap[sec]) sectionsMap[sec] = [];
          sectionsMap[sec].push(q);
        });

        const shuffledQuestions = [];
        // Preserve the order of sections as they first appear in the original list
        const uniqueSections = [...new Set(t.quizQuestions.map(q => q.section || 'General'))];
        
        uniqueSections.forEach(sec => {
          const sectionQs = sectionsMap[sec];
          for (let i = sectionQs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sectionQs[i], sectionQs[j]] = [sectionQs[j], sectionQs[i]];
          }
          shuffledQuestions.push(...sectionQs);
        });
        
        t.quizQuestions = shuffledQuestions;

        setTournament(t);
        setAnswers(Array(t.quizQuestions.length).fill(null));
        setTimeLeft(t.quizQuestions[0].timeLimitSec || 30);
      } else {
        navigate('/dashboard');
      }
    };
    init();
  }, [id, navigate, studentId]);

  useEffect(() => {
    let timer;
    if (tournament && !completed && timeLeft !== null && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (tournament && !completed && timeLeft === 0) {
      handleNext(true); // time ran out, auto advance
    }
    return () => clearTimeout(timer);
  }, [completed, timeLeft, tournament]);

  // Keyboard navigation for MCQ: 1-4 or A-D to select, Enter to advance
  useEffect(() => {
    if (!tournament || completed) return;
    const currentQ = tournament.quizQuestions?.[currentQuestionIdx];
    if (!currentQ || currentQ.type === 'text') return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (key === '1' || key === 'A') selectedIdx = 0;
      else if (key === '2' || key === 'B') selectedIdx = 1;
      else if (key === '3' || key === 'C') selectedIdx = 2;
      else if (key === '4' || key === 'D') selectedIdx = 3;
      else if (key === 'ENTER') {
        handleNext();
        return;
      }

      if (selectedIdx >= 0 && selectedIdx < (currentQ.options?.length || 0)) {
        handleSelectOption(selectedIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tournament, completed, currentQuestionIdx, answers]);

  const handleSelectOption = (optIdx) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optIdx;
    setAnswers(newAnswers);
  };

  const handleNext = (timeOut = false) => {
    if (currentQuestionIdx < tournament.quizQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setTimeLeft(tournament.quizQuestions[currentQuestionIdx + 1].timeLimitSec || 30);
    } else {
      handleFinish();
    }
  };

  const [quizDetails, setQuizDetails] = useState([]);

  const handleFinish = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      localStorage.removeItem(`started_${id}_${studentId}`);
    } catch (e) {}

    setCompleted(true);
    
    // Calculate Score
    let correctCount = 0;
    let totalScore = 0;
    const details = [];
    
    const sectionScores = {};

    tournament.quizQuestions.forEach((q, idx) => {
      let isCorrect = false;
      const pts = q.points || 1;
      let userAnswerDisplay = '';
      let correctAnswerDisplay = '';

      if (q.type === 'text') {
        const userAnswer = (answers[idx] || '').toString().trim().toLowerCase();
        const actualAnswer = (q.correctAnswer || '').toString().trim().toLowerCase();
        userAnswerDisplay = answers[idx] || '';
        correctAnswerDisplay = q.correctAnswer || '';
        
        if (userAnswer === actualAnswer && actualAnswer !== '') {
          isCorrect = true;
        }
      } else {
        // mcq
        userAnswerDisplay = q.options[answers[idx]] || 'No Answer';
        correctAnswerDisplay = q.options[q.correctOptionIndex];
        
        if (answers[idx] === q.correctOptionIndex) {
          isCorrect = true;
        }
      }
      
      const sec = q.section || 'General';
      if (!sectionScores[sec]) sectionScores[sec] = { score: 0, max: 0 };
      sectionScores[sec].max += pts;

      if (isCorrect) {
        correctCount++;
        totalScore += pts;
        sectionScores[sec].score += pts;
      }
      
      details.push({
        question: q.question,
        section: sec,
        userAnswer: userAnswerDisplay,
        correctAnswer: correctAnswerDisplay,
        isCorrect,
        pointsAwarded: isCorrect ? pts : 0,
        maxPoints: pts
      });
    });
    
    // Convert sectionScores object to an array for easy rendering/storing
    const sectionDetails = Object.keys(sectionScores).map(sec => ({
      section: sec,
      score: sectionScores[sec].score,
      max: sectionScores[sec].max
    }));
    
    const accuracy = Math.round((correctCount / tournament.quizQuestions.length) * 100);
    setFinalScore(totalScore);
    setQuizDetails(details);

    try {
      await dbService.saveResult(id, {
        studentId,
        score: totalScore,
        accuracy,
        correctAnswers: correctCount,
        totalQuestions: tournament.quizQuestions.length,
        progress: 100, // completed
        wpm: 0, // to satisfy leaderboard tiebreakers gracefully
        quizDetails: details,
        sectionDetails
      });
    } catch (err) {
      console.error('Failed to save quiz result:', err);
    }
  };

  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) handleFinish();
  }, id.startsWith('practice-'));

  if (!tournament) return <div className="page-wrapper">Loading...</div>;

  if (completed) {
    const isPractice = id.startsWith('practice-');
    const currentUser = authService.getCurrentUser();
    const isAdmin = authService.isAdmin();
    const isGuest = authService.isGuest();
    const isRegisteredOwner = !isGuest && currentUser?.username && typeof tournament?.createdBy === 'string' && !tournament.createdBy.startsWith('guest:') && tournament.createdBy.toLowerCase() === currentUser.username.toLowerCase();
    const isManager = isAdmin || isRegisteredOwner;
    const canShowAnswers = isPractice || isManager || !!tournament?.showQuizAnswers;

    return (
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <Trophy size={64} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Great job, {studentId}!</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{finalScore}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Total Points</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
            <Button onClick={() => navigate(`/leaderboard/${id}`)}>View Leaderboard</Button>
          </div>
        </Card>

        {canShowAnswers ? (
          <>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Your Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quizDetails.map((detail, idx) => (
                <Card key={idx} style={{ padding: '1.5rem', borderLeft: `4px solid ${detail.isCorrect ? 'var(--success)' : 'var(--error)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', maxWidth: '80%' }}>{idx + 1}. {detail.question}</h4>
                    <div style={{ background: 'var(--glass-bg)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.9rem', color: detail.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                      {detail.pointsAwarded} / {detail.maxPoints} pts
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Your Answer</div>
                      <div style={{ color: detail.isCorrect ? 'var(--success)' : 'var(--error)', fontWeight: '500' }}>
                        {detail.userAnswer}
                      </div>
                    </div>
                    {!detail.isCorrect && (
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Correct Answer</div>
                        <div style={{ color: 'var(--success)', fontWeight: '500' }}>
                          {detail.correctAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card style={{ padding: '2.5rem 2rem', textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#eab308'
            }}>
              <Lock size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Answers Hidden by Organizer
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
              Your submission has been securely recorded. The tournament host has hidden question breakdowns and correct answers while the competition is active.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              <Clock size={15} /> Check back on the leaderboard once the host reveals answers
            </div>
          </Card>
        )}
      </div>
    );
  }

  const currentQ = tournament.quizQuestions[currentQuestionIdx];

  return (
    <div 
      className="container" 
      style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', userSelect: 'none' }}
      onCopy={e => e.preventDefault()}
      onCut={e => e.preventDefault()}
      onPaste={e => e.preventDefault()}
      onContextMenu={e => e.preventDefault()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Quiz Arena</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <Target size={18} className="text-gradient" /> Q {currentQuestionIdx + 1} of {tournament.quizQuestions.length}
          </div>
          {timeLeft !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border)', color: timeLeft < 10 && timeLeft > 0 ? 'var(--danger)' : 'inherit' }}>
              <Clock size={16} /> <span className="font-mono-numbers" style={{ fontWeight: '700' }}>{timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: '1rem', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Section: {currentQ.section || 'General'}
          </span>
          <h2 style={{ fontSize: '1.35rem', marginTop: '1rem', lineHeight: '1.4' }}>
            {currentQ.question}
          </h2>
        </div>
        
        <div style={{ 
          display: currentQ.type === 'text' ? 'block' : 'grid', 
          gridTemplateColumns: currentQ.type === 'text' ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '0.75rem', 
          flex: 1, 
          overflowY: 'auto',
          alignContent: 'start'
        }}>
          {currentQ.type === 'text' ? (
            <div style={{ marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="Type your answer here..."
                value={answers[currentQuestionIdx] || ''}
                onChange={(e) => handleSelectOption(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '1.1rem',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>
          ) : (
            currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQuestionIdx] === idx;
              const optionLetter = ['A', 'B', 'C', 'D'][idx] || idx + 1;
              return (
                <div 
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    padding: '0.9rem 1.15rem',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-2)',
                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontSize: '1rem',
                    boxShadow: isSelected ? '0 0 12px var(--primary-glow)' : 'none'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--primary)' : 'var(--surface)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {optionLetter}
                  </div>
                  <span style={{ fontWeight: isSelected ? '600' : '500', color: 'var(--text-primary)' }}>{opt}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <Button onClick={() => handleNext(false)} style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)' }}>
          {currentQuestionIdx < tournament.quizQuestions.length - 1 ? 'Next Question' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
};

export default QuizArena;
