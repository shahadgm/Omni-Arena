import { useEffect, useState, useRef } from 'react';

export const useAntiCheat = (onViolation, isPractice) => {
  const [strikes, setStrikes] = useState(0);
  const callbackRef = useRef(onViolation);

  useEffect(() => {
    callbackRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (isPractice) return;

    let isProcessingViolation = false;
    let lastViolationTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('You left the tab or minimized the window.');
      }
    };

    const handleBlur = () => {
      if (isProcessingViolation) return;
      if (Date.now() - lastViolationTime < 2500) return;
      handleViolation('You clicked outside the tournament window.');
    };

    const handleViolation = (reason) => {
      const now = Date.now();
      if (isProcessingViolation || now - lastViolationTime < 2500) return;
      
      isProcessingViolation = true;
      lastViolationTime = now;

      setStrikes(prev => {
        const newStrikes = prev + 1;
        
        // Temporarily detach blur while alert is displayed so the alert dialog doesn't re-trigger blur
        window.removeEventListener('blur', handleBlur);

        if (newStrikes >= 3) {
          alert('Anti-Cheat Violation (3/3): ' + reason + ' Your tournament is being auto-submitted.');
          if (callbackRef.current) callbackRef.current();
        } else {
          alert('Anti-Cheat Warning (' + newStrikes + '/3): ' + reason + ' If you do this again, your test will be auto-submitted.');
          // Re-attach blur listener after user dismisses alert and window refocuses
          setTimeout(() => {
            isProcessingViolation = false;
            window.addEventListener('blur', handleBlur);
          }, 1500);
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
