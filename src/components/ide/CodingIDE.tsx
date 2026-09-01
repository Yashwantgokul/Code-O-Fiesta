'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Hooks
import { useProblemState } from '@/hooks/useProblemState';
import { useCodingIDE } from '@/hooks/useCodingIDE';
import { useIntegrityMonitoring } from '@/hooks/useIntegrityMonitoring';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Types
import { RoundIDEConfig } from '@/types/problem';

// Services
import { problemsService } from '@/services/problems';

// Subcomponents
import ProblemPanel from '@/components/problems/ProblemPanel';
import EditorToolbar from './EditorToolbar';
import EditorStatus from './EditorStatus';
import EditorLockOverlay from './EditorLockOverlay';
import ConsolePanel from './ConsolePanel';
import CustomInput from './CustomInput';
import OutputPanel from './OutputPanel';
import VerdictPanel from '@/components/submissions/VerdictPanel';
import RunButton from './RunButton';
import SubmitButton from './SubmitButton';
import SubmissionController from '@/components/submissions/SubmissionController';
import SubmissionResult from '@/components/submissions/SubmissionResult';
import SubmissionHistory from '@/components/submissions/SubmissionHistory';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

// Round 2 Overlays
import ActiveMemberIndicator from '@/components/round2/ActiveMemberIndicator';
import RelayStatus from '@/components/round2/RelayStatus';
import StrictModeProtection from './StrictModeProtection';


const CodeEditor = dynamic(() => import('./CodeEditor'), { ssr: false });

interface CodingIDEProps {
  problemId: string;
  roundNumber: 1 | 2 | 3;
  mode: 'standard' | 'relay' | 'constraint';
  roundConfig?: RoundIDEConfig;
  onSolve?: (submissionId: string) => void;
  onError?: (error: string) => void;
  readOnly?: boolean;
  hideProblemStatement?: boolean;
  // Separate from readOnly: lets a member keep editing code while being
  // barred from submitting it (e.g. Round 2's Member 1, who writes code but
  // never submits — only Member 2 does).
  canSubmit?: boolean;
}

