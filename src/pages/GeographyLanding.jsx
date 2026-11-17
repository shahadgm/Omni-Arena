import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  MapPin, Globe, Compass, Mountain, Waves, Sun, Trees, 
  Landmark, Trophy, ChevronRight, Zap, CheckCircle2, Shield, Eye
} from 'lucide-react';
import { authService } from '../services/db';

const GeographyLanding = () => {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const startPlaying = (targetPath = '/arena/practice-map') => {
    const isLoggedIn = !!localStorage.getItem('studentId') || authService.isAuthenticated();
    if (isLoggedIn) {
      navigate(targetPath);
    } else {
      // Auto-assign clean guest contestant for zero-friction instant play
      const finalName = `Explorer-${Math.floor(1000 + Math.random() * 9000)}`;
      authService.setGuestContestant(finalName);
      navigate(targetPath);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const finalName = guestName.trim() || `Explorer-${Math.floor(1000 + Math.random() * 9000)}`;
    authService.setGuestContestant(finalName);
    setShowNameModal(false);
    navigate(pendingAction || '/arena/practice-map');
  };

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Omni Arena Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: 'var(--disc-map)', fontWeight: '600' }}>Geography Map Arena</span>
      </nav>

      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '24px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '1.25rem',
          color: 'var(--disc-map)',
          fontSize: '0.85rem',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <MapPin size={16} /> Omni Arena Interactive Vector Map Challenges
        </div>

        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 'clamp(2rem, 5vw, 3.25rem)', 
          fontWeight: '800', 
          lineHeight: '1.15', 
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          India &amp; World Map <span style={{ color: 'var(--disc-map)' }}>Geography Quiz</span> — Omni Arena
        </h1>

        <p style={{ 
          fontSize: '1.15rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '720px', 
          margin: '0 auto 2rem auto', 
          lineHeight: 1.6 
        }}>
          Test your geography skills on the official Omni Arena platform with real-time vector maps. Spot all 28 Indian States &amp; 8 UTs, 60+ major Indian cities, famous heritage monuments, world capitals, and physical landforms with zero spoilers.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Button 
            variant="primary" 
            onClick={() => startPlaying('/arena/practice-map')}
            style={{ 
              padding: '0.85rem 1.75rem', 
              fontSize: '1.05rem', 
              fontWeight: '700', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: 'var(--disc-map)',
              borderColor: 'var(--disc-map)'
            }}
          >
            Launch Map Arena <Zap size={18} />
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => {
              const el = document.getElementById('categories-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: '600' }}
          >
            Explore Map Topics <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* Feature Highlights Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Why OmniArena Map Quiz is Ranked #1
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Engineered with high-speed vector SVG technology, designed for competitive students, geography bees, and classroom tournaments.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              icon: <Eye size={24} color="var(--disc-map)" />,
              title: 'Zero-Spoiler Unlabeled Basemap',
              desc: 'Labels stay completely hidden while you zoom and pan. You only see geographical boundaries, eliminating spoiler hints.'
            },
            {
              icon: <MapPin size={24} color="var(--disc-map)" />,
              title: 'Precise Coordinate Targeting',
              desc: 'Click anywhere on the map to pin cities, monuments, and geographic landmarks with millisecond distance tolerance checking.'
            },
            {
              icon: <Compass size={24} color="var(--disc-map)" />,
              title: 'Smooth D3 Vector Zoom & Pan',
              desc: 'Pinch, scroll, and drag with instant SVG rendering. No CARTO API keys or third-party tile watermarks required.'
            },
            {
              icon: <Trophy size={24} color="var(--gold)" />,
              title: 'Live Olympic Podiums & Medals',
              desc: 'Compete against classmates or private tournament participants with real-time scoring and instant podium celebrations.'
            },
            {
              icon: <Shield size={24} color="var(--success)" />,
              title: 'Classroom & Anti-Cheat Ready',
              desc: 'Organizers can generate 6-digit room PINs, customize custom map sets, and enforce tab-switch telemetry guards.'
            },
            {
              icon: <Globe size={24} color="var(--disc-map)" />,
              title: 'India & Global Coverage',
              desc: 'Seamless auto-detection routes Indian locations to the high-detail India TopoJSON and global questions to the world map.'
            }
          ].map((item, idx) => (
            <Card key={idx} hoverEffect={true} style={{ padding: '1.75rem', height: '100%' }}>
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.25rem' 
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Map Categories Showcase Section */}
      <section id="categories-section" style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Curated Geography Categories &amp; Datasets
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Comprehensive curricula covering political borders, cultural landmarks, and physical geography.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              id: 'india-states',
              icon: <MapPin size={22} color="#10B981" />,
              title: 'India: States & Union Territories',
              count: '36 Territories',
              desc: 'All 28 Indian States and 8 Union Territories with political boundaries and capital cities.'
            },
            {
              id: 'india-cities',
              icon: <Landmark size={22} color="#F59E0B" />,
              title: 'India: 60+ Major Cities',
              count: '60+ Cities',
              desc: 'Locate Tier-1 & Tier-2 cities including Delhi, Mumbai, Bengaluru, Hyderabad, Kolkata, Chennai, and Jaipur.'
            },
            {
              id: 'india-tourist-places',
              icon: <Landmark size={22} color="#EC4899" />,
              title: 'India: Tourist Places & Heritage Sites',
              count: '60+ Monuments',
              desc: 'UNESCO World Heritage spots: Taj Mahal, Hawa Mahal, Ajanta Caves, Golden Temple, Qutub Minar, and Meenakshi Temple.'
            },
            {
              id: 'countries',
              icon: <Globe size={22} color="#3B82F6" />,
              title: 'Countries of the World',
              count: '190+ Countries',
              desc: 'Sovereign nation borders across North America, South America, Europe, Asia, Africa, and Oceania.'
            },
            {
              id: 'oceans',
              icon: <Waves size={22} color="#06B6D4" />,
              title: 'Oceans, Seas & Major Lakes',
              count: '30+ Water Bodies',
              desc: 'Arabian Sea, Bay of Bengal, Mediterranean, Caspian Sea, Indian Ocean, and major global water bodies.'
            },
            {
              id: 'mountains',
              icon: <Mountain size={22} color="#8B5CF6" />,
              title: 'Mountain Ranges & Peaks',
              count: '25+ Ranges',
              desc: 'Himalayas, Western Ghats, Eastern Ghats, Karakoram, Alps, Andes, Rockies, and Urals.'
            },
            {
              id: 'deserts',
              icon: <Sun size={22} color="#EAB308" />,
              title: 'Deserts of the World',
              count: '15+ Deserts',
              desc: 'Thar Desert, Sahara, Arabian, Gobi, Atacama, and Kalahari arid regions.'
            },
            {
              id: 'grasslands',
              icon: <Trees size={22} color="#14B8A6" />,
              title: 'Grasslands, Plains & Plateaus',
              count: '20+ Landforms',
              desc: 'Deccan Plateau, Tibetan Plateau, Indo-Gangetic Plain, Prairies, Steppes, Savannas, and Pampas.'
            }
          ].map((cat, idx) => (
            <Card key={idx} hoverEffect={true} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'var(--surface-2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {cat.icon}
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '12px', 
                  background: 'var(--surface-2)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}>
                  {cat.count}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                {cat.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0', flex: 1 }}>
                {cat.desc}
              </p>
              <Button 
                variant="secondary" 
                onClick={() => startPlaying(`/arena/practice-map?category=${cat.id}`)}
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', fontWeight: '700' }}
              >
                Play This Category <ChevronRight size={14} />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works & Gameplay Rules */}
      <section style={{ 
        background: 'var(--surface-2)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px', 
        padding: '2.5rem 2rem', 
        marginBottom: '4rem' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '2rem' }}>
            How to Play OmniArena Geography Match
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--disc-map)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                1
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Read the Challenge Prompt</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  The arena prompts you with a specific location (e.g., <em>"Find this state: Karnataka"</em> or <em>"Locate Jaipur (Pink City)"</em>).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--disc-map)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                2
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Zoom, Pan &amp; Click the Location</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Use your mouse, trackpad, or touchscreen to navigate the vector map. Click the matching polygon or pin spot.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--disc-map)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Instant Scoring &amp; Live Podium Finish</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Gain points for correct answers and speed bonuses. Claim your spot on the live Olympic podium!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Frequently Asked Questions Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '2rem' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '850px', margin: '0 auto' }}>
          {[
            {
              q: 'Is the OmniArena Geography Map Quiz completely free?',
              a: 'Yes, OmniArena Geography is 100% free with no subscription, no credit card, and no software download required. You can play directly in any modern web browser.'
            },
            {
              q: 'Does OmniArena include all Indian states, union territories, and cities?',
              a: 'Yes! It covers all 28 Indian States, 8 Union Territories, 60+ major Tier-1 and Tier-2 Indian cities, and 60+ famous tourist landmarks and UNESCO Heritage monuments.'
            },
            {
              q: 'Can teachers or organizers host private geography tournaments?',
              a: 'Absolutely. Organizers can create private tournament rooms with custom 6-digit PIN codes, select custom map categories or questions, and monitor live student leaderboards.'
            },
            {
              q: 'How does OmniArena prevent map spoilers and cheating?',
              a: 'Our maps use unlabeled vector SVG basemaps that display clean geographic boundaries without spoiling place names upon zooming. Additionally, anti-cheat telemetry detects window switching during tournaments.'
            }
          ].map((faq, idx) => (
            <Card key={idx} style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {faq.q}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem', 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
        border: '1px solid var(--border)',
        borderRadius: '16px'
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          Ready to Test Your Geography Knowledge?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Join thousands of contestants competing in daily map trivia and geography sprint tournaments.
        </p>
        <Button 
          variant="primary" 
          onClick={() => startPlaying('/arena/practice-map')}
          style={{ 
            padding: '0.9rem 2rem', 
            fontSize: '1.05rem', 
            fontWeight: '700',
            backgroundColor: 'var(--disc-map)',
            borderColor: 'var(--disc-map)'
          }}
        >
          Play Free Map Quiz Now <Zap size={18} style={{ marginLeft: '0.4rem' }} />
        </Button>
      </div>

      {/* Guest Name Modal if not logged in */}
      {showNameModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Enter Geography Arena</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Choose a display name to enter the competition leaderboard.
            </p>
            <form onSubmit={handleGuestSubmit}>
              <input
                type="text"
                placeholder="e.g. AtlasRunner or Alex"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowNameModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--disc-map)', borderColor: 'var(--disc-map)' }}>
                  Start Playing
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalApplication",
          "name": "OmniArena Geography Map Quiz",
          "url": "https://omni-arena.vercel.app/geography",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "All modern web browsers",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "educationalLevel": "Beginner to Advanced",
          "learningResourceType": "Interactive Map Quiz Game",
          "about": [
            "India States and Union Territories",
            "Indian Cities and Monuments",
            "World Countries and Capitals",
            "Physical Geography and Landforms"
          ]
        })
      }} />
    </div>
  );
};

export default GeographyLanding;
