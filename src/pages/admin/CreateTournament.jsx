import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { dbService, authService } from '../../services/db';
import { Plus, Trash2, Globe, Lock, Key, RefreshCw } from 'lucide-react';
import clg from 'crossword-layout-generator';

const CreateTournament = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState('typing');
  const [type, setType] = useState('English');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  
  // Privacy & Access
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [hideLeaderboard, setHideLeaderboard] = useState(false);
  
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccessCode(result);
  };
  
  // Custom text option (Typing)
  const [useCustomText, setUseCustomText] = useState(false);
  const [customSections, setCustomSections] = useState([
    { language: 'English', text: '', dir: 'ltr' }
  ]);

  // Quiz options
  const [quizQuestions, setQuizQuestions] = useState([
    { type: 'mcq', question: '', options: ['', '', '', ''], correctOptionIndex: 0, correctAnswer: '', timeLimitSec: 30, points: 1 }
  ]);
  const [bulkText, setBulkText] = useState('');

  // Logic puzzles options
  const [puzzles, setPuzzles] = useState([
    { type: 'nonogram', size: '10x10', customGrid: '' }
  ]);

  // Map options
  const [mapLocations, setMapLocations] = useState([
    { prompt: 'Spot India', lat: 20.5937, lng: 78.9629, radiusKm: 500 }
  ]);

  // Crossword options
  const [crosswordText, setCrosswordText] = useState('angle A shape made by two lines meeting\nbrake Stop a vehicle / sounds like something broken');
  const [crosswordPreview, setCrosswordPreview] = useState(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/');
      return;
    }
    if (!id && authService.isGuest()) {
      alert("Guests cannot host tournaments. Please sign in with an account.");
      navigate('/dashboard');
      return;
    }
    if (id) {
      const fetchT = async () => {
        const t = await dbService.getTournament(id);
        if (t) {
          const currentUser = authService.getCurrentUser();
          const isAdmin = authService.isAdmin();
          const isGuest = authService.isGuest();
          const isOwner = !isGuest && currentUser && t.createdBy && t.createdBy.toLowerCase() === currentUser.username.toLowerCase();
          if (!isAdmin && !isOwner) {
            alert("You do not have permission to edit this tournament.");
            navigate('/dashboard');
            return;
          }
          setName(t.name);
          setGameType(t.gameType || 'typing');
          setType(t.type || 'English');
          const formatLocal = (isoString) => {
            const date = new Date(isoString);
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
          };
          setStartTime(formatLocal(t.startTime));
          setEndTime(formatLocal(t.endTime));
          if (t.timeLimit) setTimeLimit(t.timeLimit);
          if (t.isPrivate) {
            setIsPrivate(true);
            setAccessCode(t.accessCode || '');
          }
          if (t.hideLeaderboard) {
            setHideLeaderboard(true);
          }
          if (t.customText) {
            setUseCustomText(true);
            setCustomSections(t.customText);
          }
          if (t.quizQuestions) {
            const mapped = t.quizQuestions.map(q => ({
              ...q,
              type: q.type || 'mcq',
              section: q.section || 'General',
              correctAnswer: q.correctAnswer || '',
              points: q.points || 1
            }));
            setQuizQuestions(mapped);
          }
          if (t.puzzles) {
            setPuzzles(t.puzzles.map(p => ({
              ...p,
              customGrid: p.customGrid ? JSON.stringify(p.customGrid, null, 2) : ''
            })));
          } else if (t.gameType === 'nonogram' || t.gameType === 'shikaku') {
            setGameType('logic-puzzle');
            setPuzzles([{
              type: t.gameType,
              size: t.puzzleSize || '7x7',
              customGrid: t.customPuzzle ? JSON.stringify(t.customPuzzle, null, 2) : ''
            }]);
          }
          if (t.mapLocations) {
            setMapLocations(t.mapLocations);
          }
          if (t.crosswordText) {
            setCrosswordText(t.crosswordText);
          }
        }
      };
      fetchT();
    }
  }, [navigate, id]);

  const handleAddSection = () => {
    setCustomSections([...customSections, { language: 'English', text: '', dir: 'ltr' }]);
  };

  const handleUpdateSection = (idx, field, value) => {
    const updated = [...customSections];
    updated[idx][field] = value;
    if (field === 'language') {
      updated[idx].dir = (value === 'Arabic' || value === 'Urdu') ? 'rtl' : 'ltr';
    }
    setCustomSections(updated);
  };

  const handleRemoveSection = (idx) => {
    const updated = customSections.filter((_, i) => i !== idx);
    setCustomSections(updated);
  };

  const handleAddQuizQuestion = () => {
    const lastSection = quizQuestions.length > 0 ? quizQuestions[quizQuestions.length - 1].section || 'General' : 'General';
    setQuizQuestions([...quizQuestions, { type: 'mcq', section: lastSection, question: '', options: ['', '', '', ''], correctOptionIndex: 0, correctAnswer: '', timeLimitSec: 30, points: 1 }]);
  };

  const handleUpdateQuizQuestion = (idx, field, value) => {
    const updated = [...quizQuestions];
    updated[idx][field] = value;
    setQuizQuestions(updated);
  };

  const handleUpdateQuizOption = (qIdx, optIdx, value) => {
    const updated = [...quizQuestions];
    updated[qIdx].options[optIdx] = value;
    setQuizQuestions(updated);
  };

  const handleRemoveQuizQuestion = (idx) => {
    const updated = quizQuestions.filter((_, i) => i !== idx);
    setQuizQuestions(updated);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    try {
      const lines = bulkText.split('\n').filter(l => l.trim());
      const newQs = lines.map(line => {
        const parts = line.split('\t').map(p => p.trim());
        const qType = parts[0].toLowerCase();
        
        if (qType === 'mcq') {
          let _, sec, q, o1, o2, o3, o4, correct, time, pts;
          if (parts.length >= 10) {
            [_, sec, q, o1, o2, o3, o4, correct, time, pts] = parts;
          } else {
            sec = 'General';
            [_, q, o1, o2, o3, o4, correct, time, pts] = parts;
          }
          return {
            type: 'mcq',
            section: sec || 'General',
            question: q || '',
            options: [o1 || '', o2 || '', o3 || '', o4 || ''],
            correctOptionIndex: Math.max(0, parseInt(correct) - 1 || 0),
            correctAnswer: '',
            timeLimitSec: parseInt(time) || 30,
            points: parseInt(pts) || 1
          };
        } else if (qType === 'text') {
          let _, sec, q, ans, time, pts;
          if (parts.length >= 6) {
            [_, sec, q, ans, time, pts] = parts;
          } else {
            sec = 'General';
            [_, q, ans, time, pts] = parts;
          }
          return {
            type: 'text',
            section: sec || 'General',
            question: q || '',
            options: ['', '', '', ''],
            correctOptionIndex: 0,
            correctAnswer: ans || '',
            timeLimitSec: parseInt(time) || 30,
            points: parseInt(pts) || 1
          };
        } else {
          throw new Error(`Unknown question type: ${qType}`);
        }
      });
      setQuizQuestions([...quizQuestions, ...newQs]);
      setBulkText('');
      alert(`Imported ${newQs.length} questions successfully!`);
    } catch (err) {
      alert("Error importing: Make sure format is correct (tab-separated). " + err.message);
    }
  };

  const handlePreviewCrossword = () => {
    if (!crosswordText.trim()) return;
    try {
      const lines = crosswordText.split('\n').filter(l => l.trim());
      const inputJson = [];
      for (let line of lines) {
        const firstSpaceIndex = line.indexOf(' ');
        if (firstSpaceIndex === -1) {
          alert(`Invalid line format: "${line}". Must be "word clue"`);
          return;
        }
        const word = line.substring(0, firstSpaceIndex).trim().toLowerCase();
        const clue = line.substring(firstSpaceIndex + 1).trim();
        if (!word || !clue) {
          alert(`Invalid line format: "${line}". Missing word or clue.`);
          return;
        }
        inputJson.push({ answer: word, clue });
      }
      const layout = clg.generateLayout(inputJson);
      if (layout.table.length === 0) {
        alert("Could not generate a crossword from these words. Try adding more crossing letters.");
        setCrosswordPreview(null);
      } else {
        setCrosswordPreview(layout.table);
      }
    } catch (err) {
      alert("Error generating preview: " + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if(!name || !startTime || !endTime) {
      alert("Please fill all required fields");
      return;
    }

    if (isPrivate && !accessCode.trim()) {
      alert("Please enter a tournament access code for this private tournament, or click 'Generate Code'.");
      return;
    }

    try {
      const currentUser = authService.getCurrentUser() || { username: 'user', displayName: 'User' };
      const tournament = {
        name,
        gameType,
        type: gameType === 'typing' ? type : 'Standard',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        timeLimit: parseInt(timeLimit) || 0,
        isPrivate: !!isPrivate,
        accessCode: isPrivate ? accessCode.trim().toUpperCase() : '',
        hideLeaderboard,
      };

      if (!id) {
        // Only set creator for new tournaments; never overwrite original creator on edit
        tournament.createdBy = currentUser.username;
        tournament.creatorName = currentUser.displayName || currentUser.username;
        tournament.createdAt = new Date().toISOString();
      }

      if (gameType === 'typing') {
        if (useCustomText) {
          if(customSections.some(s => !s.text.trim())) {
            alert("Please fill all custom text sections or disable custom text.");
            return;
          }
          tournament.customText = customSections;
          const langs = new Set(customSections.map(s => s.language));
          if(langs.size > 2) tournament.type = 'Trilingual';
          else if(langs.size === 2) tournament.type = 'Bilingual';
          else tournament.type = 'English';
        }
      } else if (gameType === 'quiz') {
        const isInvalid = quizQuestions.some(q => {
          if (!q.question.trim()) return true;
          if (q.type === 'mcq' && q.options.some(o => !o.trim())) return true;
          if (q.type === 'text' && !q.correctAnswer.trim()) return true;
          return false;
        });
        if(isInvalid) {
          alert("Please fill all quiz questions, options, and answers completely.");
          return;
        }
        tournament.quizQuestions = quizQuestions;
      } else if (gameType === 'logic-puzzle') {
        const processedPuzzles = [];
        for (let p of puzzles) {
          let customGridObj = null;
          if (p.customGrid.trim()) {
            try {
              customGridObj = JSON.parse(p.customGrid);
              if (!Array.isArray(customGridObj)) throw new Error("Must be a 2D array");
            } catch(err) {
              alert("Invalid JSON for custom grid: " + err.message);
              return;
            }
          }
          processedPuzzles.push({ type: p.type, size: p.size, customGrid: customGridObj });
        }
        tournament.puzzles = processedPuzzles;
      } else if (gameType === 'map') {
        const isInvalid = mapLocations.some(l => !l.prompt.trim() || !l.lat || !l.lng || !l.radiusKm);
        if (isInvalid) {
          alert("Please fill all map location details.");
          return;
        }
        tournament.mapLocations = mapLocations;
      } else if (gameType === 'crossword') {
        if (!crosswordText.trim()) {
          alert("Please enter crossword words and clues.");
          return;
        }
        
        const lines = crosswordText.split('\n').filter(l => l.trim());
        const inputJson = [];
        for (let line of lines) {
          const firstSpaceIndex = line.indexOf(' ');
          if (firstSpaceIndex === -1) {
            alert(`Invalid line format: "${line}". Must be "word clue"`);
            return;
          }
          const word = line.substring(0, firstSpaceIndex).trim().toLowerCase();
          const clue = line.substring(firstSpaceIndex + 1).trim();
          if (!word || !clue) {
            alert(`Invalid line format: "${line}". Missing word or clue.`);
            return;
          }
          inputJson.push({ answer: word, clue });
        }
        
        const layout = clg.generateLayout(inputJson);
        if (layout.table.length === 0) {
          alert("Could not generate a crossword from these words. Try adding more crossing letters.");
          return;
        }
        
        // Flatten nested array for Firebase
        const flatLayout = {
          ...layout,
          table: layout.table.map(row => row.join(''))
        };
        
        tournament.crosswordText = crosswordText;
        tournament.crosswordLayout = flatLayout;
      }

      if (id) {
        await dbService.updateTournament(id, tournament);
      } else {
        await dbService.createTournament(tournament);
      }
      
      if (authService.isAdmin()) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert("Error saving tournament: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{id ? 'Edit Tournament' : 'Create Tournament'}</h1>
      
      <form onSubmit={handleCreate}>
        <Card style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>General Details</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Format / Game Type</label>
            <select 
              value={gameType} 
              onChange={e => setGameType(e.target.value)}
              style={{
                padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-2)',
                border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none',
                fontSize: '1rem', fontFamily: 'inherit'
              }}
            >
              <option value="typing">⌨️ Typing Competition</option>
              <option value="quiz">❓ Quiz Competition (MCQ & Text)</option>
              <option value="logic-puzzle">🧩 Logic Puzzles (Nonogram & Shikaku)</option>
              <option value="crossword">📝 Crossword Puzzle</option>
              <option value="map">🗺️ World Map Geography</option>
            </select>
          </div>
          
          <Input 
            label="Tournament Name" 
            placeholder="e.g. Spring Typing Championship"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              type="datetime-local" 
              label="Start Time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
            <Input 
              type="datetime-local" 
              label="End Time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Time Limit (minutes)</label>
            <Input 
              type="number" 
              value={timeLimit} 
              onChange={(e) => setTimeLimit(e.target.value)} 
              min="0"
            />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Set to 0 for unlimited time.</p>
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Visibility & Access</label>
            
            <div role="radiogroup" aria-label="Tournament Visibility" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div 
                role="radio"
                aria-checked={!isPrivate}
                tabIndex={0}
                onClick={() => setIsPrivate(false)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setIsPrivate(false);
                  }
                }}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: !isPrivate ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: !isPrivate ? 'rgba(79, 70, 229, 0.12)' : 'var(--surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: !isPrivate ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                  <Globe size={20} />
                  <strong style={{ fontSize: '1rem' }}>Public Tournament</strong>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                  Visible to everyone on the platform. Any participant can discover and join.
                </p>
              </div>

              <div 
                role="radio"
                aria-checked={isPrivate}
                tabIndex={0}
                onClick={() => {
                  setIsPrivate(true);
                  if (!accessCode) generateRandomCode();
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setIsPrivate(true);
                    if (!accessCode) generateRandomCode();
                  }
                }}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: isPrivate ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isPrivate ? 'rgba(79, 70, 229, 0.12)' : 'var(--surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isPrivate ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                  <Lock size={20} />
                  <strong style={{ fontSize: '1rem' }}>Private Tournament</strong>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                  Hidden from public list. Only participants with the Tournament Code can enter.
                </p>
              </div>
            </div>

            {isPrivate && (
              <div style={{ 
                padding: '1.25rem', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Key size={16} /> Tournament Access Code:
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Input 
                    placeholder="e.g. ARENA-789 or 642910"
                    value={accessCode} 
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())} 
                    style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={generateRandomCode}
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    title="Generate Random Code"
                  >
                    <RefreshCw size={16} /> Generate Code
                  </Button>
                </div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  Participants must enter this exact code on their dashboard to find and enter this tournament.
                </p>
              </div>
            )}
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={hideLeaderboard} 
                onChange={(e) => setHideLeaderboard(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontWeight: '500' }}>Hide Leaderboard from Contestants</span>
            </label>
          </div>

          {gameType === 'typing' && !useCustomText && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Competition Language Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)}
                style={{
                  padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none',
                  fontSize: '1rem', fontFamily: 'inherit'
                }}
              >
                <option value="English">English Only</option>
                <option value="Arabic">Arabic Only</option>
                <option value="Urdu">Urdu Only</option>
                <option value="Bilingual">Bilingual (English & Arabic)</option>
                <option value="Trilingual">Trilingual (English, Arabic, & Urdu)</option>
              </select>
            </div>
          )}
        </Card>

        {gameType === 'typing' && (
          <Card style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Text Content</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="customText" 
                  checked={useCustomText}
                  onChange={e => setUseCustomText(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                <label htmlFor="customText" style={{ cursor: 'pointer' }}>Use Custom Text</label>
              </div>
            </div>

            {!useCustomText ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                The system will automatically generate random text based on the selected competition type.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>
                  Note: Each section will be presented consecutively to the student.
                </p>
                
                {customSections.map((section, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem' }}>Section {idx + 1}</h3>
                      {customSections.length > 1 && (
                        <button type="button" onClick={() => handleRemoveSection(idx)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <select 
                        value={section.language} 
                        onChange={e => handleUpdateSection(idx, 'language', e.target.value)}
                        style={{
                          padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-tertiary)',
                          border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none',
                        }}
                      >
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Urdu">Urdu</option>
                      </select>
                      
                      <textarea 
                        placeholder={`Enter ${section.language} text here...`}
                        value={section.text}
                        onChange={e => handleUpdateSection(idx, 'text', e.target.value)}
                        dir={section.dir}
                        style={{
                          width: '100%', height: '100px', padding: '1rem',
                          background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical',
                          fontFamily: section.dir === 'rtl' ? 'Arial, sans-serif' : 'inherit',
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="secondary" onClick={handleAddSection} style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} /> Add Section
                </Button>
              </div>
            )}
          </Card>
        )}

        {gameType === 'quiz' && (
          <Card style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Quiz Questions</h2>
            </div>
            
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Bulk Import (Excel/TSV)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Paste from Excel here. Format must be tab-separated:<br/>
                For MCQ: <code>mcq &lt;tab&gt; Section &lt;tab&gt; Question &lt;tab&gt; Opt1 &lt;tab&gt; Opt2 &lt;tab&gt; Opt3 &lt;tab&gt; Opt4 &lt;tab&gt; CorrectIndex(1-4) &lt;tab&gt; TimeLimit &lt;tab&gt; Points</code><br/>
                For Text: <code>text &lt;tab&gt; Section &lt;tab&gt; Question &lt;tab&gt; CorrectAnswer &lt;tab&gt; TimeLimit &lt;tab&gt; Points</code>
              </p>
              <textarea 
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="Paste tab-separated data here..."
                style={{
                  width: '100%', height: '80px', padding: '0.75rem',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical',
                  marginBottom: '1rem'
                }}
              />
              <Button type="button" variant="secondary" onClick={handleBulkImport}>
                Import Data
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {quizQuestions.map((q, idx) => (
                <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem' }}>Question {idx + 1}</h3>
                    {quizQuestions.length > 1 && (
                      <button type="button" onClick={() => handleRemoveQuizQuestion(idx)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <select 
                      value={q.type || 'mcq'} 
                      onChange={e => handleUpdateQuizQuestion(idx, 'type', e.target.value)}
                      style={{
                        padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-tertiary)',
                        border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none',
                        width: '200px'
                      }}
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="text">Single Answer (Text Input)</option>
                    </select>
                    <Input 
                      placeholder="Section Name (e.g. GK, Math)"
                      value={q.section || 'General'}
                      onChange={e => handleUpdateQuizQuestion(idx, 'section', e.target.value)}
                      style={{ width: '250px' }}
                    />
                  </div>

                  <Input 
                    label="Question Text" 
                    placeholder="Enter the question..."
                    value={q.question}
                    onChange={e => handleUpdateQuizQuestion(idx, 'question', e.target.value)}
                    required
                    style={{ marginBottom: '1rem' }}
                  />
                  
                  {q.type === 'mcq' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="radio" 
                            name={`correct-${idx}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleUpdateQuizQuestion(idx, 'correctOptionIndex', optIdx)}
                            style={{ cursor: 'pointer' }}
                            title="Mark as correct answer"
                          />
                          <Input 
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt}
                            onChange={e => handleUpdateQuizOption(idx, optIdx, e.target.value)}
                            required
                            style={{ borderColor: q.correctOptionIndex === optIdx ? 'var(--success)' : '' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <Input 
                        label="Correct Answer" 
                        placeholder="Enter the exact answer string..."
                        value={q.correctAnswer}
                        onChange={e => handleUpdateQuizQuestion(idx, 'correctAnswer', e.target.value)}
                        required
                        style={{ borderColor: 'var(--success)' }}
                      />
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '70%' }}>
                    <Input 
                      type="number"
                      label="Time Limit (Seconds)" 
                      value={q.timeLimitSec}
                      onChange={e => handleUpdateQuizQuestion(idx, 'timeLimitSec', parseInt(e.target.value) || 30)}
                      required
                    />
                    <Input 
                      type="number"
                      label="Points" 
                      value={q.points}
                      onChange={e => handleUpdateQuizQuestion(idx, 'points', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="secondary" onClick={handleAddQuizQuestion} style={{ alignSelf: 'flex-start' }}>
                <Plus size={16} /> Add Question
              </Button>
            </div>
          </Card>
        )}

        {gameType === 'logic-puzzle' && (
          <Card style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Puzzle Sequence Configuration</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {puzzles.map((puzzle, idx) => (
                <div key={idx} style={{ 
                  background: 'var(--bg-tertiary)', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Puzzle {idx + 1}</h3>
                    {puzzles.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = puzzles.filter((_, i) => i !== idx);
                          setPuzzles(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Puzzle Type</label>
                      <select 
                        value={puzzle.type} 
                        onChange={e => {
                          const updated = [...puzzles];
                          updated[idx].type = e.target.value;
                          setPuzzles(updated);
                        }}
                        style={{
                          padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-2)',
                          border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none'
                        }}
                      >
                        <option value="nonogram">Nonogram</option>
                        <option value="shikaku">Shikaku</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Generated Size</label>
                      <select 
                        value={puzzle.size} 
                        onChange={e => {
                          const updated = [...puzzles];
                          updated[idx].size = e.target.value;
                          setPuzzles(updated);
                        }}
                        style={{
                          padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-2)',
                          border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none'
                        }}
                      >
                        <option value="5x5">5x5</option>
                        <option value="7x7">7x7</option>
                        <option value="10x10">10x10</option>
                        <option value="15x15">15x15</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                      Custom Grid JSON (Optional - overrides auto-generation)
                    </label>
                    <textarea 
                      value={puzzle.customGrid}
                      onChange={e => {
                        const updated = [...puzzles];
                        updated[idx].customGrid = e.target.value;
                        setPuzzles(updated);
                      }}
                      placeholder={puzzle.type === 'shikaku' ? "[[null, null, 4], [null, 2, null]]" : "[[true, false], [false, true]]"}
                      style={{
                        width: '100%', height: '100px', padding: '0.75rem',
                        background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                        borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setPuzzles([...puzzles, { type: 'nonogram', size: '10x10', customGrid: '' }])}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={16} /> Add Puzzle
              </Button>
            </div>
          </Card>
        )}

        {gameType === 'map' && (
          <Card style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Map Locations Configuration</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {mapLocations.map((loc, idx) => (
                <div key={idx} style={{ 
                  background: 'var(--bg-tertiary)', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Location {idx + 1}</h3>
                    {mapLocations.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = mapLocations.filter((_, i) => i !== idx);
                          setMapLocations(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <Input 
                      label="Prompt (e.g. Spot India)" 
                      value={loc.prompt}
                      onChange={e => {
                        const updated = [...mapLocations];
                        updated[idx].prompt = e.target.value;
                        setMapLocations(updated);
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <Input 
                      type="number"
                      step="any"
                      label="Latitude" 
                      value={loc.lat}
                      onChange={e => {
                        const updated = [...mapLocations];
                        updated[idx].lat = parseFloat(e.target.value);
                        setMapLocations(updated);
                      }}
                      required
                    />
                    <Input 
                      type="number"
                      step="any"
                      label="Longitude" 
                      value={loc.lng}
                      onChange={e => {
                        const updated = [...mapLocations];
                        updated[idx].lng = parseFloat(e.target.value);
                        setMapLocations(updated);
                      }}
                      required
                    />
                    <Input 
                      type="number"
                      label="Allowed Radius (km)" 
                      value={loc.radiusKm}
                      onChange={e => {
                        const updated = [...mapLocations];
                        updated[idx].radiusKm = parseInt(e.target.value);
                        setMapLocations(updated);
                      }}
                      required
                    />
                  </div>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Use Google Maps to find exact Latitude and Longitude.</p>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setMapLocations([...mapLocations, { prompt: '', lat: 0, lng: 0, radiusKm: 500 }])}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={16} /> Add Location
              </Button>
            </div>
          </Card>
        )}

        {gameType === 'crossword' && (
          <Card style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Crossword Words & Clues</h2>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Enter the answer, a space, and then the clue. <strong>One word/clue pair per line.</strong><br/>
              <em>Example:</em><br/>
              <code>angle A shape made by two lines meeting</code><br/>
              <code>brake Stop a vehicle / sounds like something broken</code>
            </p>

            <textarea 
              value={crosswordText}
              onChange={(e) => setCrosswordText(e.target.value)}
              placeholder="angle A shape made by two lines meeting&#10;brake Stop a vehicle..."
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'monospace',
                lineHeight: '1.5'
              }}
              required
            />
            
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button type="button" variant="secondary" onClick={handlePreviewCrossword} style={{ alignSelf: 'flex-start' }}>
                Preview Layout
              </Button>
              
              {crosswordPreview && (
                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  overflowX: 'auto'
                }}>
                  <div style={{
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${crosswordPreview[0].length}, 30px)`, 
                    gridTemplateRows: `repeat(${crosswordPreview.length}, 30px)`,
                    gap: '0',
                    border: '2px solid var(--glass-border)',
                    backgroundColor: '#000'
                  }}>
                    {crosswordPreview.map((row, r) => (
                      Array.from(row).map((cell, c) => (
                        <div key={`${r},${c}`} style={{ 
                          width: '30px', 
                          height: '30px', 
                          backgroundColor: cell === '-' ? '#1a1a2e' : '#fff',
                          border: cell === '-' ? 'none' : '1px solid #333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {cell !== '-' ? cell : ''}
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <Button type="submit" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
          {id ? 'Update Tournament' : 'Publish Tournament'}
        </Button>
      </form>
    </div>
  );
};

export default CreateTournament;
