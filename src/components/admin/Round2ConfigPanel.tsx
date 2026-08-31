'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin';

type Config = { totalDurationSeconds: number; member1DurationSeconds: number; handoverDurationSeconds: number; member2DurationSeconds: number };
const empty: Config = { totalDurationSeconds: 3600, member1DurationSeconds: 600, handoverDurationSeconds: 120, member2DurationSeconds: 900 };

export default function Round2ConfigPanel() {
  const [config, setConfig] = useState<Config>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { adminService.getRound2Config().then(setConfig).catch((err) => setMessage(err.message ?? 'Unable to load Round 2 configuration.')).finally(() => setLoading(false)); }, []);

  const update = (key: keyof Config, value: string) => setConfig((current) => ({ ...current, [key]: Number(value) * 60 }));
  const save = async () => { setSaving(true); setMessage(null); try { const saved = await adminService.updateRound2Config(config); setConfig(saved); setMessage('Round 2 timing saved.'); } catch (err: any) { setMessage(err.message ?? 'Unable to save timing configuration.'); } finally { setSaving(false); } };
  const fields: Array<[keyof Config, string, boolean]> = [['totalDurationSeconds', 'Total Round Duration', false], ['member1DurationSeconds', 'Member 1 Coding Duration', false], ['handoverDurationSeconds', 'Handover / Switching Gap', true], ['member2DurationSeconds', 'Member 2 Coding Duration', false]];

  return <section className="rounded-xl border border-purple-500/25 bg-[var(--surface)] p-5"><div className="mb-4"><h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Round 2 timing</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Minutes. New teams use these settings; active teams update immediately without restarting their current phase. Elapsed time is preserved, and the overall round deadline still applies.</p></div><div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label, zeroAllowed]) => <label key={key} className="text-xs font-mono text-slate-300">{label}<input aria-label={label} type="number" min={zeroAllowed ? 0 : 1} step="1" disabled={loading || saving} value={config[key] / 60} onChange={(event) => update(key, event.target.value)} className="mt-1.5 w-full rounded-md border border-[#2a2d4f] bg-[#080814] px-3 py-2 text-white outline-none focus:border-purple-400" /></label>)}</div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={save} disabled={loading || saving} className="rounded-md bg-purple-600 px-4 py-2 text-xs font-mono font-bold text-white disabled:opacity-50">{saving ? 'SAVING...' : 'SAVE SETTINGS'}</button>{message && <span className="text-xs text-slate-300">{message}</span>}</div></section>;
}
