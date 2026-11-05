import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2,
  CheckCircle2, XCircle, ArrowRight, Target, Sparkles, AlertCircle
} from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { soundEngine } from '../utils/soundEffects';
import { 
  CATEGORY_DEFINITIONS, 
  getCategoryDefinition, 
  getMapData, 
  getRandomQuestionsForCategory, 
  generateMultipleChoiceOptions 
} from '../utils/svgMapService';
import SvgInteractiveMap from '../components/map/SvgInteractiveMap';

const MapArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || 'PracticeUser';
  const isPractice = (id || '').startsWith('practice-');
  const isSubmitting = useRef(false);
  const containerRef = useRef(null);

  // Tournament / Question state
  const [tournament, setTournament] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Sound & Display
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Practice Category & Mode
  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get('category') || 'india-states';
  const [trainerCategory, setTrainerCategory] = useState(initialCat);
  const [trainerMode, setTrainerMode] = useState('find-on-map'); // 'find-on-map' | 'name-the-place'

  // Question interaction state
  const [feedback, setFeedback] = useState(null); // { ok: boolean, tappedId: string, tappedName: string } | null
  const [showSolution, setShowSolution] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [optionAnswered, setOptionAnswered] = useState(false);

  // Scoring & Timer
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [globalStartTime, setGlobalStartTime] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Determine active category and question type
  const activeCategoryId = tournament?.category || trainerCategory;
  const activeQuestionType = tournament?.questionType || trainerMode;
  const isNameThePlace = activeQuestionType === 'name-the-place';

  // Load vector map data for the category
  const mapData = useMemo(() => {
    return getMapData(activeCategoryId);
  }, [activeCategoryId]);

  const currentCategory = mapData.def;

  // Initialize or reload round
  const loadTrainerRound = useCallback((cat = trainerCategory, mode = trainerMode) => {
    const freshQuestions = getRandomQuestionsForCategory(cat, 10);
    const catDef = getCategoryDefinition(cat);

    setTournament({
      id: `practice-map-${cat}`,
      name: `${catDef.name} Trainer`,
      category: cat,
      questionType: mode
    });
    setQuestions(freshQuestions);
    setCurrentIdx(0);
    setFeedback(null);
    setShowSolution(false);
    setSelectedOptionId(null);
    setOptionAnswered(false);
    setResults([]);
    setCompleted(false);
    isSubmitting.current = false;
    setGlobalStartTime(Date.now());
    setSecondsElapsed(0);
  }, [trainerCategory, trainerMode]);

  useEffect(() => {
    const init = async () => {
      if (isPractice) {
        loadTrainerRound(trainerCategory, trainerMode);
      } else {
        const t = await dbService.getTournament(id);
        setTournament(t);
        if (t?.mapLocations && t.mapLocations.length > 0) {
          // Match tournament locations with vector features by name
          const cat = t.category || 'india-states';
          const md = getMapData(cat);
          const mapped = t.mapLocations.map((loc, idx) => {
            const locName = loc.name || loc.prompt;
            const match = md.targets.find(
              f => f.properties?.name?.toLowerCase() === locName.toLowerCase()
            );
            return match || {
              id: `custom-${idx}`,
              properties: { name: locName }
            };
          });
          setQuestions(mapped);
        } else {
          setQuestions(getRandomQuestionsForCategory(t?.category || 'india-states', 10));
        }
        setGlobalStartTime(Date.now());
      }
    };
    init();
  }, [id, isPractice, loadTrainerRound, trainerCategory, trainerMode]);

  // Elapsed timer ticker
  useEffect(() => {
    if (!completed && globalStartTime) {
      const interval = setInterval(() => {
        setSecondsElapsed(Math.floor((Date.now() - globalStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [completed, globalStartTime]);

  const currentFeature = questions[currentIdx];

  // Generate options for "Name the place" mode
  const currentOptions = useMemo(() => {
    if (!currentFeature || !isNameThePlace) return [];
    return generateMultipleChoiceOptions(currentFeature, mapData.targets);
  }, [currentFeature, isNameThePlace, mapData.targets]);

  const correctCount = results.filter(r => r.ok).length;

  // Anti-cheat hook for competitive tournaments
  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) {
      isSubmitting.current = true;
      setCompleted(true);
      const score = results.filter(r => r.ok).length;
      if (!isPractice) {
        dbService.saveResult(id, {
          studentId,
          score,
          accuracy: Math.round((score / (questions.length || 1)) * 100) || 0,
          timeElapsed: secondsElapsed,
          mapDetails: results
        }).finally(() => navigate(`/leaderboard/${id}`));
      } else {
        navigate(`/leaderboard/${id}`);
      }
    }
  }, isPractice);

  // --- FEATURE CLICK HANDLER (Find it on the map mode) ---
  const handleFeatureClick = (clickedFeature) => {
    if (showSolution || (feedback && feedback.ok) || !currentFeature) return;

    const targetName = currentFeature.properties?.name?.toLowerCase();
    const clickedName = clickedFeature.properties?.name?.toLowerCase();
    const isCorrect = clickedFeature.id === currentFeature.id || clickedName === targetName;

    if (isCorrect) {
      soundEngine.playBoxComplete();
      setFeedback({
        ok: true,
        tappedId: clickedFeature.id,
        tappedName: clickedFeature.properties.name
      });
      setResults(prev => [...prev, {
        name: currentFeature.properties.name,
        ok: true,
        fact: currentFeature.properties?.fact || '',
        subtitle: currentFeature.properties?.subtitle || ''
      }]);
    } else {
      soundEngine.playConflict();
      setFeedback({
        ok: false,
        tappedId: clickedFeature.id,
        tappedName: clickedFeature.properties.name
      });
    }
  };

  // --- "SHOW ME" BUTTON HANDLER ---
  const handleShowMe = () => {
    if (showSolution || !currentFeature) return;
    setShowSolution(true);
    setFeedback({
      ok: false,
      tappedId: null,
      tappedName: 'skipped'
    });
    setResults(prev => [...prev, {
      name: currentFeature.properties.name,
      ok: false,
      fact: currentFeature.properties?.fact || '',
      subtitle: currentFeature.properties?.subtitle || ''
    }]);
  };

  // --- OPTION CLICK HANDLER (Name the place mode) ---
  const handleOptionSelect = (option) => {
    if (optionAnswered || !currentFeature) return;
    setOptionAnswered(true);
    setSelectedOptionId(option.id);

    const isCorrect = option.isCorrect || option.name === currentFeature.properties.name;

    if (isCorrect) {
      soundEngine.playBoxComplete();
    } else {
      soundEngine.playConflict();
    }

    setFeedback({
      ok: isCorrect,
      tappedId: currentFeature.id,
      tappedName: option.name
    });

    const newResults = [...results, {
      name: currentFeature.properties.name,
      ok: isCorrect,
      fact: currentFeature.properties?.fact || '',
      subtitle: currentFeature.properties?.subtitle || ''
    }];
    setResults(newResults);

    // Auto-advance
    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        finishArena(newResults);
      } else {
        setCurrentIdx(prev => prev + 1);
        setFeedback(null);
        setSelectedOptionId(null);
        setOptionAnswered(false);
        setShowSolution(false);
      }
    }, isCorrect ? 900 : 1600);
  };

  // --- ADVANCE TO NEXT QUESTION ---
  const handleNextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      finishArena(results);
    } else {
      setCurrentIdx(prev => prev + 1);
      setFeedback(null);
      setSelectedOptionId(null);
      setOptionAnswered(false);
      setShowSolution(false);
    }
  };

  // --- FINISH ARENA ---
  const finishArena = async (finalResults) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setCompleted(true);
    soundEngine.playVictory();

    const score = finalResults.filter(r => r.ok).length;
    const total = finalResults.length || 1;

    if (!isPractice) {
      try {
        await dbService.saveResult(id, {
          studentId,
          score,
          accuracy: Math.round((score / total) * 100),
          timeElapsed: secondsElapsed,
          mapDetails: finalResults
        });
      } catch (err) {
        console.error('Failed to save map result:', err);
      }
    }
  };

  // Format time MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!tournament || questions.length === 0) {
    return (
      <div className="page-wrapper" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        Loading Map Study Arena...
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (completed) {
    const score = results.filter(r => r.ok).length;
    const accuracy = Math.round((score / (questions.length || 1)) * 100);

    return (
      <div className="container" style={{ maxWidth: '850px', margin: '0 auto', paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <Trophy size={60} color="#047857" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.4rem', fontWeight: '800' }}>
            Map Round Complete!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Great effort in geographical identification, {studentId}!
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: '#047857' }}>
                {score} / {questions.length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: '600' }}>
                Places Identified
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: '#10b981' }}>
                {accuracy}%
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: '600' }}>
                Accuracy
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: 'var(--primary)' }}>
                {formatTime(secondsElapsed)}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: '600' }}>
                Time Taken
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {isPractice && (
              <Button 
                onClick={() => loadTrainerRound(trainerCategory, trainerMode)} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#047857', borderColor: '#047857' }}
              >
                <RotateCcw size={18} /> Practise Again (New Questions)
              </Button>
            )}
            <Button onClick={() => navigate('/dashboard')} variant="secondary">
              Back to Dashboard
            </Button>
            {!isPractice && (
              <Button onClick={() => navigate(`/leaderboard/${id}`)}>
                View Leaderboard
              </Button>
            )}
          </div>
        </Card>

        {/* Places Review & Knowledge Cards Breakdown */}
        {results.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} color="#047857" /> Places Review &amp; Knowledge Cards
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {results.map((res, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${res.ok ? '#10b981' : '#ef4444'}`,
                    borderRadius: '10px',
                    padding: '1rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {res.name}
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      background: res.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: res.ok ? '#10b981' : '#ef4444'
                    }}>
                      {res.ok ? '✓ Correct' : '✗ Missed'}
                    </span>
                  </div>
                  {res.subtitle && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '0.4rem' }}>
                      {res.subtitle}
                    </div>
                  )}
                  {res.fact && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45', background: 'var(--surface-2)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                      💡 {res.fact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isAnswered = (feedback && feedback.ok) || showSolution;

  return (
    <div 
      ref={containerRef}
      className="container" 
      style={{ 
        maxWidth: (mapData.kind === 'india' || mapData.kind === 'india-points') ? '720px' : '960px', 
        margin: '0 auto', 
        paddingTop: '1.25rem', 
        paddingBottom: '3rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Header matching SIBAQ Tracker UI */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{currentCategory.icon}</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Question {currentIdx + 1} of {questions.length} • {correctCount} right
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={toggleSound}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.4rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.4rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.2rem', 
            fontWeight: '800', 
            color: 'var(--text-primary)'
          }}>
            {formatTime(secondsElapsed)}
          </div>
        </div>
      </div>

      {/* Practice Category & Mode Switcher Bar */}
      {isPractice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.85rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--surface)',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Category:
          </span>
          <select
            value={trainerCategory}
            onChange={(e) => {
              setTrainerCategory(e.target.value);
              loadTrainerRound(e.target.value, trainerMode);
            }}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {CATEGORY_DEFINITIONS.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
            Mode:
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => {
                setTrainerMode('find-on-map');
                loadTrainerRound(trainerCategory, 'find-on-map');
              }}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: trainerMode === 'find-on-map' ? '700' : '500',
                background: trainerMode === 'find-on-map' ? '#047857' : 'var(--surface-2)',
                color: trainerMode === 'find-on-map' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (trainerMode === 'find-on-map' ? '#047857' : 'var(--border)'),
                cursor: 'pointer'
              }}
            >
              Find on map
            </button>

            <button
              type="button"
              onClick={() => {
                setTrainerMode('name-the-place');
                loadTrainerRound(trainerCategory, 'name-the-place');
              }}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: trainerMode === 'name-the-place' ? '700' : '500',
                background: trainerMode === 'name-the-place' ? '#047857' : 'var(--surface-2)',
                color: trainerMode === 'name-the-place' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (trainerMode === 'name-the-place' ? '#047857' : 'var(--border)'),
                cursor: 'pointer'
              }}
            >
              Name the place
            </button>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, boxShadow: 'var(--glass-shadow)' }}>
        
        {/* Question Prompt Header with Status Chip */}
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          minHeight: '64px'
        }}>
          {isNameThePlace ? (
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Which {currentCategory.singular} is highlighted?
              </div>
              {showSolution && currentFeature?.properties?.subtitle && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: '600' }}>
                  {currentFeature.properties.subtitle}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Find this {currentCategory.singular}:
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                {currentFeature?.properties?.name}
              </div>
              {currentFeature?.properties?.subtitle && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: '600' }}>
                  {currentFeature.properties.subtitle}
                </div>
              )}
            </div>
          )}

          {/* SIBAQ Status Chip */}
          {feedback && (
            <div style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: '800',
              whiteSpace: 'nowrap',
              background: feedback.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: feedback.ok ? '#10b981' : '#ef4444',
              border: `1px solid ${feedback.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {feedback.ok
                ? 'Right'
                : !isNameThePlace
                ? feedback.tappedName && feedback.tappedName !== 'skipped'
                  ? `That's ${feedback.tappedName}`
                  : 'Here it is'
                : 'Not quite'}
            </div>
          )}
        </div>

        {/* 100% Vector Self-Contained SVG Map (NO API KEY, NO WATERMARK) */}
        <div style={{ flex: 1, minHeight: '380px', position: 'relative' }}>
          <SvgInteractiveMap
            mapData={mapData}
            targetFeature={currentFeature}
            questionMode={activeQuestionType}
            feedback={feedback}
            showSolution={showSolution}
            onFeatureClick={handleFeatureClick}
            disabled={isAnswered}
          />
        </div>

        {/* Options Grid (Name the place mode) */}
        {isNameThePlace && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {currentOptions.map(option => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = option.id === currentFeature.properties?.name || option.isCorrect;
                
                let btnBg = 'var(--surface)';
                let btnBorder = 'var(--border)';
                let btnColor = 'var(--text-primary)';

                if (optionAnswered) {
                  if (isCorrect) {
                    btnBg = 'rgba(16, 185, 129, 0.15)';
                    btnBorder = '#10b981';
                    btnColor = '#10b981';
                  } else if (isSelected && !isCorrect) {
                    btnBg = 'rgba(239, 68, 68, 0.15)';
                    btnBorder = '#ef4444';
                    btnColor = '#ef4444';
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option)}
                    disabled={optionAnswered}
                    style={{
                      background: btnBg,
                      border: `1.5px solid ${btnBorder}`,
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: btnColor,
                      cursor: optionAnswered ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{option.name}</span>
                    {optionAnswered && isCorrect && <CheckCircle2 size={18} color="#10b981" />}
                    {optionAnswered && isSelected && !isCorrect && <XCircle size={18} color="#ef4444" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions (Show Me / Next / Stop) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          {isAnswered ? (
            <Button
              onClick={handleNextQuestion}
              style={{
                flex: 1,
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: '800',
                background: '#047857',
                borderColor: '#047857',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
              <ArrowRight size={18} />
            </Button>
          ) : (
            !isNameThePlace && (
              <Button
                variant="secondary"
                onClick={handleShowMe}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: '700'
                }}
              >
                Show me
              </Button>
            )
          )}

          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.85rem 1.25rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}
          >
            Stop
          </Button>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-tertiary)',
          margin: '0.75rem 0 0'
        }}>
          Pinch or scroll to zoom, drag to move the map.
        </p>
      </Card>
    </div>
  );
};

export default MapArena;
