'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import AuthGuard from '@/app/guards/AuthGuard';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminNav from '@/components/admin/AdminNav';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatDuration(ms: number) {
  if (ms < 1000) return '0s';
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    NORMAL: { label: '🟢 Normal', color: 'text-emerald-400 bg-emerald-400/10' },
    REVIEW: { label: '🟡 Review', color: 'text-yellow-400 bg-yellow-400/10' },
    SUSPICIOUS: { label: '🟠 Suspicious', color: 'text-orange-400 bg-orange-400/10' },
    HIGH_ALERT: { label: '🔴 High Alert', color: 'text-red-400 bg-red-400/10' },
  };
  const s = map[status] || map.NORMAL;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.color}`}>
      {s.label}
    </span>
  );
}

function IntegrityContent() {
  const formatReasons = (reasons?: string[]) => {
    if (!reasons || reasons.length === 0) return null;
    const map: Record<string, string> = {
      'TAB_HIDDEN': 'Switched Tabs',
      'WINDOW_BLUR': 'Clicked Outside',
      'FULLSCREEN_EXIT': 'Exited Fullscreen',
    };
    return reasons.map(r => map[r] || r).join(', ');
  };

  const { data, error, mutate } = useSWR('/api/admin/integrity', fetcher, {
    refreshInterval: 2000,
  });

  const { strictMode, copyPasteBlocker, maxTabSwitches, mutate: mutateSettings } = useGlobalSettings();
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [localMaxTabs, setLocalMaxTabs] = useState<number | ''>('');

  useEffect(() => {
    if (maxTabSwitches !== undefined && localMaxTabs === '') {
      setLocalMaxTabs(maxTabSwitches);
    }
  }, [maxTabSwitches, localMaxTabs]);

  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const toggleStrictMode = async () => {
    if (isUpdatingSettings) return;
    const newValue = !strictMode;
    let reason = '';
    if (!newValue) {
      const confirmReason = prompt('⚠ DISABLE STRICT SCREEN PROTECTION?\nParticipants will no longer be blocked for leaving fullscreen, and the black deterrent screen will be disabled.\nActivity monitoring will continue.\n\nReason:');
      if (confirmReason === null) return;
      reason = confirmReason;
    } else {
      const confirm = window.confirm('⚠ ENABLE STRICT SCREEN PROTECTION?\nThis will:\n• Require fullscreen mode\n• Restrict Run/Submit outside fullscreen\n• Activate black deterrent screen on focus loss\n• Monitor away sessions\n\nExisting participants will receive the updated policy instantly.');
      if (!confirm) return;
    }
    
    setIsUpdatingSettings(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strictMode: newValue, reason }),
      });
      mutateSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const saveMaxTabs = async (val: number) => {
    if (val < 1 || isUpdatingSettings) return;
    setIsUpdatingSettings(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxTabSwitches: val }),
      });
      mutateSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const toggleCopyPaste = async () => {
    if (isUpdatingSettings) return;
    const newValue = !copyPasteBlocker;
    const action = newValue ? 'ENABLE' : 'DISABLE';
    const confirm = window.confirm(`⚠ ${action} COPY-PASTE BLOCKER?\nAre you sure you want to ${action.toLowerCase()} the global copy-paste blocker?`);
    if (!confirm) return;
    
    setIsUpdatingSettings(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyPasteBlocker: newValue }),
      });
      mutateSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  useEffect(() => {
    if (selectedParticipant && data?.participants) {
      const updated = data.participants.find((p: any) => p._id === selectedParticipant._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedParticipant)) {
        setSelectedParticipant(updated);
      }
    }
  }, [data?.participants, selectedParticipant]);

  // Fetch logs initially and whenever awaySessionCount changes
  useEffect(() => {
    if (selectedParticipant) {
      const targetId = selectedParticipant.userId?._id || selectedParticipant.userId;
      if (targetId) {
        setIsLogsLoading(logs.length === 0);
        fetch(`/api/admin/integrity/${targetId}`)
          .then((res) => res.json())
          .then((d) => {
            if (d.error) console.error('Logs fetch error:', d.error);
            setLogs(d.logs || []);
          })
          .finally(() => setIsLogsLoading(false));
      } else {
        setLogs([]);
        setIsLogsLoading(false);
      }
    }
  }, [selectedParticipant?.userId, selectedParticipant?.awaySessionCount]);

  const handleAction = async (action: string, extraArg?: string) => {
    if (!selectedParticipant) return;
    try {
      let finalExtraArg = extraArg;
      if (action === 'LOCK_SUBMISSIONS' && extraArg === undefined) {
        finalExtraArg = window.prompt('Enter reason for locking (optional):') || '';
      }
      const targetId = selectedParticipant.userId?._id || selectedParticipant.userId;
      const body: any = { action, userId: targetId };
      if (action === 'LOCK_SUBMISSIONS') body.reason = finalExtraArg;
      
      const res = await fetch('/api/admin/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error: ' + errorData.error);
        return;
      }
      mutate();
      if (action === 'MARK_REVIEWED') setSelectedParticipant(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (error) return <div className="text-red-400 p-8">Failed to load integrity data: {error.message}</div>;
  if (!data) return <div className="text-slate-400 p-8">Loading...</div>;
  if (data.error) return <div className="text-red-400 p-8">Error: {data.error}</div>;

  return (
    <AdminLayout
      title="Integrity Monitoring"
      subtitle="Live monitoring of participant away sessions and fullscreen exits."
      nav={<AdminNav />}
    >
      <div className="flex flex-col md:flex-row gap-6 mb-8 p-6 bg-[#0d0e24] border border-[#1e224d] rounded-xl">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-1">Global Settings</h2>
          <p className="text-sm text-slate-400 mb-4">Real-time enforcement controls. These apply instantly to all active participants.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#151838] p-3 rounded text-center">
              <div className="text-slate-400 text-xs uppercase mb-1">Active Teams</div>
              <div className="text-xl font-bold">{data.stats?.activeTeams || 0}</div>
            </div>
            <div className="bg-[#151838] p-3 rounded text-center">
              <div className="text-slate-400 text-xs uppercase mb-1">Global Tab Switches</div>
              <div className="text-xl font-bold">{data.stats?.totalTabSwitches || 0}</div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-[#151838] rounded-lg">
              <div>
                <div className="font-bold mb-1">Strict Screen Protection</div>
                <div className="text-xs text-slate-400">Activates black screen deterrent on focus loss and enforces fullscreen mode.</div>
              </div>
              <button 
                onClick={toggleStrictMode}
                disabled={isUpdatingSettings}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${strictMode ? 'bg-emerald-500' : 'bg-slate-600'} ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${strictMode ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[#151838] rounded-lg">
              <div>
                <div className="font-bold mb-1">Copy-Paste Blocker</div>
                <div className="text-xs text-slate-400">Prevents pasting code into the IDE editor.</div>
              </div>
              <button 
                onClick={toggleCopyPaste}
                disabled={isUpdatingSettings}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${copyPasteBlocker ? 'bg-emerald-500' : 'bg-slate-600'} ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${copyPasteBlocker ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[#151838] rounded-lg">
              <div>
                <div className="font-bold mb-1">Max Tab Switches</div>
                <div className="text-xs text-slate-400">Auto-locks submissions if participant exceeds this limit.</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  className="w-16 px-2 py-1 bg-[#0c0d21] border border-[#1e1e3a] rounded text-sm text-center focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  value={localMaxTabs}
                  disabled={isUpdatingSettings}
                  onChange={(e) => setLocalMaxTabs(parseInt(e.target.value) || '')}
                  onBlur={() => {
                    if (typeof localMaxTabs === 'number' && localMaxTabs !== maxTabSwitches) {
                      saveMaxTabs(localMaxTabs);
                    } else if (localMaxTabs === '') {
                      setLocalMaxTabs(maxTabSwitches);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0d0e24] border border-[#1e224d] rounded-xl overflow-hidden mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#151838] text-slate-300 font-mono text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Participant</th>
              <th className="px-6 py-4">Sessions</th>
              <th className="px-6 py-4">Total Away</th>
              <th className="px-6 py-4">Longest</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e224d]">
            {(data.participants || []).map((p: any) => {
              const isSelected = selectedParticipant?._id === p._id;
              return (
                <React.Fragment key={p._id}>
                  <tr 
                    onClick={() => setSelectedParticipant(isSelected ? null : p)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-purple-500/20' : 'hover:bg-slate-800/50'}`}
                  >
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      {p.userId?.username || p.userId?.name || 'Unknown'}
                      {p.currentlyAway && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{p.awaySessionCount}</td>
                    <td className="px-6 py-4 text-slate-300">{formatDuration(p.totalAwayTimeMs)}</td>
                    <td className="px-6 py-4 text-slate-300">{formatDuration(p.longestAwaySessionMs)}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.currentStatus} /></td>
                  </tr>
                  
                  {isSelected && (
                    <tr>
                      <td colSpan={5} className="p-0 border-b-4 border-purple-500">
                        <div className="bg-[#11132f] p-6 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex flex-col xl:flex-row gap-8">
                            
                            {/* Left Side: Stats & Actions */}
                            <div className="xl:w-1/3 flex flex-col gap-6">
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  <h3 className="text-lg font-bold text-white">{p.userId?.username} Detailed Review</h3>
                                  {p.currentlyAway && (
                                    <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] uppercase font-bold animate-pulse">
                                      🚨 Currently Away
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="bg-[#151838] p-3 rounded border border-slate-800">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Away Sessions</div>
                                    <div className="font-bold text-white text-lg">{p.awaySessionCount}</div>
                                  </div>
                                  <div className="bg-[#151838] p-3 rounded border border-slate-800">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Total Away</div>
                                    <div className="font-bold text-white text-lg">{formatDuration(p.totalAwayTimeMs)}</div>
                                  </div>
                                  <div className="bg-[#151838] p-3 rounded border border-slate-800">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Longest Session</div>
                                    <div className="font-bold text-white text-lg">{formatDuration(p.longestAwaySessionMs)}</div>
                                  </div>
                                  <div className="bg-[#151838] p-3 rounded border border-slate-800">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Fullscreen Exits</div>
                                    <div className="font-bold text-white text-lg">{p.fullscreenExitCount}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Admin Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                  <button 
                                    onClick={() => handleAction('MARK_REVIEWED')}
                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 font-medium rounded text-sm transition-colors text-white whitespace-nowrap"
                                  >
                                    ✓ Mark Reviewed
                                  </button>
                                  {p.isSubmissionsLocked ? (
                                    <button 
                                      onClick={() => handleAction('RELEASE_SUBMISSIONS')}
                                      className="flex-1 py-2 px-3 bg-slate-600 hover:bg-slate-700 font-medium rounded text-sm transition-colors text-white whitespace-nowrap"
                                    >
                                      🔓 Release Submissions
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        const reason = prompt('Reason for locking submissions:');
                                        if (reason !== null) handleAction('LOCK_SUBMISSIONS', reason);
                                      }}
                                      className="flex-1 py-2 px-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium rounded text-sm transition-colors whitespace-nowrap"
                                    >
                                      🔒 Lock Submissions
                                    </button>
                                  )}
                                </div>
                                <div className="mt-2 border-t border-slate-800 pt-3">
                                  {p.userId?.teamId?.status === 'DISQUALIFIED' ? (
                                    <button 
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to RE-ADMIT this team?')) {
                                          handleAction('READMIT');
                                        }
                                      }}
                                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition-colors"
                                    >
                                      Re-admit Team
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to DISQUALIFY this team? They will be permanently locked out of the contest.')) {
                                          handleAction('DISQUALIFY');
                                        }
                                      }}
                                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors shadow-lg shadow-red-900/20"
                                    >
                                      ⚠ Disqualify Team
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right Side: Activity Logs */}
                            <div className="xl:w-2/3 flex flex-col bg-[#0d0e24] border border-[#1e224d] rounded-lg overflow-hidden">
                              <div className="bg-[#151838] px-4 py-3 border-b border-[#1e224d] flex justify-between items-center">
                                <h4 className="text-sm font-bold text-slate-300">Detailed Activity Logs</h4>
                                <span className="text-xs text-slate-500">{logs.length} events recorded</span>
                              </div>
                              <div className="p-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar bg-[#0d0e24]">
                                {isLogsLoading ? (
                                  <div className="flex items-center justify-center h-full text-slate-500">Loading activity...</div>
                                ) : logs.length > 0 ? (
                                  <div className="space-y-3">
                                    {logs.map((log) => (
                                      <div key={log._id} className="flex gap-4 p-3 bg-[#151838] rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                                        <div className="flex-shrink-0 w-24 text-xs text-slate-400 font-mono pt-1">
                                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            {log.type === 'AWAY_SESSION_END' ? (
                                              <span className="text-emerald-400 font-medium text-sm">Returned to IDE</span>
                                            ) : log.type === 'AWAY_SESSION_START' ? (
                                              <span className="text-orange-400 font-medium text-sm">Left IDE</span>
                                            ) : log.type === 'ADMIN_ACTION' ? (
                                              <span className="text-purple-400 font-medium text-sm">Admin Action</span>
                                            ) : (
                                              <span className="text-slate-300 font-medium text-sm">{log.type}</span>
                                            )}
                                            
                                            {log.type === 'AWAY_SESSION_END' && log.durationMs > 0 && (
                                              <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                                                Away for {formatDuration(log.durationMs)}
                                              </span>
                                            )}
                                            {log.severity && log.severity !== 'NONE' && (
                                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                {log.severity}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {(log.reasons?.length > 0 || log.details) && (
                                            <div className="text-sm text-slate-300">
                                              {log.details ? (
                                                <span className="italic">{log.details}</span>
                                              ) : (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                  {log.reasons.map((r: string, idx: number) => {
                                                    const map: Record<string, string> = {
                                                      'TAB_HIDDEN': 'Switched Tabs',
                                                      'WINDOW_BLUR': 'Clicked Outside',
                                                      'FULLSCREEN_EXIT': 'Exited Fullscreen',
                                                    };
                                                    return (
                                                      <span key={idx} className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-[#1e224d] px-2 py-1 rounded">
                                                        <span className="text-purple-400">🔍</span> {map[r] || r}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                    <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>No activity recorded.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {(data.participants || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No participants tracked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default function IntegrityDashboard() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <IntegrityContent />
    </AuthGuard>
  );
}
