'use client';

import React, { useState, useEffect } from 'react';

interface StrictModeProtectionProps {
  strictMode: boolean;
  isSubmissionsLocked: boolean;
  remainingSwitches: number;
  onCheckStatus: () => Promise<void>;
  children: React.ReactNode;
}

export default function StrictModeProtection({ 
  strictMode, 
  isSubmissionsLocked,
  remainingSwitches,
  onCheckStatus,
  children 
}: StrictModeProtectionProps) {
  const [isProtected, setIsProtected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!strictMode) {
      setIsProtected(false);
      return;
    }

    const handleFocusLoss = () => {
      setIsProtected(true);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    const onBlur = () => {
      handleFocusLoss();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    // Initial check
    if (document.hidden || !document.hasFocus()) {
      handleFocusLoss();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [strictMode]);

  const handleResume = async () => {
    // Only allow resume if actually focused and visible
    if (!document.hidden && document.hasFocus()) {
      setIsChecking(true);
      try {
        await onCheckStatus();
        // We don't hide it immediately here if submissions are locked, because the re-render will handle it
        // Wait, if isSubmissionsLocked is true, it shouldn't be hidden.
        // Actually, we can just hide `isProtected` if submissions are NOT locked.
        // If they are locked, they stay locked.
        setIsProtected(false);
      } finally {
        setIsChecking(false);
      }
    } else {
      alert("Please ensure the competition window is visible and focused before resuming.");
    }
  };

  return (
    <>
      {children}
      {(isProtected || isSubmissionsLocked) && strictMode && (
        <div 
          className="fixed inset-0 bg-black z-[2147483647] flex flex-col items-center justify-center text-white p-6"
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'black', zIndex: 2147483647 }}
        >
          <div className="bg-[#0a0a1a] border border-[#1e1e3a] rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-500/10 p-4 rounded-full border border-red-500/30">
                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            {isSubmissionsLocked ? (
              <>
                <h2 className="text-2xl font-bold mb-2 text-red-500">IDE LOCKED</h2>
                <p className="text-slate-400 mb-8">
                  You have exceeded the maximum allowed tab switches or your IDE has been locked by an administrator.
                  <br/><br/>
                  Please wait for an administrator to review your activity and release your submissions.
                </p>
                <div className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-lg cursor-not-allowed">
                  Awaiting Admin Review...
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">Screen Protected</h2>
                <p className="text-slate-400 mb-6">
                  The competition window lost focus or was hidden. 
                  <br/><br/>
                  Switching applications, changing tabs, or minimizing the browser is recorded as a strict mode violation.
                </p>
                
                {remainingSwitches <= 2 && (
                  <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
                    WARNING: You have {remainingSwitches} tab switch{remainingSwitches === 1 ? '' : 'es'} remaining before your IDE is automatically locked.
                  </div>
                )}
                
                <button
                  onClick={handleResume}
                  disabled={isChecking}
                  className={`w-full py-4 font-bold rounded-lg transition-colors ${isChecking ? 'bg-emerald-600/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'}`}
                >
                  {isChecking ? 'Checking status...' : 'Resume Competition'}
                </button>
              </>
            )}
            <p className="text-[10px] text-slate-600 mt-4 uppercase tracking-widest font-mono">
              Event logged to Administrator
            </p>
          </div>
        </div>
      )}
    </>
  );
}