export default function CodingIDE({
  problemId,
  roundNumber,
  mode,
  roundConfig,
  onSolve,
  onError,
  readOnly = false,
  hideProblemStatement = false,
  canSubmit = true,
}: CodingIDEProps) {
  // 1. Fetch Problem State
  const {
    problem,
    isLoading: isProblemLoading,
    error: problemError,
    examples,
    constraints,
    isSolved,
    nextProblemId,
    prevProblemId,
    round3Status,
  } = useProblemState(problemId, roundNumber, !hideProblemStatement);

  // Round 1 (standard) and Round 3 (constraint) both allow editing/resubmitting
  // a solved problem — Round 1 to keep refining a solution, Round 3 to chase
  // the Short & Sweet / Recursion bonuses. Only relay mode (Round 2) locks
  // once solved; it primarily gates on turn/phase via the readOnly prop.
  const lockAfterSolve = mode === 'relay' && isSolved;

  // 2. Fetch IDE state
  const {
    code,
    setCode,
    language,
    setLanguage,
    customInput,
    setCustomInput,
    isRunning,
    isSubmitting,
    runResult,
    submitResult,
    submissionHistory,
    isLocked,
    errorMsg,
    run,
    submit,
    resetCode,
    fetchHistory,
  } = useCodingIDE(problemId, mode, roundNumber, roundConfig, readOnly || lockAfterSolve);

  // 3. UI and layout states
  const [splitWidth, setSplitWidth] = useState(40); // left panel width %
  const [isLgScreen, setIsLgScreen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'problem' | 'code'>('problem');
  const [consoleTab, setConsoleTab] = useState<'input' | 'output' | 'verdict'>('input');
  const [showFullVerdict, setShowFullVerdict] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);

  // 4. Integrity Monitoring
  useIntegrityMonitoring(true, problem?.id as string | undefined || null);
  const { strictMode, copyPasteBlocker, maxTabSwitches } = useGlobalSettings();

  const { data: integrityData, mutate: mutateIntegrity } = useSWR('/api/integrity/status', fetcher, {
    refreshInterval: 5000,
  });
  const isSubmissionsLocked = integrityData?.isSubmissionsLocked || false;
  const awaySessionCount = integrityData?.awaySessionCount || 0;
  const remainingSwitches = Math.max(0, maxTabSwitches - awaySessionCount);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    setIsBrowserFullscreen(!!document.fullscreenElement);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error('Failed to enter fullscreen', e);
    }
  };

  // Relay time is display-only. The Round 2 page refreshes authoritative
  // server timestamps; this component never changes competition state.
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const isDraggingSplit = useRef(false);

  // Sync isLgScreen on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsLgScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync the latest server-calculated remaining duration for display.
  useEffect(() => {
    if (mode === 'relay') {
      const initialMs = roundConfig?.forceSwitchAfterMs || 600_000;
      setTimeLeft(Math.floor(initialMs / 1000));
    }
  }, [mode, roundConfig?.forceSwitchAfterMs, roundConfig?.activeTeamMember]);


  // Auto-switch tabs when actions complete
  useEffect(() => {
    if (runResult) {
      setConsoleTab('output');
      setIsConsoleExpanded(true);
    }
  }, [runResult]);

  useEffect(() => {
    if (submitResult) {
      setConsoleTab('verdict');
      setShowFullVerdict(true);
      setIsConsoleExpanded(true);
    }
  }, [submitResult]);

  useEffect(() => {
    if (isRunning || isSubmitting) {
      setIsConsoleExpanded(true);
    }
  }, [isRunning, isSubmitting]);

  // Error logging prop trigger
  useEffect(() => {
    if (errorMsg && onError) {
      onError(errorMsg);
    }
  }, [errorMsg, onError]);

  // Resizing split panels
  const startSplitDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplit.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onSplitDrag);
    document.addEventListener('mouseup', stopSplitDrag);
  };

  const onSplitDrag = (e: MouseEvent) => {
    if (!isDraggingSplit.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 80) {
      setSplitWidth(newWidth);
    }
  };

  const stopSplitDrag = () => {
    isDraggingSplit.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onSplitDrag);
    document.removeEventListener('mouseup', stopSplitDrag);
  };

  if (isProblemLoading) {
    return <LoadingState message="Loading problems details..." />;
  }

  if (problemError || !problem) {
    return <ErrorState message={problemError || 'Problem details could not be loaded.'} />;
  }

  if (strictMode && !isBrowserFullscreen) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a1a] text-white p-6 text-center z-50 fixed inset-0">
        <div className="mb-6 bg-red-500/10 p-4 rounded-full border border-red-500/30">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Fullscreen Mode Required</h1>
        <p className="text-slate-400 max-w-md mb-8">
          This contest requires you to remain in fullscreen mode. Exiting fullscreen, switching tabs, or minimizing the window will be recorded as suspicious activity.
        </p>
        <button
          onClick={requestFullscreen}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-purple-500/20"
        >
          Enter Fullscreen to Continue
        </button>
      </div>
    );
  }

  // Handle restoring code callback from history
  const handleRestoreCode = (restoredCode: string, restoredLang: string) => {
    setCode(restoredCode);
    setLanguage(restoredLang as any);
  };

  // Submission controller values bundle
  const controllerValue = {
    runResult,
    submitResult,
    isRunning,
    isSubmitting,
    submissionHistory,
    isLocked,
    errorMsg,
    run,
    submit: () => submit(onSolve),
    resetCode,
    fetchHistory,
  };

  if (integrityData?.isDisqualified) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="bg-[#0a0a1a] border-2 border-red-900 rounded-xl p-10 max-w-lg w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
          <svg className="w-20 h-20 text-red-600 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-3xl font-black text-red-500 mb-4 tracking-wider uppercase">Team Disqualified</h2>
          <p className="text-slate-400 text-lg">
            Your team has been disqualified from the competition by the administrators due to a violation of the event guidelines.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubmissionController value={controllerValue}>
      <StrictModeProtection 
        strictMode={strictMode}
        isSubmissionsLocked={isSubmissionsLocked}
        remainingSwitches={remainingSwitches}
        onCheckStatus={async () => { await mutateIntegrity(); }}
      >
        {/* Main Page Layout Wrapper */}
        <div className={`flex flex-col h-screen lg:h-screen bg-[#0a0a1a] select-none text-white ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''}`}>
        
        {/* Relay Round Info Header */}
        {mode === 'relay' && roundConfig && (
          <div className="flex justify-between items-center px-6 py-2.5 bg-[#080814] border-b border-[var(--border)]">
            <ActiveMemberIndicator activeTeamMember={roundConfig.activeTeamMember} />
            <div className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
              BLIND RELAY ACTIVE
            </div>
          </div>
        )}

        {/* Tab Switch Warning Banner */}
        {strictMode && remainingSwitches <= 2 && !isSubmissionsLocked && (
          <div className="bg-red-500/20 border-b border-red-500/50 px-6 py-2 flex items-center justify-center gap-2 text-red-200 text-sm font-medium">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            WARNING: You have {remainingSwitches} tab switch{remainingSwitches === 1 ? '' : 'es'} remaining before your IDE is automatically locked.
          </div>
        )}

        <div className="flex flex-col lg:flex-row flex-grow overflow-hidden relative">
          {/* Left panel: Problem description */}
          <div
            style={{ width: isLgScreen ? `${splitWidth}%` : '100%' }}
            className={`${mobileTab === 'problem' ? 'flex' : 'hidden'} lg:flex flex-col h-full overflow-hidden`}
          >
            <ProblemPanel
              problem={problem}
              mode={mode}
              activeConstraints={roundConfig?.activeConstraints}
              hideProblemStatement={hideProblemStatement}
              prevProblemId={prevProblemId}
              nextProblemId={nextProblemId}
              submitResult={submitResult}
              submissionCount={submissionHistory.length}
              isSolved={isSolved}
              round3Status={round3Status}
              onNavigate={(id) => {
                // Navigate to next/prev problem using dynamic round path
                window.location.href = `/round-${roundNumber}/problem/${id}`;
              }}
              onUseAsInput={(text) => {
                setCustomInput(text);
                setConsoleTab('input');
              }}
              submissionHistoryChild={
                <SubmissionHistory 
                  history={submissionHistory} 
                  onRestoreCode={handleRestoreCode} 
                />
              }
            />
          </div>

          {/* Separator Line */}
          <div
            onMouseDown={startSplitDrag}
            className="hidden lg:block w-1.5 h-full cursor-col-resize hover:bg-purple-500/40 bg-[#080814] border-l border-r border-[var(--border-subtle)] z-20"
            title="Drag to resize panels"
          />

          {/* Right panel: Editor & Output console */}
          <div
            style={{ width: isLgScreen ? `${100 - splitWidth}%` : '100%' }}
            className={`${mobileTab === 'code' ? 'flex' : 'hidden'} lg:flex flex-col h-full overflow-hidden`}
          >
            <div className="flex flex-col flex-grow relative overflow-hidden">
              <EditorToolbar
                language={language}
                onLanguageChange={setLanguage}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                onResetCode={() => { resetCode(); setEditorResetKey(k => k + 1); }}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(f => !f)}
                mode={mode}
              />

              {/* CodeEditor Wrapper with absolute overlay support */}
              <div className="flex-grow relative overflow-hidden bg-[#0d0d1f]">
                <CodeEditor
                  key={editorResetKey}
                  value={code}
                  onChange={setCode}
                  language={language}
                  fontSize={fontSize}
                  readOnly={isLocked}
                  copyPasteBlocker={copyPasteBlocker}
                  violations={submitResult?.constraintViolations}
                  onCursorChange={(line, col) => setCursorPosition({ line, column: col })}
                />
                
                {/* Lock Overlay */}
                <EditorLockOverlay
                  locked={isLocked}
                  mode={mode}
                  activeTeamMemberName={roundConfig?.activeTeamMember === 'member1' ? 'Member 1' : 'Member 2'}
                  readOnly={readOnly || lockAfterSolve}
                />
              </div>

              <EditorStatus
                language={language}
                cursorPosition={cursorPosition}
                submissionCount={submissionHistory.length}
                timerSeconds={mode === 'relay' ? timeLeft : undefined}
              />
            </div>

            {/* Bottom Console Panel */}
            {isConsoleExpanded && (
              <div className="flex-shrink-0">
                <ConsolePanel
                  activeTab={consoleTab}
                  onTabChange={setConsoleTab}
                  customInputChild={
                    <CustomInput
                      value={customInput}
                      onChange={setCustomInput}
                      exampleInput={examples[0]?.input || ''}
                    />
                  }
                  outputChild={
                    <OutputPanel runResult={runResult} isRunning={isRunning} errorMsg={errorMsg} />
                  }
                  verdictChild={
                    showFullVerdict ? (
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-2 px-1">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Verdict Details</span>
                          <button
                            onClick={() => setShowFullVerdict(false)}
                            type="button"
                            className="text-[10px] font-mono text-purple-400 hover:text-purple-300 underline cursor-pointer"
                          >
                            Back to Summary
                          </button>
                        </div>
                        <div className="flex-grow overflow-auto">
                          <VerdictPanel 
                            submitResult={submitResult} 
                            submissionCount={submissionHistory.length} 
                            mode={mode} 
                          />
                        </div>
                      </div>
                    ) : (
                      <SubmissionResult
                        submitResult={submitResult}
                        isSubmitting={isSubmitting}
                        onViewFullVerdict={() => setShowFullVerdict(true)}
                        mode={mode}
                        submissionCount={submissionHistory.length}
                      />
                    )
                  }
                />
              </div>
            )}

            {/* Bottom Action buttons bar (Run / Submit) */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#080814] border-t border-[var(--border)] select-none flex-shrink-0">
              <button
                onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e1e3a] bg-[#0c0d21] text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-purple-600/10 hover:border-purple-500/30 transition-all cursor-pointer select-none"
              >
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isConsoleExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
                Console
              </button>

              {mode === 'relay' && (
                <div className="mx-auto">
                  <RelayStatus 
                    activeTeamMember={roundConfig?.activeTeamMember || 'member1'} 
                    timeLeftSeconds={timeLeft} 
                  />
                </div>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <RunButton 
                  onClick={run} 
                  disabled={isRunning || isSubmitting || isLocked}
                  isRunning={isRunning} 
                />
                <SubmitButton
                  onClick={() => submit(onSolve)}
                  disabled={isRunning || isSubmitting || isLocked || isSubmissionsLocked || (mode === 'relay' && !canSubmit)}
                  isSubmitting={isSubmitting}
                  isLocked={isLocked || isSubmissionsLocked || (mode === 'relay' && !canSubmit)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher Footer */}
        <div className="flex lg:hidden bg-[#080814] border-t border-[var(--border)] h-12 select-none">
          <button
            onClick={() => setMobileTab('problem')}
            className={`flex-1 flex items-center justify-center font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === 'problem' ? 'text-purple-400 bg-purple-500/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Problem
          </button>
          <button
            onClick={() => setMobileTab('code')}
            className={`flex-1 flex items-center justify-center font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === 'code' ? 'text-purple-400 bg-purple-500/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Code
          </button>
        </div>
      </div>
      </StrictModeProtection>
    </SubmissionController>
  );
}
