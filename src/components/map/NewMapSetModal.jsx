import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  MAP_STUDY_CATEGORIES, 
  getPlacesByCategory, 
  generateMultipleChoiceOptions 
} from '../../utils/mapCategoriesData';
import { Search, CheckSquare, Square, Globe, Layers, Check, X } from 'lucide-react';

export const NewMapSetModal = ({
  isOpen,
  onClose,
  onSaveSet
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('india-states');
  const [questionType, setQuestionType] = useState('find-on-map'); // 'find-on-map' | 'name-the-place'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [allowRetries, setAllowRetries] = useState(true);

  // All places for the active category
  const categoryPlaces = useMemo(() => {
    return getPlacesByCategory(category);
  }, [category]);

  // Filtered places matching search
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return categoryPlaces;
    const q = searchQuery.toLowerCase();
    return categoryPlaces.filter(p => p.name.toLowerCase().includes(q));
  }, [categoryPlaces, searchQuery]);

  // When changing category, clear or retain valid selections
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleTogglePlace = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllShown = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredPlaces.forEach(p => next.add(p.id));
      return next;
    });
  };

  const handleClearShown = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredPlaces.forEach(p => next.delete(p.id));
      return next;
    });
  };

  const selectedPlaces = useMemo(() => {
    return categoryPlaces.filter(p => selectedIds.has(p.id));
  }, [categoryPlaces, selectedIds]);

  const handleSave = (e) => {
    e?.preventDefault();
    if (selectedPlaces.length === 0) {
      alert('Please select at least one place for the map set.');
      return;
    }

    const setName = title.trim() || `${MAP_STUDY_CATEGORIES.find(c => c.id === category)?.name || 'Map Set'} (${questionType === 'name-the-place' ? 'Name the place' : 'Find on map'})`;

    // Map each place to the study location schema with mode & options
    const configuredLocations = selectedPlaces.map(p => ({
      id: p.id,
      prompt: p.name,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      radiusKm: p.radiusKm || 200,
      fact: p.fact || '',
      categoryId: category,
      questionType, // 'find-on-map' | 'name-the-place'
      options: questionType === 'name-the-place' ? generateMultipleChoiceOptions(p, category) : null
    }));

    onSaveSet({
      title: setName,
      category,
      questionType,
      allowRetries,
      locations: configuredLocations
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Map Set"
      maxWidth="780px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Title Input */}
        <div>
          <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Past paper 2025, puzzle 2"
            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
          />
        </div>

        {/* Row: Map Category & Question Type */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          {/* Map Category Selector */}
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
              Map
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {MAP_STUDY_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Segmented Switch */}
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
              Question type
            </label>
            <div style={{
              display: 'flex',
              background: 'var(--surface-2)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              padding: '3px'
            }}>
              <button
                type="button"
                onClick={() => setQuestionType('find-on-map')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: questionType === 'find-on-map' ? '700' : '500',
                  background: questionType === 'find-on-map' ? 'var(--surface)' : 'transparent',
                  color: questionType === 'find-on-map' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: questionType === 'find-on-map' ? '1px solid var(--border)' : 'none',
                  boxShadow: questionType === 'find-on-map' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Find it on the map
              </button>

              <button
                type="button"
                onClick={() => setQuestionType('name-the-place')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: questionType === 'name-the-place' ? '700' : '500',
                  background: questionType === 'name-the-place' ? 'var(--surface)' : 'transparent',
                  color: questionType === 'name-the-place' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: questionType === 'name-the-place' ? '1px solid var(--border)' : 'none',
                  boxShadow: questionType === 'name-the-place' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Name the place
              </button>
            </div>
          </div>
        </div>

        {/* Places to Practise Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Places to practise <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>&bull; {selectedIds.size} chosen, each asked once</span>
            </label>
          </div>

          {/* Search Filter */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.25rem',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Selection Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={handleSelectAllShown}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Choose all {filteredPlaces.length} shown
            </button>

            <button
              type="button"
              onClick={handleClearShown}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Clear shown
            </button>
          </div>

          {/* Scrollable Checkbox List */}
          <div style={{
            maxHeight: '230px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--surface)'
          }}>
            {filteredPlaces.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No places match "{searchQuery}"
              </div>
            ) : (
              filteredPlaces.map(place => {
                const isSelected = selectedIds.has(place.id);
                return (
                  <div
                    key={place.id}
                    onClick={() => handleTogglePlace(place.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #10b981' : '2px solid var(--text-secondary)',
                      background: isSelected ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>

                    <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? '600' : '400' }}>
                      {place.name}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Chosen Summary */}
          {selectedPlaces.length > 0 && (
            <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Chosen: </strong>
              {selectedPlaces.map(p => p.name).join(', ')}
            </div>
          )}
        </div>

        {/* Retries Checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={allowRetries}
            onChange={(e) => setAllowRetries(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
          />
          <span style={{ color: 'var(--text-primary)' }}>
            <strong>Allow retries.</strong> Students can try again to get faster.
          </span>
        </label>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button
            type="submit"
            disabled={selectedPlaces.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              background: '#047857',
              borderColor: '#047857'
            }}
          >
            Save Map Set ({selectedPlaces.length} places)
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewMapSetModal;
