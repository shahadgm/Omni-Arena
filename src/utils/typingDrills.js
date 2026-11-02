/**
 * Typing Practice Drill Presets & Helpers
 * Supports timed speed drills: 1m, 2m, 5m, 10m, 15m, 30m, and untimed freeflow.
 */

export const TYPING_DRILL_PRESETS = [
  { 
    id: '1m', 
    durationMinutes: 1, 
    seconds: 60, 
    label: '1 Min', 
    title: '1-Minute Sprint', 
    desc: 'Quick reaction speed calibration and burst typing.',
    badge: 'Sprint', 
    icon: '⚡' 
  },
  { 
    id: '2m', 
    durationMinutes: 2, 
    seconds: 120, 
    label: '2 Min', 
    title: '2-Minute Speed Drill', 
    desc: 'Optimal balance of velocity, rhythm, and accuracy.',
    badge: 'Popular', 
    icon: '⏱️' 
  },
  { 
    id: '5m', 
    durationMinutes: 5, 
    seconds: 300, 
    label: '5 Min', 
    title: '5-Minute Benchmark', 
    desc: 'Standard competitive length for typing assessments.',
    badge: 'Standard', 
    icon: '🎯' 
  },
  { 
    id: '10m', 
    durationMinutes: 10, 
    seconds: 600, 
    label: '10 Min', 
    title: '10-Minute Endurance Drill', 
    desc: 'Build sustained typing endurance and finger muscle stamina.',
    badge: 'Endurance', 
    icon: '🔥' 
  },
  { 
    id: '15m', 
    durationMinutes: 15, 
    seconds: 900, 
    label: '15 Min', 
    title: '15-Minute Stamina Drill', 
    desc: 'Deep focus challenge to minimize fatigue and error spikes.',
    badge: 'Stamina', 
    icon: '💪' 
  },
  { 
    id: '30m', 
    durationMinutes: 30, 
    seconds: 1800, 
    label: '30 Min', 
    title: '30-Minute Marathon Drill', 
    desc: 'Ultimate cognitive endurance test for master typists.',
    badge: 'Marathon', 
    icon: '🏆' 
  },
  { 
    id: 'free', 
    durationMinutes: 0, 
    seconds: 0, 
    label: 'Untimed', 
    title: 'Untimed Freeflow Drill', 
    desc: 'Relaxed typing without clock pressure.',
    badge: 'Casual', 
    icon: '♾️' 
  }
];

export const getDrillPreset = (durationMinutes) => {
  if (durationMinutes === undefined || durationMinutes === null) {
    return TYPING_DRILL_PRESETS[1]; // Default to 2 min
  }
  const mins = parseInt(durationMinutes, 10);
  if (isNaN(mins) || mins <= 0) {
    return TYPING_DRILL_PRESETS.find(p => p.id === 'free');
  }
  return TYPING_DRILL_PRESETS.find(p => p.durationMinutes === mins) || {
    id: `${mins}m`,
    durationMinutes: mins,
    seconds: mins * 60,
    label: `${mins} Min`,
    title: `${mins}-Minute Custom Drill`,
    desc: `Custom ${mins}-minute timed typing exercise.`,
    badge: 'Custom',
    icon: '⏱️'
  };
};

export const parseDrillParams = (id = '', searchParams = null) => {
  // Check searchParams first
  const urlParam = searchParams?.get('duration') || searchParams?.get('time');
  if (urlParam) {
    const parsed = parseInt(urlParam, 10);
    if (!isNaN(parsed)) return parsed;
    if (urlParam === 'free' || urlParam === '0') return 0;
  }

  // Check suffix in id (e.g. practice-english-2m, practice-arabic-10m, practice-urdu-15m, practice-english-30m)
  const match = id.match(/-([0-9]+)m$/);
  if (match) {
    return parseInt(match[1], 10);
  }

  if (id.endsWith('-free')) return 0;

  // Default to 2 minutes for typing practice drills
  return 2;
};
