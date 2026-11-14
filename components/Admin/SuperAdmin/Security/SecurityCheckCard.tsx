import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Shield, ExternalLink } from 'lucide-react';
import type { SecurityCheckConfig, SecurityCheckReport, SecurityManifestEntry } from './types';
import { resolveCheckStatus, statusStyles } from './securityStatus';
import { runSecurityCheck, fetchCheckReport } from './securityScanService';

interface SecurityCheckCardProps {
  check: SecurityCheckConfig;
  manifestEntry?: SecurityManifestEntry;
  isRunning: boolean;
  anyRunning: boolean;
  onScanStarted: () => void;
  onError: (msg: string) => void;
}

const SecurityCheckCard: React.FC<SecurityCheckCardProps> = ({
  check,
  manifestEntry,
  isRunning,
  anyRunning,
  onScanStarted,
  onError,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState<SecurityCheckReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);

  const status = resolveCheckStatus(manifestEntry, isRunning);
  const styles = statusStyles[status];
  const busy = localBusy || isRunning;

  const loadReport = async () => {
    setLoadingReport(true);
    const data = await fetchCheckReport(check.id);
    setReport(data);
    setLoadingReport(false);
  };

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !report && manifestEntry?.ranAt) await loadReport();
  };

  const handleRun = async () => {
    if (busy || anyRunning) return;
    setLocalBusy(true);
    onScanStarted();
    const result = await runSecurityCheck(check.id);
    setLocalBusy(false);
    if (!result.ok) {
      onError(result.error || 'Scan failed');
      return;
    }
    setTimeout(async () => {
      if (expanded) await loadReport();
    }, 3000);
  };

  return (
    <article
      className={`bg-white rounded-xl border p-5 flex flex-col h-full ${styles.ring} ${
        isRunning ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <button type="button" onClick={toggle} className="w-full text-left flex gap-3 items-start">
        {expanded ? (
          <ChevronDown size={18} className="text-slate-400 shrink-0 mt-1" />
        ) : (
          <ChevronRight size={18} className="text-slate-400 shrink-0 mt-1" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{check.name}</h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles.badge}`}
            >
              {isRunning ? 'Scanning…' : styles.label}
            </span>
          </div>
          <p className="text-sm text-slate-600">{check.description}</p>
          {manifestEntry?.summary && (
            <p className="text-xs text-slate-500 mt-2">{manifestEntry.summary}</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-sm">
          {loadingReport ? (
            <p className="text-slate-500">Loading report…</p>
          ) : report ? (
            <>
              {report.note && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{report.note}</p>
              )}
              {report.reportUrl && (
                <a
                  href={report.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 text-xs font-medium"
                >
                  <ExternalLink size={14} /> Open ZAP HTML report
                </a>
              )}
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {(report.findings ?? []).map((f, i) => (
                  <li
                    key={i}
                    className="text-xs border border-slate-100 rounded-lg p-2 bg-slate-50/80"
                  >
                    <span className="font-semibold uppercase text-slate-500">{f.severity}</span>
                    {f.route && <span className="font-mono ml-1">{f.route}</span>}
                    <p className="text-slate-800 mt-0.5">{f.issue}</p>
                    {f.recommendation && (
                      <p className="text-slate-500 mt-0.5">{f.recommendation}</p>
                    )}
                    {f.detail && <p className="text-slate-500">{f.detail}</p>}
                  </li>
                ))}
              </ul>
              {report.advisories && report.advisories.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Top advisories</p>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {report.advisories.map((a, i) => (
                      <li key={i} className="text-xs">
                        <span className="font-mono">{a.package}</span> — {a.severity}: {a.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500">Run a scan to generate the local report.</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleRun}
        disabled={busy || (anyRunning && !isRunning)}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Scanning…
          </>
        ) : (
          <>
            <Shield size={18} />
            Run security check
          </>
        )}
      </button>
    </article>
  );
};

export default SecurityCheckCard;
