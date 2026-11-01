import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MapPin, Crosshair, Check, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure default icons work correctly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ClickMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4))
      });
    }
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
};

export const MapPinPickerModal = ({
  isOpen,
  onClose,
  initialLat = 20,
  initialLng = 0,
  initialRadius = 500,
  locationTitle = "Target Location",
  onConfirm
}) => {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const [radiusKm, setRadiusKm] = useState(initialRadius);

  useEffect(() => {
    setPosition({ lat: initialLat || 20, lng: initialLng || 0 });
    setRadiusKm(initialRadius || 500);
  }, [initialLat, initialLng, initialRadius, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onConfirm({
      lat: position.lat,
      lng: position.lng,
      radiusKm
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive Map Pin-Drop"
      maxWidth="780px"
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
        Click anywhere on the globe to place the target coordinate for <strong>{locationTitle}</strong>.
      </p>

      {/* Live Leaflet Map */}
      <div style={{
        height: '360px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1.5px solid var(--border)',
        marginBottom: '1rem',
        position: 'relative'
      }}>
        <MapContainer
          center={[position.lat || 20, position.lng || 0]}
          zoom={2}
          style={{ height: '100%', width: '100%', background: '#aadaff' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickMarker position={position} setPosition={setPosition} />
          {position && radiusKm > 0 && (
            <Circle
              center={[position.lat, position.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.2 }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordinate & Radius Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.2fr',
        gap: '0.75rem',
        marginBottom: '1rem',
        alignItems: 'end'
      }}>
        <Input
          type="number"
          step="any"
          label="Target Latitude"
          value={position.lat}
          onChange={e => setPosition(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
        />
        <Input
          type="number"
          step="any"
          label="Target Longitude"
          value={position.lng}
          onChange={e => setPosition(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
        />
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Allowed Radius: <strong style={{ color: 'var(--primary)' }}>{radiusKm} km</strong>
          </label>
          <input
            type="range"
            min="20"
            max="2500"
            step="20"
            value={radiusKm}
            onChange={e => setRadiusKm(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Radius Quick Preset Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Quick Radius:</span>
        <button
          type="button"
          onClick={() => setRadiusKm(80)}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: radiusKm === 80 ? 'var(--primary)' : 'var(--surface-2)',
            color: radiusKm === 80 ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          Landmark (80 km)
        </button>
        <button
          type="button"
          onClick={() => setRadiusKm(180)}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: radiusKm === 180 ? 'var(--primary)' : 'var(--surface-2)',
            color: radiusKm === 180 ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          City / Capital (180 km)
        </button>
        <button
          type="button"
          onClick={() => setRadiusKm(600)}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: radiusKm === 600 ? 'var(--primary)' : 'var(--surface-2)',
            color: radiusKm === 600 ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          Country (600 km)
        </button>
        <button
          type="button"
          onClick={() => setRadiusKm(1500)}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: radiusKm === 1500 ? 'var(--primary)' : 'var(--surface-2)',
            color: radiusKm === 1500 ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          Continent / Desert (1500 km)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} style={{ flex: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Check size={16} /> Save Coordinates
        </Button>
      </div>
    </Modal>
  );
};

export default MapPinPickerModal;
