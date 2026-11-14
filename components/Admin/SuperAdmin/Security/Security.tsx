import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { securityChecks } from './securityConfig';
import { useSecurityResults } from './useSecurityResults';
import SecurityToolbar from './SecurityToolbar';
import SecurityCheckCard from './SecurityCheckCard';

const SuperAdminSecurity: React.FC = () => {
  const { manifest, running, runningAll, anyRunning, apiOnline, loading, error, refresh } =
    useSecurityResults();
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield size={32} className="text-slate-700 shrink-0" />
          Security
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Run local checks for headers, route exposure, npm dependencies, and optional OWASP ZAP.
          Expand a card to read findings; reports stay on your machine.
        </p>
      </header>

      <SecurityToolbar
        onRefresh={refresh}
        loading={loading}
        lastUpdated={manifest?.updatedAt ?? null}
        summary={manifest?.summary}
        apiOnline={apiOnline}
        runningAll={runningAll}
        anyRunning={anyRunning}
        onScanStarted={() => {
          setActionError(null);
          refresh();
        }}
        onError={setActionError}
      />

      {(error || actionError) && (
        <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {actionError || error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityChecks.map((check) => (
          <SecurityCheckCard
            key={check.id}
            check={check}
            manifestEntry={manifest?.checks?.[check.id]}
            isRunning={running.includes(check.id) || runningAll}
            anyRunning={anyRunning}
            onScanStarted={() => {
              setActionError(null);
              refresh();
            }}
            onError={setActionError}
          />
        ))}
      </div>
    </div>
  );
};

export default SuperAdminSecurity;
