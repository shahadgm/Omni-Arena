import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Search, Plus, Check, Globe, MapPin, Sparkles } from 'lucide-react';
import { MAP_PRESETS, MAP_CATEGORIES } from '../../utils/mapPresets';

export const MapPresetPickerModal = ({
  isOpen,
  onClose,
  onAddLocations
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresets, setSelectedPresets] = useState([]);

  if (!isOpen) return null;

  const filteredPresets = MAP_PRESETS.filter(p => {
    const matchesCategory = activeTab === 'all' || p.category === activeTab;
    const matchesSearch = 
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hint && p.hint.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.fact && p.fact.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleSelect = (preset) => {
    const exists = selectedPresets.some(p => p.prompt === preset.prompt);
    if (exists) {
      setSelectedPresets(selectedPresets.filter(p => p.prompt !== preset.prompt));
    } else {
      setSelectedPresets([...selectedPresets, preset]);
    }
  };

  const handleConfirmAdd = () => {
    if (selectedPresets.length === 0) return;
    onAddLocations(selectedPresets.map(p => ({
      prompt: p.prompt,
      lat: p.lat,
      lng: p.lng,
      radiusKm: p.radiusKm,
      hint: p.hint || '',
      fact: p.fact || ''
    })));
    setSelectedPresets([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Geography Study Library"
      maxWidth="780px"
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
        Select curated locations from our pre-calibrated world geography catalog to add to your tournament.
      </p>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {MAP_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: activeTab === cat.id ? 'var(--primary)' : 'var(--surface-2)',
              color: activeTab === cat.id ? '#ffffff' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontWeight: activeTab === cat.id ? '700' : '500',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1rem' }}>
        <Input
          placeholder="Search world capitals, landmarks, wonders, rivers, islands..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Preset Cards Grid */}
      <div style={{
        maxHeight: '360px',
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        paddingRight: '0.25rem'
      }}>
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresets.some(p => p.prompt === preset.prompt);

          return (
            <div
              key={preset.prompt}
              onClick={() => toggleSelect(preset)}
              style={{
                background: isSelected ? 'var(--primary-glow)' : 'var(--surface-2)',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {preset.prompt}
                  </span>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    marginLeft: '0.5rem'
                  }}>
                    {isSelected && <Check size={12} />}
                  </div>
                </div>

                {preset.fact && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                    {preset.fact}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {preset.lat.toFixed(2)}°, {preset.lng.toFixed(2)}°
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  fontWeight: '600'
                }}>
                  ±{preset.radiusKm} km
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Selected: <strong style={{ color: 'var(--primary)' }}>{selectedPresets.length}</strong> location(s)
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdd}
            disabled={selectedPresets.length === 0}
            style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Add {selectedPresets.length > 0 ? `(${selectedPresets.length})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MapPresetPickerModal;
