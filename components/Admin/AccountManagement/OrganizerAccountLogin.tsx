import React, { useState } from 'react';
import { Loader2, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../supabase';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';

const OrganizerAccountLogin: React.FC = () => {
  const { currentUser } = useAuth();
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword.length < 8) {
      setError(fr ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(fr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setNewPassword('');
      setConfirmPassword('');
      setMessage(fr ? 'Mot de passe mis à jour.' : 'Password updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : (fr ? 'Échec de la mise à jour.' : 'Update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {fr ? 'Connexion' : 'Login'}
        </h1>
        <p className="mt-1 text-slate-500">
          {fr
            ? 'Gérez l’email de connexion et le mot de passe de votre compte organisateur.'
            : 'Manage your organizer account email and password.'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {fr ? 'Email de connexion' : 'Login email'}
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <span className="truncate">{currentUser?.email || '—'}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {fr
              ? 'Pour changer d’email, contactez le support SymposAI.'
              : 'To change your email, contact SymposAI support.'}
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {fr ? 'Nouveau mot de passe' : 'New password'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {fr ? 'Confirmer le mot de passe' : 'Confirm password'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          {message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 size={16} />
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {fr ? 'Mettre à jour le mot de passe' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerAccountLogin;
