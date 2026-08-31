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
  const { data, error, mutate } = useSWR('/api/admin/integrity', fetcher, {
    refreshInterval: 2000,
  });

  const { strictMode, copyPasteBlocker, mutate: mutateSettings } = useGlobalSettings();
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const toggleStrictMode = async () => {
    if (isUpdatingSettings) return;
    const newValue = !strictMode;
    let reason = '';
    if (!newValue) {
      const confirmReason = prompt('⚠ DISABLE STRICT MODE?\nParticipants will no longer be blocked for leaving fullscreen.\nActivity monitoring will continue.\n\nReason:');
      if (confirmReason === null) return;
      reason = confirmReason;
    } else {
      const confirm = window.confirm('⚠ ENABLE STRICT MODE?\nStrict Mode will:\n• Require fullscreen mode\n• Restrict Run/Submit outside fullscreen\n• Monitor away sessions\n\nExisting participants will receive the updated policy.');
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
    if (selectedParticipant) {
      setIsLogsLoading(true);
      const targetId = selectedParticipant.userId?._id || selectedParticipant.userId;
      if (targetId) {
        fetch(`/api/admin/integrity/${targetId}`)
          .then((res) => res.json())
          .then((d) => setLogs(d.logs || []))
          .finally(() => setIsLogsLoading(false));
      } else {
        setLogs([]);
        setIsLogsLoading(false);
      }
    }
  }, [selectedParticipant]);

  const handleAction = async (action: string, reason?: string) => {
    if (!selectedParticipant) return;
    try {
      const targetId = selectedParticipant.userId?._id || selectedParticipant.userId;
      await fetch('/api/admin/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: targetId,
          reason,
        }),
      });
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
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-[#151838] rounded-lg">
              <div>
                <div className="font-bold mb-1">Strict Mode</div>
                <div className="text-xs text-slate-400">Enforces fullscreen mode and blocks run/submit if exited.</div>
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Table */}
        <div className="lg:col-span-2 bg-[#0d0e24] border border-[#1e224d] rounded-xl overflow-hidden">
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
              {(data.participants || []).map((p: any) => (
                <tr 
                  key={p._id} 
                  onClick={() => setSelectedParticipant(p)}
                  className={`cursor-pointer transition-colors ${selectedParticipant?._id === p._id ? 'bg-purple-500/10' : 'hover:bg-slate-800/50'}`}
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
              ))}
              {(data.participants || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No participants tracked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sidebar Details */}
        <div className="bg-[#0d0e24] border border-[#1e224d] rounded-xl p-6">
          {selectedParticipant ? (
            <div>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedParticipant.userId?.username}</h2>
                  <div className="mt-2"><StatusBadge status={selectedParticipant.currentStatus} /></div>
                </div>
                {selectedParticipant.currentlyAway && (
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded text-xs font-bold animate-pulse">
                    🚨 CURRENTLY AWAY
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-[#151838] p-3 rounded">
                  <div className="text-slate-400 text-xs mb-1">Away Sessions</div>
                  <div className="font-bold">{selectedParticipant.awaySessionCount}</div>
                </div>
                <div className="bg-[#151838] p-3 rounded">
                  <div className="text-slate-400 text-xs mb-1">Total Away</div>
                  <div className="font-bold">{formatDuration(selectedParticipant.totalAwayTimeMs)}</div>
                </div>
                <div className="bg-[#151838] p-3 rounded">
                  <div className="text-slate-400 text-xs mb-1">Longest Session</div>
                  <div className="font-bold">{formatDuration(selectedParticipant.longestAwaySessionMs)}</div>
                </div>
                <div className="bg-[#151838] p-3 rounded">
                  <div className="text-slate-400 text-xs mb-1">Fullscreen Exits</div>
                  <div className="font-bold">{selectedParticipant.fullscreenExitCount}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-8">
                <button 
                  onClick={() => handleAction('MARK_REVIEWED')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 font-medium rounded text-sm transition-colors"
                >
                  Mark as Reviewed
                </button>
                {selectedParticipant.isSubmissionsLocked ? (
                  <button 
                    onClick={() => handleAction('RELEASE_SUBMISSIONS')}
                    className="w-full py-2 bg-slate-600 hover:bg-slate-700 font-medium rounded text-sm transition-colors"
                  >
                    Release Submissions
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      const reason = prompt('Reason for locking submissions:');
                      if (reason !== null) handleAction('LOCK_SUBMISSIONS', reason);
                    }}
                    className="w-full py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium rounded text-sm transition-colors"
                  >
                    Lock Submissions
                  </button>
                )}
              </div>

              <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-4">Recent Activity</h3>
              
              {isLogsLoading ? (
                <div className="text-sm text-slate-500">Loading activity...</div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {logs.map((log) => (
                    <div key={log._id} className="border-l-2 border-slate-700 pl-3">
                      <div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-sm font-medium mt-1">
                        {log.type === 'AWAY_SESSION_END' ? (
                          <>Away for {formatDuration(log.durationMs)}</>
                        ) : log.type === 'ADMIN_ACTION' ? (
                          <span className="text-purple-400">{log.details}</span>
                        ) : (
                          <span className="text-orange-400">Away Started</span>
                        )}
                      </div>
                      {log.severity && log.severity !== 'NONE' && (
                        <div className={`text-[10px] font-mono mt-1 ${log.severity === 'CRITICAL' ? 'text-red-400' : 'text-slate-500'}`}>
                          Severity: {log.severity}
                        </div>
                      )}
                    </div>
                  ))}
                  {logs.length === 0 && <div className="text-sm text-slate-500">No activity recorded.</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Select a participant to view details.
            </div>
          )}
        </div>
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
