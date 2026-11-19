import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dbService } from '../services/db';
import { 
  generateCompetitionText, 
  getDrillInitialSections, 
  getNextDrillParagraph 
} from '../utils/textGenerator';
import { 
  TYPING_DRILL_PRESETS, 
  getDrillPreset, 
  parseDrillParams 
} from '../utils/typingDrills';
import { 
  Trophy, Clock, Target, Zap, Activity, CheckCircle2, 
  RotateCcw, ArrowRight, Sparkles, Flame, Award, Home 
} from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import soundEngine from '../utils/soundEffects';

const CompetitionArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = localStorage.getItem('studentId');
  const isPractice = id.startsWith('practice-');
  
  // Drill duration in minutes (1, 2, 5, 10, 15, 30, or 0 for untimed)
  const [drillMinutes, setDrillMinutes] = useState(() => parseDrillParams(id, searchParams));
  
  const [sections, setSections] = useState([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [totalTimeSecs, setTotalTimeSecs] = useState(null);
  const [isFocused, setIsFocused] = useState(true);
  
  // Stats
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const activeCharRef = useRef(null);
  const isSubmitting = useRef(false);

  // Extract base language for practice mode
  const getPracticeLanguage = () => {
    if (!isPractice) return 'English';
    const clean = id.replace('practice-', '').replace(/-[0-9]+m$/, '').replace(/-free$/, '');
    if (clean.toLowerCase().includes('arabic')) return 'Arabic';
    if (clean.toLowerCase().includes('urdu')) return 'Urdu';
    return 'English';
  };

  const loadDrill = (mins) => {
    const lang = getPracticeLanguage();
    const duration = mins !== undefined ? mins : drillMinutes;
    setDrillMinutes(duration);

    // Initial sections buffer
    const initialSections = getDrillInitialSections(lang, duration);
    setSections(initialSections);
    setInputs(Array(initialSections.length).fill(''));
    setCurrentSectionIdx(0);

    const initialSecs = duration > 0 ? duration * 60 : null;
    setTimeLeft(initialSecs);
    setTotalTimeSecs(initialSecs);
    setStartTime(null);
    setEndTime(null);
    setCompleted(false);
    isSubmitting.current = false;

    // Update URL query param cleanly without reloading
    if (duration > 0) {
      setSearchParams({ duration: duration.toString() });
    } else {
      setSearchParams({ duration: 'free' });
    }

    setTimeout(() => {
      inputRef.current?.focus();
      setIsFocused(true);
    }, 50);
  };

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    
    const initializeArena = async () => {
      if (isPractice) {
        const initialMins = parseDrillParams(id, searchParams);
        loadDrill(initialMins);
      } else {
        const tournament = await dbService.getTournament(id);
        let textSections = [];
        if (tournament && tournament.customText) {
          textSections = tournament.customText;
        } else if (tournament) {
          textSections = generateCompetitionText(tournament.type);
        } else {
          navigate('/dashboard');
          return;
        }
        
        if (tournament && tournament.timeLimit > 0) {
          const limitSecs = tournament.timeLimit * 60;
          setTimeLeft(limitSecs);
          setTotalTimeSecs(limitSecs);
        }
        setSections(textSections);
        setInputs(Array(textSections.length).fill(''));
      }
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
    soundEngine.playClick();
    const val = e.target.value;
    const currentTarget = sections[currentSectionIdx]?.text || '';
    
    // Prevent typing beyond the text length
    if (val.length > currentTarget.length) return;

    const newInputs = [...inputs];
    newInputs[currentSectionIdx] = val;
    setInputs(newInputs);

    // Auto-advance if reached the end of the current text
    if (val.length === currentTarget.length) {
      // In practice mode or timed drills: continuously stream paragraphs until timer runs out!
      if (isPractice) {
        if (currentSectionIdx < sections.length - 1) {
          setTimeout(() => {
            setCurrentSectionIdx(prev => prev + 1);
          }, 120);
        } else {
          // Seamlessly append next paragraph from generator so the user NEVER runs out of words!
          const lang = currentSection.language || getPracticeLanguage();
          const nextP = getNextDrillParagraph(lang);
          setSections(prev => [...prev, nextP.section]);
          setInputs(prev => [...prev, '']);
          setTimeout(() => {
            setCurrentSectionIdx(prev => prev + 1);
          }, 120);
        }
      } else {
        // Tournament mode with fixed sections
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
    }
  };

  // Smooth auto-scrolling to keep active line centered
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

  // Countdown timer effect
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
    } else if (isPractice) {
      const lang = currentSection.language || getPracticeLanguage();
      const nextP = getNextDrillParagraph(lang);
      setSections(prev => [...prev, nextP.section]);
      setInputs(prev => [...prev, '']);
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
    soundEngine.playVictory();
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
      for (let i = 0; i < secChars; i++) {
        if (secInput[i] !== target[i]) secErrs++;
      }
      totalErrs += secErrs;

      // Section Metrics
      const secGrossWpm = timeMins > 0 ? (secChars / 5) / timeMins : 0;
      const secNetWpm = timeMins > 0 ? Math.max(0, secGrossWpm - (secErrs / timeMins)) : 0;
      const secAccuracy = secChars === 0 ? 0 : Math.max(0, ((secChars - secErrs) / secChars) * 100);
      const secProgress = targetChars === 0 ? 0 : Math.min(100, (secChars / targetChars) * 100);
      
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
      grossWpm: Math.round(grossWpm),
      accuracy: Math.round(overallAccuracy), 
      chars: totalChars,
      errors: totalErrs,
      wordsTyped: Math.round(totalChars / 5),
      progress: Math.round(overallProgress),
      finalScore: totalScore,
      sectionDetails: sectionStats,
      timeElapsedSecs: Math.round(timeMs / 1000)
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
        sectionDetails: stats.sectionDetails,
        drillMinutes: isPractice ? drillMinutes : undefined
      });
    } catch (err) {
      console.error('Failed to save result:', err);
    }

    // Only auto-redirect for tournaments; practice mode keeps player on drill summary!
    if (!isPractice) {
      setTimeout(() => {
        navigate(`/leaderboard/${id}`);
      }, 2000);
    }
  };
  
  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) {
      setCompleted(true);
      setEndTime(Date.now());
      if (!isPractice) {
        saveResult(Date.now());
      } else {
        navigate(`/leaderboard/${id}`);
      }
    }
  }, isPractice);
  
  if (sections.length === 0) return <div className="page-wrapper" style={{ paddingTop: '4rem', textAlign: 'center' }}>Loading Typing Arena...</div>;

  // Active drill preset details
  const activePreset = getDrillPreset(drillMinutes);

  if (completed) {
    const stats = calculateStats(endTime || Date.now());
    const elapsedMinutes = Math.floor(stats.timeElapsedSecs / 60);
    const elapsedSeconds = stats.timeElapsedSecs % 60;
    const formattedDuration = `${elapsedMinutes}m ${elapsedSeconds.toString().padStart(2, '0')}s`;

    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        <Card style={{ textAlign: 'center', padding: '3rem 2.5rem', maxWidth: '640px', width: '100%', boxShadow: 'var(--glass-shadow)' }}>
          <Trophy size={60} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <span>{activePreset.icon}</span> {isPractice ? `${activePreset.label} Typing Drill` : 'Tournament Match'}
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.35rem', fontWeight: '800' }}>
            {isPractice ? 'Drill Complete!' : 'Competition Complete!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Great endurance and focus, {studentId}!
          </p>
          
          {/* Main Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--surface-2)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1.1 }}>
                {stats.wpm}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: '700' }}>
                NET WPM
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#10b981', lineHeight: 1.1 }}>
                {stats.accuracy}%
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: '700' }}>
                ACCURACY
              </div>
            </div>
          </div>

          {/* Secondary Detailed Breakdown */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '0.75rem', 
            marginBottom: '2rem', 
            background: 'var(--surface-2)', 
            padding: '1rem', 
            borderRadius: '10px', 
            border: '1px solid var(--border)' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CHARS TYPED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.chars}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>WORDS TYPED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.wordsTyped}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TIME TYPED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formattedDuration}</div>
            </div>
          </div>

          {/* Drill Options for Practice Mode */}
          {isPractice ? (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  Try another timed drill duration:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1, 2, 5, 10, 15, 30].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => loadDrill(mins)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: drillMinutes === mins ? 'var(--primary)' : 'var(--surface-2)',
                        color: drillMinutes === mins ? '#ffffff' : 'var(--text-primary)',
                        border: '1px solid ' + (drillMinutes === mins ? 'var(--primary)' : 'var(--border)'),
                        cursor: 'pointer'
                      }}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button onClick={() => loadDrill(drillMinutes)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                  <RotateCcw size={16} /> Restart {activePreset.label} Drill
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Home size={16} /> Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Redirecting to tournament leaderboard...</p>
          )}
        </Card>
      </div>
    );
  }

  const currentSection = sections[currentSectionIdx] || {};
  const targetText = currentSection.text || '';
  const currentInput = inputs[currentSectionIdx] || '';
  const inputLength = currentInput.length;
  
  const isRtl = currentSection.dir === 'rtl' || 
    (currentSection.language && (
      currentSection.language.toLowerCase() === 'arabic' || 
      currentSection.language.toLowerCase() === 'urdu'
    ));
  const isUrdu = currentSection.language && currentSection.language.toLowerCase() === 'urdu';

  const fontStack = isUrdu 
    ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', 'Segoe UI', Tahoma, sans-serif" 
    : isRtl 
      ? "'Segoe UI', 'Noto Sans Arabic', Tahoma, 'Traditional Arabic', sans-serif" 
      : 'var(--font-mono)';

  // Cumulative Real-Time HUD Metrics across all sections
  const elapsedSecs = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 1000)) : 0;
  const elapsedMins = elapsedSecs / 60;
  
  let cumulativeChars = 0;
  let cumulativeErrors = 0;
  inputs.forEach((inp, idx) => {
    const text = inp || '';
    cumulativeChars += text.length;
    const tgt = sections[idx]?.text || '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== tgt[i]) cumulativeErrors++;
    }
  });

  const liveNetWpm = elapsedMins > 0 
    ? Math.round(Math.max(0, (cumulativeChars / 5) / elapsedMins - (cumulativeErrors / elapsedMins))) 
    : 0;
  const liveAccuracy = cumulativeChars > 0 
    ? Math.round(Math.max(0, ((cumulativeChars - cumulativeErrors) / cumulativeChars) * 100)) 
    : 100;
  const sectionProgress = targetText.length > 0 
    ? Math.min(100, Math.round((currentInput.length / targetText.length) * 100)) 
    : 0;

  // RTL Cursive Renderer
  const renderRtlText = () => {
    const tokens = [];
    const regex = /(\S+|\s+)/g;
    let match;
    while ((match = regex.exec(targetText)) !== null) {
      tokens.push({
        text: match[0],
        isSpace: /^\s+$/.test(match[0]),
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return tokens.map((token, idx) => {
      if (token.isSpace) {
        return token.text.split('').map((ch, chIdx) => {
          const globalIdx = token.start + chIdx;
          const isSpacePassed = globalIdx < inputLength;
          const isSpaceActive = globalIdx === inputLength;

          if (ch === '\n') {
            return (
              <br 
                key={'br_' + globalIdx}
                ref={isSpaceActive ? activeCharRef : null}
              />
            );
          }

          let spaceBg = 'transparent';
          if (isSpacePassed) {
            const userTypedSpace = currentInput[globalIdx];
            if (userTypedSpace !== ch) {
              spaceBg = 'rgba(239, 68, 68, 0.4)';
            }
          }
          return (
            <span 
              key={'sp_' + globalIdx}
              ref={isSpaceActive ? activeCharRef : null}
              style={{ 
                background: spaceBg,
                display: 'inline',
                whiteSpace: 'pre-wrap',
                borderRadius: '2px',
                borderBottom: isSpaceActive ? '2.5px solid var(--accent-primary)' : 'none'
              }}
            >
              {' '}
            </span>
          );
        });
      }

      // Word token
      const isWordCompleted = token.end <= inputLength;
      const isWordActive = token.start <= inputLength && inputLength < token.end;

      if (isWordCompleted) {
        const userWord = currentInput.slice(token.start, token.end);
        const isCorrect = userWord === token.text;
        return (
          <span
            key={'w_' + idx}
            style={{
              color: isCorrect ? 'var(--success)' : 'var(--error)',
              textDecoration: isCorrect ? 'none' : 'underline wavy var(--error)',
              display: 'inline-block',
              whiteSpace: 'nowrap',
              transition: 'color 0.1s ease'
            }}
          >
            {token.text}
          </span>
        );
      }

      if (isWordActive) {
        const typedCount = Math.max(0, inputLength - token.start);
        const typedSlice = token.text.slice(0, typedCount);
        const remainingSlice = token.text.slice(typedCount);
        const userTypedSlice = currentInput.slice(token.start, inputLength);
        const isSliceCorrect = userTypedSlice === typedSlice;

        return (
          <span
            key={'w_' + idx}
            ref={activeCharRef}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              padding: '0.1rem 0.35rem',
              margin: '0 -0.1rem',
              background: 'var(--surface-2)',
              borderBottom: '2.5px solid var(--accent-primary)',
              borderRadius: '4px',
              boxShadow: '0 0 10px rgba(79, 70, 229, 0.25)'
            }}
          >
            <span style={{ color: isSliceCorrect ? 'var(--success)' : 'var(--error)' }}>
              {typedSlice}
            </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
              {remainingSlice}
            </span>
          </span>
        );
      }

      // Upcoming word
      return (
        <span
          key={'w_' + idx}
          style={{
            color: 'var(--text-tertiary)',
            display: 'inline-block',
            whiteSpace: 'nowrap'
          }}
        >
          {token.text}
        </span>
      );
    });
  };

  // LTR Character-by-character Renderer
  const renderLtrText = () => {
    const tokens = [];
    const regex = /(\S+|\s+)/g;
    let match;
    while ((match = regex.exec(targetText)) !== null) {
      tokens.push({
        text: match[0],
        isSpace: /^\s+$/.test(match[0]),
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return tokens.map((token, tIdx) => {
      if (token.isSpace) {
        return token.text.split('').map((ch, chIdx) => {
          const globalIdx = token.start + chIdx;
          const isTyped = globalIdx < inputLength;
          const isCurrent = globalIdx === inputLength;

          if (ch === '\n') {
            return (
              <br 
                key={`br_${globalIdx}`} 
                ref={isCurrent ? activeCharRef : null} 
              />
            );
          }

          let bg = 'transparent';
          if (isTyped) {
            const isCorrect = currentInput[globalIdx] === ch;
            if (!isCorrect) {
              bg = 'rgba(239, 68, 68, 0.4)';
            }
          }

          return (
            <span
              key={`sp_${globalIdx}`}
              ref={isCurrent ? activeCharRef : null}
              style={{
                display: 'inline',
                whiteSpace: 'pre-wrap',
                background: bg,
                borderRadius: '2px',
                borderBottom: isCurrent ? '2.5px solid var(--accent-primary)' : 'none',
                position: 'relative'
              }}
            >
              {' '}
            </span>
          );
        });
      }

      // Word token
      return (
        <span
          key={`w_${tIdx}`}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap'
          }}
        >
          {token.text.split('').map((char, chIdx) => {
            const globalIdx = token.start + chIdx;
            const isTyped = globalIdx < inputLength;
            const isCurrent = globalIdx === inputLength;

            let color = 'var(--text-tertiary)';
            let bg = 'transparent';

            if (isTyped) {
              const isCorrect = currentInput[globalIdx] === char;
              color = isCorrect ? 'var(--success)' : 'var(--error)';
              if (!isCorrect) {
                bg = 'rgba(239, 68, 68, 0.2)';
              }
            } else if (isCurrent) {
              color = 'var(--text-primary)';
            }

            return (
              <span
                key={`ch_${globalIdx}`}
                ref={isCurrent ? activeCharRef : null}
                style={{
                  color,
                  background: bg,
                  position: 'relative',
                  display: 'inline',
                  borderRadius: bg !== 'transparent' ? '3px' : '0',
                  fontWeight: isCurrent ? '700' : '400',
                  borderBottom: isCurrent ? '2.5px solid var(--accent-primary)' : 'none',
                  transition: 'color 0.05s ease, background 0.05s ease'
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="container" style={{ maxWidth: '980px', width: '100%', paddingBottom: '3rem', paddingTop: '1.25rem' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Arena</span> 
            <span style={{ fontSize: '0.95rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              {isPractice ? `${activePreset.label} Drill` : 'Typing Tournament'}
            </span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-2)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Target size={15} className="text-gradient" /> Section {currentSectionIdx + 1} of {sections.length}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-2)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Zap size={15} className="text-gradient" /> {currentSection.language || 'English'}
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
              <Clock size={15} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      {/* Practice Drill Switcher Toolbar (1m, 2m, 5m, 10m, 15m, 30m, Untimed) */}
      {isPractice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} color="var(--primary)" /> Drill:
          </span>
          {TYPING_DRILL_PRESETS.map(preset => {
            const isActive = drillMinutes === preset.durationMinutes;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadDrill(preset.durationMinutes)}
                style={{
                  background: isActive ? 'var(--primary)' : 'var(--surface-2)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title={preset.title}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}

          {startTime && !completed && (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                marginLeft: 'auto',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Finish Early
            </button>
          )}
        </div>
      )}

      {/* Real-Time Live Performance Ribbon */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1rem' 
      }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Zap size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>NET SPEED</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {liveNetWpm} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>WPM</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Activity size={18} style={{ color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ACCURACY</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              {liveAccuracy}%
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CheckCircle2 size={18} style={{ color: '#eab308' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>SECTION PROGRESS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {sectionProgress}% <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>({currentInput.length}/{targetText.length})</span>
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
          border: isFocused ? '1px solid var(--primary)' : '1px solid var(--border)',
          transition: 'border-color 0.2s ease',
          outline: 'none'
        }}
        onClick={() => {
          inputRef.current?.focus();
          setIsFocused(true);
        }}
      >
        {/* Auto-Capturing Textarea (Accessible on both Desktop & Mobile keyboards) */}
        <textarea 
          ref={inputRef}
          value={currentInput}
          onChange={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          dir={isRtl ? 'rtl' : 'ltr'}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          inputMode="text"
          style={{
            position: 'absolute',
            opacity: 0.001,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'text',
            zIndex: 10,
            resize: 'none',
            border: 'none',
            outline: 'none',
            pointerEvents: 'auto'
          }}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        />

        {!isFocused && (
          <div style={{
            position: 'absolute',
            bottom: '0.4rem',
            right: '0.75rem',
            zIndex: 11,
            fontSize: '0.75rem',
            color: 'var(--primary-text)',
            background: 'var(--surface)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            pointerEvents: 'none'
          }}>
            Tap card to type
          </div>
        )}

        {/* Scrollable Text Viewport (Auto-centered on active word) */}
        <div 
          ref={containerRef}
          style={{ 
            fontSize: isRtl ? (isUrdu ? '1.85rem' : '1.75rem') : '1.45rem', 
            lineHeight: isRtl ? (isUrdu ? '3.5rem' : '3.2rem') : '2.5rem', 
            letterSpacing: isRtl ? 'normal' : '0.02em',
            direction: isRtl ? 'rtl' : 'ltr',
            textAlign: isRtl ? 'right' : 'left',
            fontFamily: fontStack,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            height: '230px',
            overflowY: 'hidden',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'scrollTop 0.15s ease',
            padding: '0.25rem 0'
          }}
        >
          {isRtl ? renderRtlText() : renderLtrText()}
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
              <Zap size={16} color="var(--primary)" /> Click or press any key to focus &amp; type
            </div>
          </div>
        )}
      </Card>

      {/* Helper & Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {currentSection.dir === 'rtl' ? (
            <span style={{ color: '#eab308' }}>⚠️ Switch keyboard layout to {currentSection.language}.</span>
          ) : (
            <span>💡 <strong>Tip:</strong> Text auto-advances through paragraphs as you type. Stay focused on rhythm and accuracy.</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {currentSectionIdx > 0 && (
            <Button onClick={handlePrev} variant="secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem' }}>
              Previous Section
            </Button>
          )}

          <Button onClick={handleNext} variant="secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem' }}>
            Next Paragraph <ArrowRight size={15} />
          </Button>

          <Button onClick={handleFinish} style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}>
            Finish Drill
          </Button>
        </div>
      </div>

    </div>
  );
};

export default CompetitionArena;
