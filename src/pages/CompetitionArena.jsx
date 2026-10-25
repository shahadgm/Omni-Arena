import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService } from '../services/db';
import { generateCompetitionText } from '../utils/textGenerator';
import { Trophy, Clock, Target, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';

const CompetitionArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  
  const [sections, setSections] = useState([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFocused, setIsFocused] = useState(true);
  
  // Stats
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const activeCharRef = useRef(null);
  const isSubmitting = useRef(false);

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

  // Auto-focus input when ready or when section changes
  useEffect(() => {
    if (sections.length > 0 && !completed) {
      inputRef.current?.focus();
      setIsFocused(true);
    }
  }, [sections, currentSectionIdx, completed]);

  // Global keydown listener so typing instantly focuses the input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (completed || isSubmitting.current) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key.length === 1 || e.key === 'Backspace') {
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [completed]);

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
        }, 150);
      } else {
        setTimeout(() => {
          handleFinish();
        }, 150);
      }
    }
  };

  // Smooth Monkeytype-style auto-scrolling to keep active line centered
  useEffect(() => {
    if (activeCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const charEl = activeCharRef.current;
      const charTop = charEl.offsetTop;
      const containerHeight = container.clientHeight;
      const targetScroll = Math.max(0, charTop - containerHeight / 2 + charEl.clientHeight / 2);
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [inputs, currentSectionIdx]);

  useEffect(() => {
    let timer;
    if (startTime && !completed && timeLeft !== null && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (startTime && !completed && timeLeft === 0) {
      handleFinish(); // time ran out
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

  const handleFinish = () => {
    if (!startTime) setStartTime(Date.now());
    const end = Date.now();
    setEndTime(end);
    setCompleted(true);
    saveResult(end);
  };

  const calculateStats = (end) => {
    const effectiveStart = startTime || end;
    const timeMs = Math.max(500, end - effectiveStart);
    const timeMins = timeMs / 60000;
    
    let totalScore = 0;
    let totalErrs = 0;
    let totalChars = 0;
    let totalTargetChars = 0;
    const sectionStats = [];
    
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
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      localStorage.removeItem(`started_${id}_${studentId}`);
    } catch (_e) {}

    const stats = calculateStats(end);

    try {
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
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    setTimeout(() => {
      navigate(`/leaderboard/${id}`);
    }, 2000);
  };
  
  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) {
      setCompleted(true);
      setEndTime(Date.now());
      if (!id.startsWith('practice-')) {
        saveResult(Date.now());
      } else {
        navigate(`/leaderboard/${id}`);
      }
    }
  }, id.startsWith('practice-'));
  
  if (sections.length === 0) return <div className="page-wrapper">Loading...</div>;

  if (completed) {
    const stats = calculateStats(endTime || Date.now());
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', padding: '3.5rem 2rem', maxWidth: '500px', width: '100%', boxShadow: 'var(--glass-shadow)' }}>
          <Trophy size={60} color="var(--accent-primary)" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.4rem', fontWeight: '700' }}>Competition Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>Great job, {studentId}!</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--surface-2)', padding: '1.25rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-text)', lineHeight: 1.1 }}>{stats.wpm}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: '600' }}>NET WPM</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '1.25rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--success)', lineHeight: 1.1 }}>{stats.accuracy}%</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: '600' }}>ACCURACY</div>
            </div>
          </div>
          
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Redirecting to tournament leaderboard...</p>
        </Card>
      </div>
    );
  }

  const currentSection = sections[currentSectionIdx] || {};
  const targetText = currentSection.text || '';
  const currentInput = inputs[currentSectionIdx] || '';
  const inputLength = currentInput.length;
  
  // Real-time HUD metrics
  const elapsedSecs = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 1000)) : 0;
  const elapsedMins = elapsedSecs / 60;
  const currentChars = currentInput.length;
  let currentErrors = 0;
  for (let i = 0; i < currentChars; i++) {
    if (currentInput[i] !== targetText[i]) currentErrors++;
  }
  const liveNetWpm = elapsedMins > 0 ? Math.round(Math.max(0, (currentChars / 5) / elapsedMins - (currentErrors / elapsedMins))) : 0;
  const liveAccuracy = currentChars > 0 ? Math.round(Math.max(0, ((currentChars - currentErrors) / currentChars) * 100)) : 100;
  const sectionProgress = targetText.length > 0 ? Math.min(100, Math.round((currentChars / targetText.length) * 100)) : 0;

  const renderText = () => {
    return targetText.split('').map((char, idx) => {
      let color = 'var(--text-tertiary)';
      let bg = 'transparent';
      const isTyped = idx < inputLength;
      const isCurrent = idx === inputLength;

      if (isTyped) {
        const isCorrect = currentInput[idx] === char;
        color = isCorrect ? 'var(--success)' : 'var(--error)';
        if (!isCorrect) {
          bg = char === ' ' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.18)';
        }
      } else if (isCurrent) {
        color = 'var(--text-primary)';
      }

      return (
        <span 
          key={idx} 
          ref={isCurrent ? activeCharRef : null}
          style={{ 
            color, 
            background: bg,
            position: 'relative',
            display: 'inline-block',
            borderRadius: bg !== 'transparent' ? '3px' : '0',
            fontWeight: isCurrent ? '700' : '400',
            transition: 'color 0.05s ease, background 0.05s ease'
          }}
        >
          {/* Active Blinking Monkeytype-style Caret */}
          {isCurrent && (
            <span 
              style={{
                position: 'absolute',
                left: currentSection.dir === 'rtl' ? 'auto' : '-1px',
                right: currentSection.dir === 'rtl' ? '-1px' : 'auto',
                top: '12%',
                bottom: '12%',
                width: '2.5px',
                backgroundColor: 'var(--accent-primary)',
                borderRadius: '2px',
                boxShadow: '0 0 8px var(--accent-primary)',
                animation: 'caretPulse 1s ease-in-out infinite',
                pointerEvents: 'none'
              }} 
            />
          )}
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className="container" style={{ maxWidth: '980px', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
          Arena <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-tertiary)', marginLeft: '0.4rem' }}>Typing</span>
        </h1>
        
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-2)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Target size={16} className="text-gradient" /> Section {currentSectionIdx + 1} of {sections.length}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-2)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Zap size={16} className="text-gradient" /> {currentSection.language || 'English'}
          </div>

          {timeLeft !== null && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: timeLeft < 15 && timeLeft > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-2)', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '20px', 
              border: '1px solid ' + (timeLeft < 15 && timeLeft > 0 ? 'var(--error)' : 'var(--border)'),
              color: timeLeft < 15 && timeLeft > 0 ? 'var(--error)' : 'var(--text-primary)',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem'
            }}>
              <Clock size={16} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Live Performance Ribbon */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1rem' 
      }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Zap size={18} style={{ color: 'var(--primary-text)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>LIVE SPEED</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {liveNetWpm} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>WPM</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Activity size={18} style={{ color: 'var(--success)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>ACCURACY</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
              {liveAccuracy}%
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--gold)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>PROGRESS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {sectionProgress}% <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>({currentChars}/{targetText.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monkeytype-Style In-Place Typing Card */}
      <Card 
        style={{ 
          position: 'relative', 
          padding: '1.75rem 2rem', 
          marginBottom: '1.25rem',
          boxShadow: 'var(--glass-shadow)',
          cursor: 'text',
          border: isFocused ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
          transition: 'border-color 0.2s ease',
          outline: 'none'
        }}
        onClick={() => {
          inputRef.current?.focus();
          setIsFocused(true);
        }}
      >
        {/* Hidden Auto-Capturing Textarea */}
        <textarea 
          ref={inputRef}
          value={currentInput}
          onChange={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          dir={currentSection.dir}
          autoFocus
          style={{
            position: 'absolute',
            opacity: 0,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'default',
            zIndex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            pointerEvents: 'none'
          }}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        />

        {/* Scrollable Text Viewport (Auto-centered on active word) */}
        <div 
          ref={containerRef}
          style={{ 
            fontSize: currentSection.dir === 'rtl' ? '1.75rem' : '1.5rem', 
            lineHeight: currentSection.dir === 'rtl' ? '3rem' : '2.6rem', 
            letterSpacing: currentSection.dir === 'rtl' ? '0' : '0.025em',
            direction: currentSection.dir,
            fontFamily: currentSection.dir === 'rtl' ? 'Arial, sans-serif' : 'var(--font-mono)',
            height: '210px',
            overflowY: 'hidden',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'scrollTop 0.15s ease'
          }}
        >
          {renderText()}
        </div>

        {/* Focus Invitation Overlay when blurred */}
        {!isFocused && !completed && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 11, 18, 0.72)',
              backdropFilter: 'blur(3px)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '30px',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              <Zap size={16} color="var(--accent-primary)" /> Click or press any key to focus &amp; type
            </div>
          </div>
        )}
      </Card>

      {/* Helper & Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          {currentSection.dir === 'rtl' ? (
            <span style={{ color: 'var(--warning)' }}>⚠️ Switch keyboard layout to {currentSection.language}.</span>
          ) : (
            <span>💡 <strong>Tip:</strong> Type directly on the words. Text auto-scrolls smoothly as you type.</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {currentSectionIdx > 0 && (
            <Button onClick={handlePrev} variant="secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem' }}>
              Previous Section
            </Button>
          )}

          {currentSectionIdx < sections.length - 1 ? (
            <Button onClick={handleNext} style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}>
              Next Section
            </Button>
          ) : (
            <Button onClick={handleFinish} style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem' }}>
              Submit &amp; Finish
            </Button>
          )}
        </div>
      </div>

    </div>
  );
};

export default CompetitionArena;
