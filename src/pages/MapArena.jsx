import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Trophy, MapPin, Navigation, Lightbulb, Sparkles, 
  Volume2, VolumeX, RotateCcw, CheckCircle2, XCircle, Target, ArrowRight,
  Maximize2, Minimize2, Eye, Compass, HelpCircle, Layers, Check, X
} from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MAP_STUDY_CATEGORIES, 
  getPlacesByCategory, 
  generateMultipleChoiceOptions,
  getRandomTrainerLocations 
} from '../utils/mapCategoriesData';
import { soundEngine } from '../utils/soundEffects';

// High-contrast distinct marker for student's pin
const userGuessIcon = L.divIcon({
  className: 'user-guess-pin',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
      <div style="background: #ef4444; color: #ffffff; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 1.5px solid #ffffff; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
        Your Pin
      </div>
      <div style="width: 22px; height: 22px; background: #ef4444; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 8px rgba(0,0,0,0.45);"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

// "Here it is" badge marker shown when player clicks "Show me" or reveals answer
const hereItIsIcon = (label = "Here it is") => L.divIcon({
  className: 'here-it-is-pin',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
      <div style="background: #047857; color: #ffffff; padding: 3px 9px; border-radius: 12px; font-size: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.35); border: 1.5px solid #ffffff; margin-bottom: 3px; letter-spacing: 0.02em;">
        ${label}
      </div>
      <div style="width: 22px; height: 22px; background: #047857; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 8px rgba(0,0,0,0.45);"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

// Accurate Haversine distance formula (in km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate precision tier & points
const calculatePrecisionRating = (distance, radiusKm) => {
  if (distance <= 60) {
    return { tier: 'bullseye', label: 'Bullseye! 🎯', points: 1000, color: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (distance <= Math.max(250, radiusKm * 0.4)) {
    return { tier: 'gold', label: 'Gold Spot! 🥇', points: 800, color: '#eab308', badgeBg: 'rgba(234, 179, 8, 0.15)' };
  }
  if (distance <= radiusKm) {
    return { tier: 'bronze', label: 'Target Zone! 🥉', points: 500, color: '#047857', badgeBg: 'rgba(4, 120, 87, 0.15)' };
  }
  return { tier: 'miss', label: 'Missed Zone', points: 0, color: '#ef4444', badgeBg: 'rgba(239, 68, 68, 0.15)' };
};

// Geodesic shortest path calculation
const getShortestPolylinePositions = (userPos, targetLat, targetLng) => {
  if (!userPos) return [];
  const uLat = userPos.lat;
  const uLng = userPos.lng;
  let tLng = targetLng;
  const diff = tLng - uLng;
  if (diff > 180) tLng -= 360;
  if (diff < -180) tLng += 360;
  return [
    [uLat, uLng],
    [targetLat, tLng]
  ];
};

const LocationMarker = ({ position, setPosition, readOnly }) => {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        soundEngine.playClick();
        const wrapped = e.latlng.wrap();
        setPosition(wrapped);
      }
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={userGuessIcon}>
      <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
        📍 Your Pin: [{position.lat.toFixed(2)}°, {position.lng.toFixed(2)}°]
      </Tooltip>
    </Marker>
  );
};

// Map camera controller that zooms in during feedback or highlight
const MapCameraController = ({ targetPos, showSolution, isHighlightMode, currentIdx }) => {
  const map = useMap();

  useEffect(() => {
    if (isHighlightMode && targetPos) {
      // In "Name the place" mode, automatically zoom to frame the highlighted region
      map.flyTo([targetPos.lat, targetPos.lng], 5, { duration: 1.0 });
    } else if (showSolution && targetPos) {
      // When "Show me" is clicked in "Find it on the map" mode
      map.flyTo([targetPos.lat, targetPos.lng], 5, { duration: 1.0 });
    } else if (!isHighlightMode && !showSolution) {
      // Reset view to global on next question
      map.flyTo([20, 0], 2, { duration: 0.8 });
    }
  }, [targetPos, showSolution, isHighlightMode, currentIdx, map]);

  return null;
};

// In-map custom control buttons (Zoom In, Zoom Out, Fullscreen)
const MapControlsOverlay = ({ onZoomIn, onZoomOut, onToggleFullscreen, isFullscreen }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '8px',
      padding: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      border: '1px solid var(--border)'
    }}>
      <button
        type="button"
        onClick={onZoomIn}
        style={{
          width: '32px', height: '32px', background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 'bold', color: '#1f2937', cursor: 'pointer',
          borderRadius: '4px'
        }}
        title="Zoom in"
      >
        +
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        style={{
          width: '32px', height: '32px', background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 'bold', color: '#1f2937', cursor: 'pointer',
          borderRadius: '4px'
        }}
        title="Zoom out"
      >
        &minus;
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        style={{
          width: '32px', height: '32px', background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1f2937', cursor: 'pointer', borderRadius: '4px'
        }}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
};

const MapArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || 'PracticeUser';
  const isPractice = id.startsWith('practice-');
  const isSubmitting = useRef(false);
  const mapContainerRef = useRef(null);

  // Tournament / Set State
  const [tournament, setTournament] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Practice Trainer State
  const [trainerCategory, setTrainerCategory] = useState('india-states');
  const [trainerMode, setTrainerMode] = useState('find-on-map'); // 'find-on-map' | 'name-the-place'

  // Gameplay Mode States
  const [showSolution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [optionAnswered, setOptionAnswered] = useState(false);
  
  // Results and Scoring
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
      mapContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const loadTrainerRound = (cat = trainerCategory, mode = trainerMode) => {
    const locations = getRandomTrainerLocations(cat, mode, 10);
    const catObj = MAP_STUDY_CATEGORIES.find(c => c.id === cat);
    setTournament({
      id: `practice-map-${cat}`,
      name: `${catObj?.name || 'Map Study'} Trainer`,
      category: cat,
      questionType: mode,
      mapLocations: locations
    });
    setCurrentIdx(0);
    setMarkerPosition(null);
    setFeedback(null);
    setShowSolution(false);
    setSelectedOptionId(null);
    setOptionAnswered(false);
    setResults([]);
    setCompleted(false);
    isSubmitting.current = false;
    setGlobalStartTime(Date.now());
    setSecondsElapsed(0);
  };

  useEffect(() => {
    const fetchT = async () => {
      if (isPractice) {
        loadTrainerRound(trainerCategory, trainerMode);
      } else {
        const t = await dbService.getTournament(id);
        setTournament(t);
        setGlobalStartTime(Date.now());
      }
    };
    fetchT();
  }, [id]);

  // Elapsed timer ticker
  useEffect(() => {
    if (!completed && globalStartTime) {
      const interval = setInterval(() => {
        setSecondsElapsed(Math.floor((Date.now() - globalStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [completed, globalStartTime]);

  const locations = tournament?.mapLocations || [];
  const currentLoc = locations[currentIdx];
  
  // Determine if active question is "name-the-place" or "find-on-map"
  const activeQuestionType = currentLoc?.questionType || tournament?.questionType || trainerMode;
  const isNameThePlace = activeQuestionType === 'name-the-place';

  // Category metadata
  const currentCategory = useMemo(() => {
    const catId = currentLoc?.categoryId || tournament?.category || trainerCategory;
    return MAP_STUDY_CATEGORIES.find(c => c.id === catId) || MAP_STUDY_CATEGORIES[0];
  }, [currentLoc, tournament, trainerCategory]);

  // Generate or retrieve options for "Name the place" mode
  const currentOptions = useMemo(() => {
    if (!currentLoc) return [];
    if (currentLoc.options && currentLoc.options.length > 0) return currentLoc.options;
    return generateMultipleChoiceOptions(currentLoc, currentLoc.categoryId || currentCategory.id);
  }, [currentLoc, currentCategory]);

  const correctCount = results.filter(r => r.isCorrect).length;

  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) {
      isSubmitting.current = true;
      try {
        localStorage.removeItem(`started_${id}_${studentId}`);
      } catch (e) {}

      setCompleted(true);
      const score = results.filter(r => r.isCorrect).length;

      if (!isPractice) {
        dbService.saveResult(id, {
          studentId,
          score,
          accuracy: Math.round((score / (locations.length || 1)) * 100) || 0,
          timeElapsed: secondsElapsed,
          mapDetails: results
        }).then(() => {
          navigate(`/leaderboard/${id}`);
        }).catch(err => {
          console.error('Failed to save map anti-cheat result:', err);
          navigate(`/leaderboard/${id}`);
        });
      } else {
        navigate(`/leaderboard/${id}`);
      }
    }
  }, isPractice);

  if (!tournament) return <div className="page-wrapper" style={{ paddingTop: '4rem', textAlign: 'center' }}>Loading Map Study Arena...</div>;

  // --- SUBMIT PIN GUESS (Find it on the map mode) ---
  const handleSpotSubmit = () => {
    if (!markerPosition || !currentLoc) return;
    
    const distance = getDistance(markerPosition.lat, markerPosition.lng, currentLoc.lat, currentLoc.lng);
    const isCorrect = distance <= (currentLoc.radiusKm || 200);
    const rating = calculatePrecisionRating(distance, currentLoc.radiusKm || 200);

    if (isCorrect) {
      soundEngine.playBoxComplete();
    } else {
      soundEngine.playConflict();
    }
    
    setFeedback({
      distance: Math.round(distance),
      isCorrect,
      rating,
      targetLat: currentLoc.lat,
      targetLng: currentLoc.lng,
      radiusKm: currentLoc.radiusKm || 200,
      userPos: markerPosition
    });
  };

  // --- SHOW ME (Reveals the target location with "Here it is" badge) ---
  const handleShowMe = () => {
    if (!currentLoc) return;
    soundEngine.playClick();
    setShowSolution(true);
    setFeedback({
      distance: 0,
      isCorrect: false,
      rating: { tier: 'revealed', label: 'Revealed', color: '#047857', badgeBg: 'rgba(4, 120, 87, 0.15)' },
      targetLat: currentLoc.lat,
      targetLng: currentLoc.lng,
      radiusKm: currentLoc.radiusKm || 200,
      userPos: null
    });
  };

  // --- SELECT OPTION (Name the place mode) ---
  const handleSelectOption = (option) => {
    if (optionAnswered || !currentLoc) return;
    setOptionAnswered(true);
    setSelectedOptionId(option.id);

    const isCorrect = option.id === currentLoc.id || option.isCorrect;

    if (isCorrect) {
      soundEngine.playBoxComplete();
    } else {
      soundEngine.playConflict();
    }

    const detail = {
      prompt: currentLoc.name || currentLoc.prompt,
      userAnswer: option.name,
      correctAnswer: currentLoc.name || currentLoc.prompt,
      isCorrect,
      fact: currentLoc.fact || ''
    };

    const newResults = [...results, detail];
    setResults(newResults);

    // Auto-advance after brief pause
    setTimeout(() => {
      if (currentIdx + 1 >= locations.length) {
        finishArena(newResults);
      } else {
        setCurrentIdx(prev => prev + 1);
        setSelectedOptionId(null);
        setOptionAnswered(false);
      }
    }, isCorrect ? 900 : 1600);
  };

  // --- ADVANCE TO NEXT QUESTION ---
  const handleNextQuestion = () => {
    const detail = {
      prompt: currentLoc.name || currentLoc.prompt,
      userLat: markerPosition?.lat || null,
      userLng: markerPosition?.lng || null,
      targetLat: currentLoc.lat,
      targetLng: currentLoc.lng,
      distanceKm: feedback?.distance || 0,
      isCorrect: feedback?.isCorrect || false,
      rating: feedback?.rating || null,
      fact: currentLoc.fact || ''
    };

    const newResults = [...results, detail];
    
    if (currentIdx + 1 >= locations.length) {
      finishArena(newResults);
    } else {
      setResults(newResults);
      setCurrentIdx(currentIdx + 1);
      setMarkerPosition(null);
      setFeedback(null);
      setShowSolution(false);
      setSelectedOptionId(null);
      setOptionAnswered(false);
    }
  };

  const finishArena = async (finalResults) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      localStorage.removeItem(`started_${id}_${studentId}`);
    } catch (e) {}

    setResults(finalResults);
    setCompleted(true);
    soundEngine.playVictory();
    
    const finalScore = finalResults.filter(r => r.isCorrect).length;
    
    if (!isPractice) {
      try {
        await dbService.saveResult(id, {
          studentId,
          score: finalScore,
          accuracy: Math.round((finalScore / locations.length) * 100),
          timeElapsed: secondsElapsed,
          mapDetails: finalResults
        });
      } catch (err) {
        console.error('Failed to save map result:', err);
      }
    }
  };

  // Format timer MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RESULTS / COMPLETION SCREEN ---
  if (completed) {
    const score = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((score / (locations.length || 1)) * 100);

    return (
      <div className="container" style={{ maxWidth: '850px', margin: '0 auto', paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <Trophy size={60} color="#047857" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.4rem', fontWeight: '800' }}>
            Map Study Complete!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Excellent geographical identification, {studentId}!
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: '#047857' }}>
                {score} / {locations.length}
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

        {/* Detailed Review Cards with Facts */}
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} color="#047857" /> Places Review &amp; Study Notes
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((res, i) => (
            <Card 
              key={i} 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: `5px solid ${res.isCorrect ? '#10b981' : '#ef4444'}` 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 0.35rem 0' }}>
                    {i + 1}. {res.prompt}
                  </h4>
                  {res.userAnswer && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Your answer: <strong style={{ color: res.isCorrect ? '#10b981' : '#ef4444' }}>{res.userAnswer}</strong>
                    </div>
                  )}
                  {res.distanceKm > 0 && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Off by <strong>{res.distanceKm.toLocaleString()} km</strong>
                    </div>
                  )}
                </div>

                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.35rem 0.8rem', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  fontWeight: '700',
                  background: res.isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: res.isCorrect ? '#10b981' : '#ef4444',
                  border: `1px solid ${res.isCorrect ? '#10b981' : '#ef4444'}`
                }}>
                  {res.isCorrect ? <Check size={16} /> : <X size={16} />}
                  {res.isCorrect ? 'Correct' : 'Missed'}
                </div>
              </div>

              {res.fact && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                  lineHeight: '1.45',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start'
                }}>
                  <Lightbulb size={18} color="#047857" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Fact: </strong>
                    {res.fact}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      className="container" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 'calc(100vh - 100px)', 
        paddingTop: '1.25rem',
        paddingBottom: '2rem',
        maxWidth: isFullscreen ? '100%' : '980px',
        width: '100%'
      }}
    >
      {/* Top Header Bar matching SIBAQ Tracker Model */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            {tournament.name || currentCategory.name}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.15rem' }}>
            Question {currentIdx + 1} of {locations.length} &bull; <strong style={{ color: '#047857' }}>{correctCount} right</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={toggleSound}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.4rem 0.65rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem'
            }}
            title={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.25rem', 
            fontWeight: '800', 
            color: 'var(--text-primary)',
            letterSpacing: '0.02em'
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
            {MAP_STUDY_CATEGORIES.map(c => (
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

      {/* Main Question Card matching SIBAQ Model */}
      <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, boxShadow: 'var(--glass-shadow)' }}>
        
        {/* Question Header Box */}
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {isNameThePlace ? (
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Which {currentCategory.singular} is highlighted?
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Find this {currentCategory.singular}:
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                {currentLoc?.name || currentLoc?.prompt}
              </div>
            </div>
          )}

          {showSolution && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--error)',
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              Here it is
            </div>
          )}
        </div>

        {/* Leaflet Map Canvas */}
        <div style={{
          flex: 1,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1.5px solid var(--border)',
          position: 'relative',
          minHeight: '380px'
        }}>
          {currentLoc && (
            <MapContainer
              key={`${currentIdx}-${trainerCategory}-${trainerMode}`}
              center={isNameThePlace ? [currentLoc.lat, currentLoc.lng] : (currentCategory.center || [20, 0])}
              zoom={isNameThePlace ? 5 : (currentCategory.defaultZoom || 2)}
              minZoom={2}
              maxBounds={[[-85, -180], [85, 180]]}
              maxBoundsViscosity={1.0}
              worldCopyJump={false}
              zoomControl={false}
              style={{ height: '100%', width: '100%', background: '#dbeafe', minHeight: '380px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap={true}
                bounds={[[-85, -180], [85, 180]]}
              />

              <MapCameraController 
                targetPos={currentLoc ? { lat: currentLoc.lat, lng: currentLoc.lng } : null}
                showSolution={showSolution}
                isHighlightMode={isNameThePlace}
                currentIdx={currentIdx}
              />

              {/* Pin dropper for "Find it on the map" mode */}
              {!isNameThePlace && (
                <LocationMarker 
                  position={markerPosition} 
                  setPosition={setMarkerPosition} 
                  readOnly={!!feedback || showSolution} 
                />
              )}

              {/* In "Name the place" mode: Highlight the target location with focal ring and amber fill (as in SIBAQ) */}
              {isNameThePlace && (
                <>
                  <Circle
                    center={[currentLoc.lat, currentLoc.lng]}
                    radius={(currentLoc.radiusKm || 180) * 1000}
                    pathOptions={{
                      color: '#b45309', // Amber / brown fill as in SIBAQ Tracker
                      fillColor: '#d97706',
                      fillOpacity: 0.55,
                      weight: 3
                    }}
                  />
                  {/* Outer focal pulse circle */}
                  <Circle
                    center={[currentLoc.lat, currentLoc.lng]}
                    radius={(currentLoc.radiusKm || 180) * 1600}
                    pathOptions={{
                      color: '#ef4444', // Red focal ring
                      fillOpacity: 0,
                      weight: 2.5,
                      dashArray: '5, 5'
                    }}
                  />
                </>
              )}

              {/* In "Find it on the map" mode: Reveal target if feedback or "Show me" clicked */}
              {!isNameThePlace && (feedback || showSolution) && (
                <>
                  <Marker 
                    position={[currentLoc.lat, currentLoc.lng]} 
                    icon={hereItIsIcon(currentLoc.name || "Here it is")} 
                  />

                  <Circle
                    center={[currentLoc.lat, currentLoc.lng]}
                    radius={(currentLoc.radiusKm || 200) * 1000}
                    pathOptions={{
                      color: feedback?.isCorrect ? '#10b981' : '#047857',
                      fillColor: feedback?.isCorrect ? '#10b981' : '#047857',
                      fillOpacity: 0.22,
                      weight: 2.5
                    }}
                  />

                  {markerPosition && (
                    <Polyline
                      positions={getShortestPolylinePositions(markerPosition, currentLoc.lat, currentLoc.lng)}
                      pathOptions={{
                        color: feedback?.isCorrect ? '#10b981' : '#ef4444',
                        dashArray: '6, 8',
                        weight: 3.5,
                        opacity: 0.9
                      }}
                    />
                  )}
                </>
              )}
            </MapContainer>
          )}

          {/* On-Map Floating Zoom & Fullscreen Controls */}
          <MapControlsOverlay
            onZoomIn={() => {
              const map = L.DomUtil.get(mapContainerRef.current)?.querySelector('.leaflet-container')?._leaflet_map;
              if (map) map.zoomIn();
            }}
            onZoomOut={() => {
              const map = L.DomUtil.get(mapContainerRef.current)?.querySelector('.leaflet-container')?._leaflet_map;
              if (map) map.zoomOut();
            }}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
        </div>

        {/* FOOTER CONTROLS MATCHING SIBAQ TRACKER */}

        {/* 1. "Name the place" Mode Options Grid (2x2) */}
        {isNameThePlace ? (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {currentOptions.map(option => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = option.id === currentLoc.id || option.isCorrect;
                
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
                    type="button"
                    disabled={optionAnswered}
                    onClick={() => handleSelectOption(option)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      background: btnBg,
                      border: `1.5px solid ${btnBorder}`,
                      color: btnColor,
                      fontSize: '1rem',
                      fontWeight: isSelected ? '700' : '600',
                      textAlign: 'left',
                      cursor: optionAnswered ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{option.name}</span>
                    {optionAnswered && isCorrect && <Check size={18} color="#10b981" strokeWidth={3} />}
                    {optionAnswered && isSelected && !isCorrect && <X size={18} color="#ef4444" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* 2. "Find it on the map" Controls Bar */
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              
              {/* Show Me Button (left) */}
              {!feedback && !showSolution ? (
                <button
                  type="button"
                  onClick={handleShowMe}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Show me
                </button>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {feedback?.isCorrect ? (
                    <span style={{ color: '#10b981', fontWeight: '700' }}>
                      Spot On! Found within {feedback.distance} km.
                    </span>
                  ) : showSolution ? (
                    <span style={{ color: '#047857', fontWeight: '700' }}>
                      Location revealed on map.
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>
                      Missed by {feedback?.distance.toLocaleString()} km.
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons (right) */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!feedback && !showSolution ? (
                  <Button
                    onClick={handleSpotSubmit}
                    disabled={!markerPosition}
                    style={{
                      padding: '0.65rem 1.75rem',
                      fontSize: '0.95rem',
                      background: '#047857',
                      borderColor: '#047857'
                    }}
                  >
                    Spot Location
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    style={{
                      padding: '0.65rem 2rem',
                      fontSize: '0.95rem',
                      background: '#047857',
                      borderColor: '#047857',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {currentIdx + 1 >= locations.length ? 'Finish' : 'Next'} <ArrowRight size={16} />
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => finishArena(results)}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Helper Hint matching SIBAQ screenshot */}
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Pinch or scroll to zoom, drag to move the map.
        </div>

      </Card>
    </div>
  );
};

export default MapArena;
