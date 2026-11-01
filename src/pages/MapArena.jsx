import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Trophy, MapPin, Navigation, Lightbulb, Sparkles, 
  Volume2, VolumeX, RotateCcw, CheckCircle2, XCircle, Target, ArrowRight 
} from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRandomPracticeLocations } from '../utils/mapPresets';
import { soundEngine } from '../utils/soundEffects';

// Custom high-contrast distinct markers so players instantly distinguish their pin from the target
const userGuessIcon = L.divIcon({
  className: 'user-guess-pin',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
      <div style="background: #ef4444; color: #ffffff; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 1.5px solid #ffffff; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
        Your Guess
      </div>
      <div style="width: 22px; height: 22px; background: #ef4444; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 8px rgba(0,0,0,0.45);"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

const targetLocationIcon = L.divIcon({
  className: 'target-location-pin',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
      <div style="background: #10b981; color: #ffffff; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 1.5px solid #ffffff; margin-bottom: 2px; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
        🎯 Target
      </div>
      <div style="width: 24px; height: 24px; background: #10b981; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 8px rgba(0,0,0,0.45);"></div>
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
  if (distance <= 50) {
    return { tier: 'bullseye', label: 'Bullseye! 🎯', points: 1000, color: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (distance <= Math.max(250, radiusKm * 0.35)) {
    return { tier: 'gold', label: 'Gold Spot! 🥇', points: 800, color: '#eab308', badgeBg: 'rgba(234, 179, 8, 0.15)' };
  }
  if (distance <= Math.max(600, radiusKm * 0.70)) {
    return { tier: 'silver', label: 'Silver Spot! 🥈', points: 600, color: '#06b6d4', badgeBg: 'rgba(6, 182, 212, 0.15)' };
  }
  if (distance <= radiusKm) {
    return { tier: 'bronze', label: 'Target Zone! 🥉', points: 400, color: '#f97316', badgeBg: 'rgba(249, 115, 22, 0.15)' };
  }
  return { tier: 'miss', label: 'Missed Zone', points: 0, color: '#ef4444', badgeBg: 'rgba(239, 68, 68, 0.15)' };
};

// Geodesic shortest path calculation for polyline to prevent wrapping across the globe
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
        // Wrap coordinate so longitude is strictly inside [-180, 180]
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

// Map camera controller to smoothly auto-zoom on feedback and reset on next question
const MapCameraController = ({ feedback, currentIdx }) => {
  const map = useMap();

  useEffect(() => {
    if (feedback && feedback.userPos) {
      try {
        const bounds = L.latLngBounds(
          [feedback.userPos.lat, feedback.userPos.lng],
          [feedback.targetLat, feedback.targetLng]
        );
        map.flyToBounds(bounds, {
          padding: [70, 70],
          maxZoom: 6,
          duration: 1.0
        });
      } catch (e) {
        console.debug('flyToBounds error:', e);
      }
    } else {
      map.flyTo([20, 0], 2, { duration: 0.8 });
    }
  }, [feedback, currentIdx, map]);

  return null;
};

const MapArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || 'PracticeUser';
  const isSubmitting = useRef(false);

  const [tournament, setTournament] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [globalStartTime, setGlobalStartTime] = useState(null);

  const [feedback, setFeedback] = useState(null);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const loadPracticeRound = () => {
    const practiceLocations = getRandomPracticeLocations(5);
    setTournament({
      id: 'practice-map',
      name: 'World Geography Study Arena',
      mapLocations: practiceLocations
    });
    setCurrentIdx(0);
    setMarkerPosition(null);
    setFeedback(null);
    setShowHint(false);
    setResults([]);
    setCompleted(false);
    isSubmitting.current = false;
    setGlobalStartTime(Date.now());
  };

  useEffect(() => {
    const fetchT = async () => {
      if (id === 'practice-map') {
        loadPracticeRound();
      } else {
        const t = await dbService.getTournament(id);
        setTournament(t);
        setGlobalStartTime(Date.now());
      }
    };
    fetchT();
  }, [id]);

  const locations = tournament?.mapLocations || [];
  const currentLoc = locations[currentIdx];

  useAntiCheat(() => {
    if (!completed && !isSubmitting.current) {
      isSubmitting.current = true;
      try {
        localStorage.removeItem(`started_${id}_${studentId}`);
      } catch (e) {}

      setCompleted(true);
      const timeElapsed = globalStartTime ? Math.floor((Date.now() - globalStartTime) / 1000) : 0;
      const score = results.filter(r => r.isCorrect).length;
      const totalPoints = results.reduce((sum, r) => sum + (r.rating?.points || 0), 0);

      if (!id.startsWith('practice-')) {
        dbService.saveResult(id, {
          studentId,
          score,
          points: totalPoints,
          accuracy: Math.round((score / (locations.length || 1)) * 100) || 0,
          timeElapsed,
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
  }, id.startsWith('practice-'));

  if (!tournament) return <div className="page-wrapper" style={{ paddingTop: '4rem', textAlign: 'center' }}>Loading Geography Study Arena...</div>;

  const handleSubmit = () => {
    if (!markerPosition || !currentLoc) return;
    
    const distance = getDistance(markerPosition.lat, markerPosition.lng, currentLoc.lat, currentLoc.lng);
    const isCorrect = distance <= currentLoc.radiusKm;
    const rating = calculatePrecisionRating(distance, currentLoc.radiusKm);

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
      radiusKm: currentLoc.radiusKm,
      userPos: markerPosition
    });
  };

  const handleNext = async () => {
    const detail = {
      prompt: currentLoc.prompt,
      userLat: markerPosition.lat,
      userLng: markerPosition.lng,
      targetLat: currentLoc.lat,
      targetLng: currentLoc.lng,
      distanceKm: feedback.distance,
      isCorrect: feedback.isCorrect,
      rating: feedback.rating,
      fact: currentLoc.fact || '',
      hint: currentLoc.hint || ''
    };

    const newResults = [...results, detail];
    
    if (currentIdx + 1 >= locations.length) {
      if (isSubmitting.current) return;
      isSubmitting.current = true;
      try {
        localStorage.removeItem(`started_${id}_${studentId}`);
      } catch (e) {}

      setResults(newResults);
      setCompleted(true);
      soundEngine.playVictory();
      
      const timeElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
      const score = newResults.filter(r => r.isCorrect).length;
      const totalPoints = newResults.reduce((sum, r) => sum + (r.rating?.points || 0), 0);
      
      if (!id.startsWith('practice-')) {
        try {
          await dbService.saveResult(id, {
            studentId,
            score,
            points: totalPoints,
            accuracy: Math.round((score / locations.length) * 100),
            timeElapsed,
            mapDetails: newResults
          });
        } catch (err) {
          console.error('Failed to save map result:', err);
        }
      }
    } else {
      setResults(newResults);
      setCurrentIdx(currentIdx + 1);
      setMarkerPosition(null);
      setFeedback(null);
      setShowHint(false);
    }
  };

  if (completed) {
    const score = results.filter(r => r.isCorrect).length;
    const totalPoints = results.reduce((sum, r) => sum + (r.rating?.points || 0), 0);
    const accuracy = Math.round((score / (locations.length || 1)) * 100);

    return (
      <div className="container" style={{ maxWidth: '850px', margin: '0 auto', paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <Trophy size={64} color="var(--primary)" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Map Study Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Outstanding geography exploration, {studentId}!
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: 'var(--primary)' }}>
                {score} / {locations.length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                Locations Found
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: '#10b981' }}>
                {totalPoints}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                Precision Score
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: '800', color: '#06b6d4' }}>
                {accuracy}%
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                Overall Accuracy
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {id === 'practice-map' && (
              <Button 
                onClick={loadPracticeRound} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
              >
                <RotateCcw size={18} /> Practice Again (New Locations)
              </Button>
            )}
            <Button onClick={() => navigate('/dashboard')} variant="secondary">
              Back to Dashboard
            </Button>
            {!id.startsWith('practice-') && (
              <Button onClick={() => navigate(`/leaderboard/${id}`)}>
                View Leaderboard
              </Button>
            )}
          </div>
        </Card>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={22} className="text-gradient" /> Your Spottings & Study Facts
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
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '600', margin: '0 0 0.35rem 0' }}>
                    {i + 1}. {res.prompt}
                  </h4>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Off by <strong>{res.distanceKm.toLocaleString()} km</strong>
                  </div>
                </div>

                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.35rem 0.8rem', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  fontWeight: '600',
                  background: res.rating?.badgeBg || 'rgba(255,255,255,0.05)',
                  color: res.rating?.color || (res.isCorrect ? '#10b981' : '#ef4444'),
                  border: `1px solid ${res.rating?.color || 'currentColor'}`
                }}>
                  {res.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {res.rating?.label || (res.isCorrect ? 'Found' : 'Missed')} (+{res.rating?.points || 0} pts)
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
                  <Lightbulb size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
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
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', paddingTop: '1.75rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Map Study Arena</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Pinpoint locations across the globe to hone your geographical literacy.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={toggleSound}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.45rem 0.65rem',
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
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'var(--glass-bg)', 
            padding: '0.4rem 0.9rem', 
            borderRadius: '20px', 
            border: '1px solid var(--glass-border)',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            <MapPin size={17} className="text-gradient" /> {currentIdx + 1} of {locations.length}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Card */}
      <Card style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{currentLoc?.prompt}</h2>
          
          {currentLoc?.hint && !feedback && (
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              style={{
                background: showHint ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Lightbulb size={15} /> {showHint ? 'Hide Hint' : 'Geographical Hint'}
            </button>
          )}
        </div>

        {/* Optional Collapsible Hint */}
        {showHint && currentLoc?.hint && !feedback && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '8px',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} color="#3b82f6" />
            <span><strong>Clue: </strong>{currentLoc.hint}</span>
          </div>
        )}
        
        {/* Leaflet Map Canvas */}
        <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--glass-border)', position: 'relative', minHeight: '400px' }}>
          {currentLoc && (
            <MapContainer 
              key={currentIdx} 
              center={[20, 0]} 
              zoom={2} 
              minZoom={2}
              maxBounds={[[-85, -180], [85, 180]]}
              maxBoundsViscosity={1.0}
              worldCopyJump={false}
              style={{ height: '100%', width: '100%', background: '#aadaff', minHeight: '400px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap={true}
                bounds={[[-85, -180], [85, 180]]}
              />
              <MapCameraController feedback={feedback} currentIdx={currentIdx} />
              <LocationMarker position={markerPosition} setPosition={setMarkerPosition} readOnly={!!feedback} />
              
              {feedback && (
                <>
                  {/* True target location marker with high-contrast green pin */}
                  <Marker position={[feedback.targetLat, feedback.targetLng]} icon={targetLocationIcon}>
                    <Tooltip direction="top" offset={[0, -28]} opacity={0.95} permanent>
                      🎯 {currentLoc.prompt}
                    </Tooltip>
                  </Marker>

                  {/* Target tolerance radius boundary */}
                  <Circle 
                    center={[feedback.targetLat, feedback.targetLng]}
                    radius={feedback.radiusKm * 1000}
                    pathOptions={{ 
                      color: feedback.isCorrect ? '#10b981' : '#ef4444', 
                      fillColor: feedback.isCorrect ? '#10b981' : '#ef4444', 
                      fillOpacity: 0.22,
                      weight: 2.5
                    }}
                  />

                  {/* Geodesic shortest trajectory line connecting player guess to actual target */}
                  {markerPosition && (
                    <Polyline 
                      positions={getShortestPolylinePositions(markerPosition, feedback.targetLat, feedback.targetLng)}
                      pathOptions={{
                        color: feedback.isCorrect ? '#10b981' : '#ef4444',
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
        </div>

        {/* Study Fact Flashcard shown during feedback */}
        {feedback && currentLoc?.fact && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1.1rem',
            marginTop: '1rem',
            alignItems: 'flex-start'
          }}>
            <Lightbulb size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.9rem', lineHeight: '1.45', color: 'var(--text-primary)' }}>
              <strong style={{ color: '#3b82f6' }}>Did You Know? </strong>
              {currentLoc.fact}
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {feedback ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  color: feedback.rating?.color || (feedback.isCorrect ? 'var(--success)' : 'var(--error)'), 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {feedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {feedback.rating?.label}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  ({feedback.distance.toLocaleString()} km from target &bull; Target radius: {feedback.radiusKm} km)
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.95rem' }}>
                {markerPosition 
                  ? `Pin set at [${markerPosition.lat.toFixed(2)}°, ${markerPosition.lng.toFixed(2)}°]. Ready to submit!` 
                  : 'Click anywhere on the map above to drop your pin.'}
              </span>
            )}
          </div>
          
          {!feedback ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!markerPosition}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              <Navigation size={18} /> Spot Location
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              {currentIdx + 1 >= locations.length ? 'Finish Arena' : 'Next Question'} <ArrowRight size={18} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MapArena;
