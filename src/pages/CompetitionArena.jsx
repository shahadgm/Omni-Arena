import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService } from '../services/db';
import { generateCompetitionText } from '../utils/textGenerator';
import { Trophy, Clock, Target, Zap } from 'lucide-react';

const CompetitionArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
  const [sections, setSections] = useState([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Stats
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    
    const initializeArena = async () => {
      let textSections = [];
      if (id.startsWith('practice-')) {
        const type = id.replace('practice-', '');
        textSections = generateCompetitionText(type.charAt(0).toUpperCase() + type.slice(1));
      } else {
        const tournament = await dbService.getTournament(id);
        if (tournament && tournament.customText) {
           textSections = tournament.customText;
        } else if (tournament) {
           textSections = generateCompetitionText(tournament.type);
        } else {
           navigate('/dashboard');
           return;
        }
        
        if (tournament && tournament.timeLimit > 0) {
          setTimeLeft(tournament.timeLimit * 60);
        }
      }
      setSections(textSections);
      setInputs(Array(textSections.length).fill(''));
    };
    
    initializeArena();
  }, [id, navigate, studentId]);

  const handleInput = (e) => {
    if (!startTime) setStartTime(Date.now());
    const val = e.target.value;
    const currentTarget = sections[currentSectionIdx]?.text || '';
    
    // Prevent typing beyond the text length
    if (val.length > currentTarget.length) return;

    const newInputs = [...inputs];
    newInputs[currentSectionIdx] = val;
    setInputs(newInputs);

    // Auto-advance if reached the end of the current text
    if (val.length === currentTarget.length) {
      if (currentSectionIdx < sections.length - 1) {
        setTimeout(() => {
          setCurrentSectionIdx(prev => prev + 1);
        }, 150); // slight delay to show the final keystroke visually
      } else {
        setTimeout(() => {
          handleFinish(false);
        }, 150);
      }
    }
  };

  useEffect(() => {
    let timer;
    if (startTime && !completed && timeLeft !== null && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (startTime && !completed && timeLeft === 0) {
      handleFinish(true); // time ran out
    }
    return () => clearTimeout(timer);
  }, [startTime, completed, timeLeft]);

  const handleNext = () => {
    if (!startTime) setStartTime(Date.now());
    if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx(prev => prev - 1);
    }
  };

  const handleFinish = (isTimeOut = false) => {
    if (!startTime) setStartTime(Date.now());
    const end = Date.now();
    setEndTime(end);
    setCompleted(true);
    saveResult(end);
  };

  const calculateStats = (end) => {
    const timeMs = end - startTime;
    const timeMins = timeMs / 60000;
    
    let totalScore = 0;
    let totalErrs = 0;
    let totalChars = 0;
    let totalTargetChars = 0;
    let sectionStats = [];
    
    sections.forEach((sec, idx) => {
      const secInput = inputs[idx] || "";
      const target = sec.text || "";
      
      const secChars = secInput.length;
      const targetChars = target.length;
      
      totalChars += secChars;
      totalTargetChars += targetChars;

      let secErrs = 0;
      for(let i = 0; i < secChars; i++) {
        if(secInput[i] !== target[i]) secErrs++;
      }
      totalErrs += secErrs;

      // Section Metrics
      const secGrossWpm = timeMins > 0 ? (secChars / 5) / timeMins : 0;
      const secNetWpm = timeMins > 0 ? Math.max(0, secGrossWpm - (secErrs / timeMins)) : 0;
      const secAccuracy = secChars === 0 ? 0 : Math.max(0, ((secChars - secErrs) / secChars) * 100);
      const secProgress = targetChars === 0 ? 0 : Math.min(100, (secChars / targetChars) * 100);
      
      // Section Score (WPM * Accuracy/100 * Progress/100)
      const secScore = secNetWpm * (secAccuracy / 100) * (secProgress / 100);
      totalScore += secScore;
      
      sectionStats.push({
        language: sec.language,
        wpm: Math.round(secNetWpm),
        accuracy: Math.round(secAccuracy),
        progress: Math.round(secProgress),
        score: secScore
      });
    });
    
    const grossWpm = timeMins > 0 ? (totalChars / 5) / timeMins : 0;
    const netWpm = timeMins > 0 ? Math.max(0, grossWpm - (totalErrs / timeMins)) : 0;
    const overallAccuracy = totalChars === 0 ? 0 : Math.max(0, ((totalChars - totalErrs) / totalChars) * 100);
    const overallProgress = totalTargetChars === 0 ? 0 : Math.min(100, (totalChars / totalTargetChars) * 100);
    
    return { 
      wpm: Math.round(netWpm), 
      accuracy: Math.round(overallAccuracy), 
      chars: totalChars,
      progress: Math.round(overallProgress),
      finalScore: totalScore,
      sectionDetails: sectionStats
    };
  };

  const saveResult = async (end) => {
    const stats = calculateStats(end);

    await dbService.saveResult(id, {
      studentId,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      netSpeed: stats.wpm,
      charsTyped: stats.chars,
      progress: stats.progress,
      score: stats.finalScore,
      sectionDetails: stats.sectionDetails
    });
    setTimeout(() => {
      navigate(`/leaderboard/${id}`);
    }, 2000);
  };
  
  if (sections.length === 0) return <div className="page-wrapper">Loading...</div>;

  if (completed) {
    const stats = calculateStats(endTime);
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px', width: '100%' }}>
          <Trophy size={64} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Competition Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Great job, {studentId}!</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{stats.wpm}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>WPM</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>{stats.accuracy}%</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Accuracy</div>
            </div>
          </div>
          
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Redirecting to leaderboard...</p>
        </Card>
      </div>
    );
  }

  const currentSection = sections[currentSectionIdx];
  const targetText = currentSection.text;
  const currentInput = inputs[currentSectionIdx] || '';
  const inputLength = currentInput.length;
  
  const renderText = () => {
    return targetText.split('').map((char, idx) => {
      let color = 'var(--text-secondary)';
      if (idx < inputLength) {
        color = currentInput[idx] === char ? 'var(--success)' : 'var(--error)';
      }
      return (
        <span key={idx} style={{ 
          color, 
          background: currentInput[idx] !== char && idx < inputLength && char === ' ' ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
          borderBottom: idx === inputLength ? '2px solid var(--accent-primary)' : 'none',
        }}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Arena</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <Target size={18} className="text-gradient" /> Section {currentSectionIdx + 1} of {sections.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <Zap size={18} className="text-gradient" /> Language: {currentSection.language}
          </div>
          {timeLeft !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)', color: timeLeft < 10 && timeLeft > 0 ? 'var(--error)' : 'inherit' }}>
              <Clock size={18} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <div 
          style={{ 
            fontSize: '1.5rem', 
            lineHeight: '2.5rem', 
            direction: currentSection.dir,
            fontFamily: currentSection.dir === 'rtl' ? 'Arial, sans-serif' : 'var(--font-mono)',
            padding: '1rem',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
          onClick={() => inputRef.current?.focus()}
          onCopy={(e) => e.preventDefault()}
        >
          {renderText()}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <textarea 
          ref={inputRef}
          value={currentInput}
          onChange={handleInput}
          dir={currentSection.dir}
          placeholder="Start typing..."
          autoFocus
          style={{
            width: '100%',
            height: '150px',
            padding: '1rem',
            fontSize: '1.5rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontFamily: currentSection.dir === 'rtl' ? 'Arial, sans-serif' : 'var(--font-mono)',
            resize: 'none',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault();
            }
          }}
        />
        
        {currentSection.dir === 'rtl' && (
          <p style={{ color: 'var(--warning)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Make sure your keyboard is switched to {currentSection.language} layout.
          </p>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          {currentSectionIdx > 0 ? (
            <Button onClick={handlePrev} variant="secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Previous Section
            </Button>
          ) : <div></div>}

          {currentSectionIdx < sections.length - 1 ? (
            <Button onClick={handleNext} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Next Section
            </Button>
          ) : (
            <Button onClick={() => handleFinish(false)} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Submit & Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionArena;
