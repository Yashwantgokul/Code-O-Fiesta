'use client';

import React from 'react';

interface Rule {
  title: string;
  description: string;
  critical?: boolean;
}

// Sample rules — organizers may update these before the event.
const RULES: Rule[] = [
  {
    title: 'AI tools are strictly prohibited',
    description:
      'Participants must not use ChatGPT, Claude, Gemini, Copilot, or any other AI-assisted coding/generation tool during the competition.',
    critical: true,
  },
  {
    title: 'Copy and paste is not allowed',
    description:
      'Participants must type their solutions directly inside the provided coding IDE. Copy/paste actions remain disabled wherever the competition currently enforces this.',
    critical: true,
  },
  {
    title: 'Tab switching is prohibited',
    description:
      'Participants should remain on the competition website during active rounds. Switching browser tabs/windows or leaving the competition page is not allowed.',
    critical: true,
  },
  {
    title: 'Do not refresh or close the competition unnecessarily',
    description: 'Participants should avoid actions that may interrupt their active round/session.',
  },
  {
    title: 'Do not share solutions',
    description:
      'Teams must solve their assigned problems independently and must not exchange code or solutions with other teams.',
  },
  {
    title: 'Follow the active round instructions',
    description: 'Each round may have additional rules or constraints. Participants must follow the instructions displayed for that round.',
  },
  {
    title: 'Organizer decisions are final',
    description: 'Any violation or suspicious activity may be reviewed by the organizers, and their decision will be final.',
  },
];

export default function RulesAndRegulations() {
  return (
    <div className="bg-[#0d0e24] border border-[#1e224d] rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#141738] pb-3 mb-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Rules &amp; Regulations
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {RULES.map((rule, index) => (
          <div
            key={rule.title}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              rule.critical
                ? 'bg-rose-500/5 border-rose-500/30'
                : 'bg-[#121433] border-[#1e224d]'
            }`}
          >
            <span
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border ${
                rule.critical
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-mono font-bold ${rule.critical ? 'text-rose-300' : 'text-white'}`}>
                  {rule.title}
                </span>
                {rule.critical && (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded">
                    Zero Tolerance
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 leading-relaxed">{rule.description}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] font-mono text-slate-500 italic leading-relaxed border-t border-[#141738] pt-3">
        These rules are currently sample rules and may be updated by the organizers before the event.
      </p>
    </div>
  );
}
