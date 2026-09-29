import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService } from '../services/db';
import { Trophy, Clock, Target } from 'lucide-react';

const QuizArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
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
    setCompleted(true);
    
    // Calculate Score
    let correctCount = 0;
    let totalScore = 0;
    const details = [];
    
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
      
      if (isCorrect) {
        correctCount++;
        totalScore += pts;
      }
      
      details.push({
        question: q.question,
        userAnswer: userAnswerDisplay,
        correctAnswer: correctAnswerDisplay,
        isCorrect,
        pointsAwarded: isCorrect ? pts : 0,
        maxPoints: pts
      });
    });
    
    const accuracy = Math.round((correctCount / tournament.quizQuestions.length) * 100);
    setFinalScore(totalScore);
    setQuizDetails(details);

    await dbService.saveResult(id, {
      studentId,
      score: totalScore,
      accuracy,
      correctAnswers: correctCount,
      totalQuestions: tournament.quizQuestions.length,
      progress: 100, // completed
      wpm: 0, // to satisfy leaderboard tiebreakers gracefully
      quizDetails: details
    });
  };

  if (!tournament) return <div className="page-wrapper">Loading...</div>;

  if (completed) {
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
      </div>
    );
  }

  const currentQ = tournament.quizQuestions[currentQuestionIdx];

  return (
    <div className="container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Quiz Arena</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <Target size={18} className="text-gradient" /> Q {currentQuestionIdx + 1} of {tournament.quizQuestions.length}
          </div>
          {timeLeft !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--glass-border)', color: timeLeft < 10 && timeLeft > 0 ? 'var(--error)' : 'inherit' }}>
              <Clock size={18} /> {timeLeft}s
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: '1rem', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          {currentQ.question}
        </h2>
        
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
            currentQ.options.map((opt, idx) => (
              <div 
                key={idx}
                onClick={() => handleSelectOption(idx)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: answers[currentQuestionIdx] === idx ? 'rgba(99, 102, 241, 0.2)' : 'var(--glass-bg)',
                  border: `1px solid ${answers[currentQuestionIdx] === idx ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '1.05rem'
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${answers[currentQuestionIdx] === idx ? 'var(--accent-primary)' : 'var(--text-tertiary)'}`,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0
                }}>
                  {answers[currentQuestionIdx] === idx && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                </div>
                <span>{opt}</span>
              </div>
            ))
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
