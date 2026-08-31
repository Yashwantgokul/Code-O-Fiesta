'use client';

import React from 'react';

export default function RelayInstructions() {
  return (
    <div className="p-5 rounded-xl border border-purple-500/20 bg-[#0d0d24] flex flex-col gap-4 font-mono text-xs text-slate-300 shadow-[0_0_15px_rgba(139,92,246,0.1)] select-text">
      <h3 className="text-sm font-bold text-white uppercase border-b border-purple-500/20 pb-2.5 flex items-center gap-1.5 select-none">
        <span className="text-purple-400">⚡</span>
        Relay Arena Instructions
      </h3>
      <ol className="list-decimal pl-5 flex flex-col gap-3 leading-relaxed">
        <li>
          <span className="text-white font-bold">Relay Turn Timing:</span> The administrator configures the Member 1 duration, the handover gap, and the Member 2 duration. The workspace always displays the server-authoritative timer.
        </li>
        <li>
          <span className="text-white font-bold">Blind Play:</span> The problem description is visible to Member 1, but completely <span className="text-red-400 font-bold">hidden</span> for Member 2. Member 2 must analyze and complete the code written by Member 1 without seeing the statement.
        </li>
        <li>
          <span className="text-white font-bold">Comments Banned:</span> Adding any comments (<code className="text-red-400">{'//'}</code>, <code className="text-red-400">{'/* */'}</code>, <code className="text-red-400">#</code>) is strictly forbidden. Submissions containing comment syntax will be automatically rejected.
        </li>
        <li>
          <span className="text-white font-bold">Shared Codebase:</span> You are collaborating on the same codebase. When your turn begins, you pick up exactly where your partner left off.
        </li>
      </ol>
    </div>
  );
}
