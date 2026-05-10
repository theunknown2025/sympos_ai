import type { SubscriptionRole } from '../types';
import type { AdminDisplayLanguage } from './admin/types';

export function getRoleLabel(role: SubscriptionRole | null, lang: AdminDisplayLanguage): string {
  if (lang === 'fr') {
    if (role === 'Organizer') return 'Organisateur';
    if (role === 'Participant') return 'Participant';
    if (role === 'SuperAdmin') return 'Super administrateur';
    if (role === 'SubSuperAdmin') return 'Sous super administrateur';
    return 'Utilisateur';
  }
  if (role === 'Organizer') return 'Organizer';
  if (role === 'Participant') return 'Participant';
  if (role === 'SuperAdmin') return 'Super Admin';
  if (role === 'SubSuperAdmin') return 'Sub-Super Admin';
  return 'User';
}

export function getDisplaySettingsCopy(lang: AdminDisplayLanguage) {
  if (lang === 'fr') {
    return {
      modalTitle: 'Paramètres d’affichage',
      language: 'Langue de l’interface',
      english: 'Anglais',
      french: 'Français',
      save: 'Enregistrer',
      cancel: 'Fermer',
      saved: 'Enregistré dans mcp.json',
      saveFailed: 'Échec de l’enregistrement. Lancez le serveur : npm run admin-display-server',
      loadFailed: 'Impossible de charger la config (fichier mcp.json ou serveur local).',
      hint: 'Les préférences sont stockées dans votre fichier Cursor mcp.json (clé symposIa), par utilisateur.',
    };
  }
  return {
    modalTitle: 'Display settings',
    language: 'Interface language',
    english: 'English',
    french: 'French',
    save: 'Save',
    cancel: 'Close',
    saved: 'Saved to mcp.json',
    saveFailed: 'Save failed. Run: npm run admin-display-server',
    loadFailed: 'Could not load settings (mcp.json or local server).',
    hint: 'Preferences are stored in your Cursor mcp.json file (symposIa key), per admin user.',
  };
}
