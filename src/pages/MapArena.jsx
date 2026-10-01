import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Trophy, MapPin, Navigation, Clock } from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icons not loading in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine distance formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const LocationMarker = ({ position, setPosition, readOnly }) => {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
      }
    },
  });
  return position === null ? null : (
    <Marker position={position} />
  );
};

const MapArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || 'PracticeUser';

  const [tournament, setTournament] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [markerPosition, setMarkerPosition] = useState(null);
  
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [globalStartTime, setGlobalStartTime] = useState(null);

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchT = async () => {
      let t;
      if (id === 'practice-map') {
        t = {
          id: 'practice-map',
          name: 'Practice World Map',
          mapLocations: [
            { prompt: 'Spot India', lat: 20.5937, lng: 78.9629, radiusKm: 1000 },
            { prompt: 'Spot Sahara Desert', lat: 23.4162, lng: 25.6628, radiusKm: 1500 },
            { prompt: 'Spot Amazon Rainforest', lat: -3.4653, lng: -62.2159, radiusKm: 1500 }
          ]
        };
      } else {
        t = await dbService.getTournament(id);
      }
      setTournament(t);
      setGlobalStartTime(Date.now());
    };
    fetchT();
  }, [id]);

  if (!tournament) return <div className="page-wrapper">Loading Map Data...</div>;

  const locations = tournament.mapLocations || [];
  const currentLoc = locations[currentIdx];

  const handleSubmit = () => {
    if (!markerPosition) return;
    
    const distance = getDistance(markerPosition.lat, markerPosition.lng, currentLoc.lat, currentLoc.lng);
    const isCorrect = distance <= currentLoc.radiusKm;
    
    setFeedback({
      distance: Math.round(distance),
      isCorrect,
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
      isCorrect: feedback.isCorrect
    };

    const newResults = [...results, detail];
    
    if (currentIdx + 1 >= locations.length) {
      setResults(newResults);
      setCompleted(true);
      
      const timeElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
      const score = newResults.filter(r => r.isCorrect).length;
      
      if (!id.startsWith('practice-')) {
        await dbService.saveResult(id, {
          studentId,
          score,
          accuracy: Math.round((score / locations.length) * 100),
          timeElapsed,
          mapDetails: newResults
        });
      }
    } else {
      setResults(newResults);
      setCurrentIdx(currentIdx + 1);
      setMarkerPosition(null);
      setFeedback(null);
    }
  };

  useAntiCheat(() => {
    if (!completed) {
      setCompleted(true);
      if (!id.startsWith('practice-')) {
        dbService.saveResult(id, {
          studentId,
          score: results.filter(r => r.isCorrect).length,
          accuracy: Math.round((results.filter(r => r.isCorrect).length / locations.length) * 100) || 0,
          timeElapsed,
          mapDetails: results
        }).then(() => {
          navigate(`/leaderboard/${id}`);
        });
      } else {
        navigate(`/leaderboard/${id}`);
      }
    }
  }, id.startsWith('practice-'));

  if (completed) {
    const score = results.filter(r => r.isCorrect).length;
    return (
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <Trophy size={64} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Map Study Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Great spotting, {studentId}!</p>
          
          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{score} / {locations.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem' }}>Locations Found</div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
            <Button onClick={() => navigate(`/leaderboard/${id}`)}>View Leaderboard</Button>
          </div>
        </Card>

        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Your Spottings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((res, i) => (
            <Card key={i} style={{ padding: '1.5rem', borderLeft: `4px solid ${res.isCorrect ? 'var(--success)' : 'var(--error)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{i + 1}. {res.prompt}</h4>
                <div style={{ color: res.isCorrect ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>
                  {res.isCorrect ? 'FOUND' : 'MISSED'}
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                You were <strong>{res.distanceKm.toLocaleString()} km</strong> away.
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Map Study Arena</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <MapPin size={18} className="text-gradient" /> {currentIdx + 1} of {locations.length}
          </div>
        </div>
      </div>

      <Card style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>{currentLoc?.prompt}</h2>
        
        <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--glass-border)', position: 'relative', minHeight: 0 }}>
          {currentLoc && (
            <MapContainer 
              key={currentIdx} 
              center={[20, 0]} 
              zoom={2} 
              style={{ height: '100%', width: '100%', background: '#aadaff', minHeight: '300px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={markerPosition} setPosition={setMarkerPosition} readOnly={!!feedback} />
              
              {feedback && (
                <>
                  <Marker position={[feedback.targetLat, feedback.targetLng]} />
                  <Circle 
                    center={[feedback.targetLat, feedback.targetLng]}
                    radius={feedback.radiusKm * 1000} // Leaflet takes radius in meters
                    pathOptions={{ color: 'var(--success)', fillColor: 'var(--success)', fillOpacity: 0.2 }}
                  />
                </>
              )}
            </MapContainer>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {feedback ? (
              <span style={{ color: feedback.isCorrect ? 'var(--success)' : 'var(--error)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {feedback.isCorrect ? 'Spot On!' : `Missed! You were ${feedback.distance.toLocaleString()} km away.`}
              </span>
            ) : (
              <span>Click on the map to place your pin.</span>
            )}
          </div>
          
          {!feedback ? (
            <Button onClick={handleSubmit} disabled={!markerPosition}>
              <Navigation size={18} /> Submit
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next <Navigation size={18} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MapArena;
