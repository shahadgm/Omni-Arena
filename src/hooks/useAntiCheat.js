import { useEffect, useState, useRef } from 'react';

export const useAntiCheat = (onViolation, isPractice) => {
  const [strikes, setStrikes] = useState(0);
  const callbackRef = useRef(onViolation);

  useEffect(() => {
    callbackRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (isPractice) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('You left the tab or minimized the window.');
      }
    };

    const handleBlur = () => {
      handleViolation('You clicked outside the tournament window.');
    };

    const handleViolation = (reason) => {
      setStrikes(prev => {
        const newStrikes = prev + 1;
        if (newStrikes >= 3) {
          alert('Anti-Cheat Violation (3/3): ' + reason + ' Your tournament is being auto-submitted.');
          if (callbackRef.current) callbackRef.current();
        } else {
          alert('Anti-Cheat Warning (' + newStrikes + '/3): ' + reason + ' If you do this again, your test will be auto-submitted.');
        }
        return newStrikes;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPractice]);

  return strikes;
};
