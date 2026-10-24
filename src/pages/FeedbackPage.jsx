import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { dbService, authService } from '../services/db';
import { 
  Bug, Lightbulb, Star, MessageSquare, Send, CheckCircle2, 
  ArrowLeft, AlertCircle, Sparkles, Laptop
} from 'lucide-react';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const rawName = currentUser?.displayName || localStorage.getItem('displayName') || currentUser?.username || localStorage.getItem('studentId') || '';
  const defaultDisplayName = rawName ? rawName.replace(/^guest:/, '') : '';

  // Form State
  const [feedbackType, setFeedbackType] = useState('bug'); // 'bug' | 'suggestion' | 'review'
  const [category, setCategory] = useState('arena');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customName, setCustomName] = useState(defaultDisplayName);
  const [isAnonymous, setIsAnonymous] = useState(!defaultDisplayName);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Recent reviews preview
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const list = await dbService.getFeedbackList();
        const reviews = list.filter(item => item.type === 'review' && item.rating && item.rating >= 4);
        setRecentReviews(reviews.slice(0, 3));
      } catch (err) {
        console.error("Error loading reviews:", err);
      }
    };
    fetchRecent();
  }, [submitted]);

  const ratingLabels = {
    1: 'Needs Improvement',
    2: 'Fair Experience',
    3: 'Good Platform',
    4: 'Great Experience',
    5: 'Exceptional Platform!'
  };

  const bugCategories = [
    { id: 'typing', label: '⌨️ Typing Arena' },
    { id: 'quiz', label: '❓ Quiz Competition' },
    { id: 'puzzles', label: '🧩 Logic Puzzles (Nonogram & Shikaku)' },
    { id: 'crossword', label: '📝 Crossword Arena' },
    { id: 'map', label: '🗺️ Map Spotting' },
    { id: 'leaderboard', label: '🏆 Leaderboards & Scoring' },
    { id: 'anticheat', label: '🛡️ Anti-Cheat & Lockouts' },
    { id: 'mobile', label: '📱 Mobile Display / Layout' },
    { id: 'other', label: '⚙️ Other Bug' }
  ];

  const suggestionCategories = [
    { id: 'new-gamemode', label: '🎮 New Game Mode or Discipline' },
    { id: 'tournament-settings', label: '⚙️ Tournament Options & Timers' },
    { id: 'leaderboards', label: '🏅 Leaderboard & Podium Features' },
    { id: 'practice-hub', label: '🎯 Solo Practice Drills' },
    { id: 'ui-design', label: '🎨 Interface, Sound & Aesthetics' },
    { id: 'classroom', label: '🏫 School & Classroom Tools' },
    { id: 'other', label: '💡 Other Improvement' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (message.trim().length < 3) {
      setError('Please provide at least a few words describing your feedback.');
      return;
    }

    setLoading(true);
    try {
      await dbService.submitFeedback({
        type: feedbackType,
        category,
        title: title.trim(),
        message: message.trim(),
        rating: feedbackType === 'review' ? rating : null,
        name: isAnonymous ? 'Anonymous' : (customName.trim() || 'Anonymous')
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setMessage('');
    setError('');
    setSubmitted(false);
  };

  return (
    <div className="container" style={{ maxWidth: '840px', margin: '0 auto', padding: '1rem', paddingBottom: '4rem' }}>
      
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            color: 'var(--text-secondary)', 
            textDecoration: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.35rem 0.85rem', 
          borderRadius: '20px', 
          background: 'var(--surface-2)', 
          border: '1px solid var(--border)',
          fontSize: '0.85rem',
          color: 'var(--primary-text)',
          marginBottom: '0.75rem',
          fontWeight: '600'
        }}>
          <MessageSquare size={14} /> Community & Support
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          Help Shape <span className="text-gradient">OmniArena</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.5rem', maxWidth: '580px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
          Encountered a bug, have an idea for a new game mode, or want to leave a review? We read every submission.
        </p>
      </div>

      {submitted ? (
        <Card style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(52, 211, 153, 0.12)', 
              border: '1px solid var(--success)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--success)'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text)' }}>
                Thank You for Your Feedback!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                {feedbackType === 'bug' && "Your bug report has been logged. Our developers will inspect the issue to keep tournaments fair and stable."}
                {feedbackType === 'suggestion' && "Your suggestion has been added to our development backlog. Thanks for helping improve the arena!"}
                {feedbackType === 'review' && "Your review has been recorded. Thank you for being a part of OmniArena!"}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.75rem' }}>
              <Button variant="primary" onClick={handleResetForm}>
                Submit Another Response
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Feedback Type Selector */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            {[
              {
                id: 'bug',
                title: 'Report a Bug',
                desc: 'Broken layout, arena glitch, timer or anti-cheat issues.',
                icon: <Bug size={22} />,
                color: 'var(--danger)'
              },
              {
                id: 'suggestion',
                title: 'Suggest Improvement',
                desc: 'New game modes, features, sound effects, or UX ideas.',
                icon: <Lightbulb size={22} />,
                color: 'var(--primary-text)'
              },
              {
                id: 'review',
                title: 'Submit a Review',
                desc: 'Rate your overall experience and share your thoughts.',
                icon: <Star size={22} />,
                color: 'var(--gold)'
              }
            ].map(item => {
              const active = feedbackType === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setFeedbackType(item.id);
                    if (item.id === 'bug') setCategory('typing');
                    else if (item.id === 'suggestion') setCategory('new-gamemode');
                    setError('');
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: active ? `2px solid var(--primary)` : '1px solid var(--border)',
                    background: active ? 'rgba(79, 70, 229, 0.12)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: active ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                    <div style={{ color: item.color }}>{item.icon}</div>
                    <strong style={{ fontSize: '1rem', color: active ? 'var(--text)' : 'var(--text-secondary)' }}>{item.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Main Form Card */}
          <Card style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Star Rating Section (For Reviews) */}
              {feedbackType === 'review' && (
                <div style={{ 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    How would you rate OmniArena?
                  </label>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    {[1, 2, 3, 4, 5].map(star => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            fontSize: '2rem',
                            color: isFilled ? 'var(--gold)' : 'var(--border)',
                            transition: 'transform 0.1s ease',
                            transform: (hoverRating || rating) === star ? 'scale(1.2)' : 'scale(1)'
                          }}
                          aria-label={`${star} star`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-text)' }}>
                    {ratingLabels[hoverRating || rating]}
                  </div>
                </div>
              )}

              {/* Category Selector (For Bugs & Suggestions) */}
              {feedbackType !== 'review' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {feedbackType === 'bug' ? 'Affected Arena / Area' : 'Suggestion Category'}
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    {(feedbackType === 'bug' ? bugCategories : suggestionCategories).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title / Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {feedbackType === 'bug' && 'Short Summary of the Issue'}
                  {feedbackType === 'suggestion' && 'Idea Headline'}
                  {feedbackType === 'review' && 'Review Headline'}
                </label>
                <Input
                  placeholder={
                    feedbackType === 'bug' ? 'e.g. Map question pins did not appear in Safari' :
                    feedbackType === 'suggestion' ? 'e.g. Add dark/light theme switch shortcut key' :
                    'e.g. Great variety of logic puzzles and typing tests!'
                  }
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Detailed Message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {feedbackType === 'bug' && 'What happened? Steps to reproduce:'}
                  {feedbackType === 'suggestion' && 'Explain your idea and why it would be helpful:'}
                  {feedbackType === 'review' && 'Your feedback & comments:'}
                  <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder={
                    feedbackType === 'bug' ? 'Please describe what you did, what went wrong, and any error message you saw...' :
                    feedbackType === 'suggestion' ? 'Describe how this feature could work and how it benefits contestants or hosts...' :
                    'Share what you like about the arena and what could make it even better...'
                  }
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Submitter Name & Identity */}
              <div style={{ 
                padding: '1rem', 
                background: 'var(--surface-2)', 
                borderRadius: '8px', 
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Submission Identity
                  </span>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    Submit Anonymously
                  </label>
                </div>

                {!isAnonymous && (
                  <Input 
                    placeholder="Your Name (optional)"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    style={{ fontSize: '0.9rem' }}
                  />
                )}
              </div>

              {/* Auto Environment Info Tag for Bugs */}
              {feedbackType === 'bug' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  <Laptop size={14} />
                  <span>Browser & device diagnostic information will be automatically attached to help resolve this bug.</span>
                </div>
              )}

              {error && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading || message.trim().length < 3}
                style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={16} />
                    {feedbackType === 'bug' && 'Submit Bug Report'}
                    {feedbackType === 'suggestion' && 'Send Improvement Suggestion'}
                    {feedbackType === 'review' && 'Submit Review'}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Community Reviews Section */}
          {recentReviews.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Sparkles size={18} style={{ color: 'var(--gold)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: 'var(--text)' }}>Community Reviews</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {recentReviews.map(rev => (
                  <Card key={rev.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--gold)', letterSpacing: '2px' }}>
                        {'★'.repeat(rev.rating || 5)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {rev.title && (
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                        {rev.title}
                      </strong>
                    )}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                      "{rev.message}"
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'auto', paddingTop: '0.25rem' }}>
                      — {rev.displayName || 'Contestant'}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackPage;
