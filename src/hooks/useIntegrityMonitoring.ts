import { useEffect, useRef } from 'react';

export function useIntegrityMonitoring(isActive: boolean) {
  const awaySessionRef = useRef<{
    active: boolean;
    startedAt: number | null;
    reasons: Set<string>;
  }>({
    active: false,
    startedAt: null,
    reasons: new Set(),
  });

  const reportEvent = async (type: 'START' | 'END', payload: any) => {
    try {
      await fetch('/api/integrity/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload }),
      });
    } catch (e) {
      console.error('Integrity reporting failed', e);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const handleLeave = (reason: string) => {
      const state = awaySessionRef.current;
      state.reasons.add(reason);
      
      if (!state.active) {
        state.active = true;
        state.startedAt = Date.now();
        reportEvent('START', { reasons: Array.from(state.reasons) });
      }
    };

    const handleReturn = () => {
      // Check if completely returned: visible, focused, and in fullscreen
      if (!document.hidden && document.hasFocus() && document.fullscreenElement) {
        const state = awaySessionRef.current;
        if (state.active) {
          const duration = Date.now() - (state.startedAt || Date.now());
          reportEvent('END', { 
            reasons: Array.from(state.reasons), 
            durationMs: duration 
          });
          state.active = false;
          state.startedAt = null;
          state.reasons.clear();
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleLeave('TAB_HIDDEN');
      else handleReturn();
    };

    const onBlur = () => {
      handleLeave('WINDOW_BLUR');
    };

    const onFocus = () => {
      handleReturn();
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) handleLeave('FULLSCREEN_EXIT');
      else handleReturn();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Initial check in case it's already not in fullscreen/focused
    if (document.hidden) handleLeave('TAB_HIDDEN');
    else if (!document.hasFocus()) handleLeave('WINDOW_BLUR');
    else if (!document.fullscreenElement) handleLeave('FULLSCREEN_EXIT');

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [isActive]);
}
