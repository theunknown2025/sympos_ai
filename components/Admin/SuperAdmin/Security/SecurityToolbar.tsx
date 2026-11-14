import React, { useState } from 'react';
import { RefreshCw, Shield, Loader2, Download, FileText } from 'lucide-react';
import { securityTarget, securityChecks } from './securityConfig';
import {
  runAllSecurityChecks,
  installZap,
  generateSecurityLog,
  generateSecurityLogOffline,
} from './securityScanService';

interface SecurityToolbarProps {
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: string | null;
  summary?: { pass: number; warn: number; fail: number; skip: number };
  apiOnline: boolean;
  runningAll: boolean;
  anyRunning: boolean;
  onScanStarted: () => void;
  onError: (msg: string) => void;
}

const SecurityToolbar: React.FC<SecurityToolbarProps> = ({
  onRefresh,
  loading,
  lastUpdated,
  summary,
  apiOnline,
  runningAll,
  anyRunning,
  onScanStarted,
  onError,
}) => {
  const [scanningAll, setScanningAll] = useState(false);
  const [generatingLog, setGeneratingLog] = useState(false);
  const [lastLogUrl, setLastLogUrl] = useState<string | null>(null);

  const handleRunAll = async () => {
    if (anyRunning || scanningAll) return;
    setScanningAll(true);
    onScanStarted();
    const result = await runAllSecurityChecks();
    setScanningAll(false);
    if (!result.ok) onError(result.error || 'Could not start full scan');
  };

  const handleInstallZap = () => {
    installZap();
    onError('');
    alert('OWASP ZAP download started in the background. This may take several minutes.');
  };

  const handleGenerateLog = async () => {
    if (generatingLog) return;
    setGeneratingLog(true);
    onError('');

    const result = apiOnline
      ? await generateSecurityLog()
      : null;

    if (result?.ok && result.logUrl) {
      setLastLogUrl(result.logUrl);
      const a = document.createElement('a');
      a.href = `${result.logUrl}?t=${Date.now()}`;
      a.download = 'sympos-ia-security-log.txt';
      a.click();
      setGeneratingLog(false);
      return;
    }

    if (!apiOnline || !result?.ok) {
      const offline = await generateSecurityLogOffline(securityChecks.map((c) => c.id));
      setGeneratingLog(false);
      if (!offline) {
        onError(result?.error || 'Could not generate log. Run scans first or start dev:all.');
        return;
      }
      const url = URL.createObjectURL(offline.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = offline.filename;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    setGeneratingLog(false);
    onError(result?.error || 'Failed to generate log');
  };

  return (
    <div className="mb-6 p-4 bg-slate-100/80 border border-slate-200 rounded-xl space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Shield className="text-slate-700 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="text-sm font-semibold text-slate-900">Local security scans</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Target{' '}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border">{securityTarget.baseUrl}</code>
              {!apiOnline && (
                <span className="block text-amber-700 text-xs mt-1">
                  Security API offline — run <code className="bg-white px-1 rounded">npm run dev:all</code>
                </span>
              )}
            </p>
            {summary && (
              <p className="text-xs text-slate-500 mt-1">
                Pass {summary.pass} · Warn {summary.warn} · Fail {summary.fail} · Skip {summary.skip}
              </p>
            )}
            {lastUpdated && (
              <p className="text-xs text-slate-500">Last scan: {new Date(lastUpdated).toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleInstallZap}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
          >
            <Download size={16} />
            Install OWASP ZAP
          </button>
          <button
            type="button"
            onClick={handleGenerateLog}
            disabled={generatingLog}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            {generatingLog ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            Generate log
          </button>
          {lastLogUrl && (
            <a
              href={`${lastLogUrl}?t=${Date.now()}`}
              download="sympos-ia-security-log.txt"
              className="inline-flex items-center gap-1 px-2 py-2 text-xs text-indigo-600 hover:underline"
            >
              Open last log
            </a>
          )}
          <button
            type="button"
            onClick={handleRunAll}
            disabled={!apiOnline || anyRunning || scanningAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {runningAll || scanningAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Shield size={16} />
            )}
            Run all security checks
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Reports are saved under <code className="bg-white px-1 rounded">public/security-results/</code>.
        Generate log writes <code className="bg-white px-1 rounded">security-log.txt</code> (all checks).
        Not a replacement for professional penetration testing.
      </p>
    </div>
  );
};

export default SecurityToolbar;
