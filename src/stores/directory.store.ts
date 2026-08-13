import { create } from 'zustand';
import { api } from '../lib/api';
import { commonErrorKey, errorCode } from '../lib/errors';
import type {
  Directory,
  DirectoryAdmin,
  DirectoryCategory,
  DirectoryResult,
  DirectoryStatus,
  DirectorySubmission,
} from '../lib/types';

/** Filtres de la liste publique. */
export interface DirectoryFilters {
  country?: string | null;
  category?: DirectoryCategory | null;
  q?: string;
  page?: number;
}

interface DirectoryState {
  /* ---------------------------- Liste publique --------------------------- */
  result: DirectoryResult | null;
  isLoading: boolean;
  /** Clé i18n, jamais un message brut : l'API ne renvoie pas de texte traduit. */
  error: string | null;

  /** Options de filtre, servies par l'API pour ne proposer que l'existant. */
  countries: string[];
  categories: DirectoryCategory[];

  /* -------------------------------- Fiche -------------------------------- */
  current: Directory | null;

  /* ----------------------------- Proposition ----------------------------- */
  submitStatus: 'idle' | 'sending' | 'sent';
  submitError: string | null;

  /* ------------------------------ Modération ----------------------------- */
  adminEntries: DirectoryAdmin[];

  search: (filters?: DirectoryFilters) => Promise<void>;
  loadFilters: () => Promise<void>;
  findPublished: (slug: string) => Promise<void>;
  submit: (payload: DirectorySubmission) => Promise<void>;
  resetSubmit: () => void;

  findAll: (status?: DirectoryStatus) => Promise<void>;
  findOne: (id: string) => Promise<void>;
  createEntry: (payload: DirectorySubmission) => Promise<void>;
  update: (id: string, payload: Partial<DirectorySubmission>) => Promise<void>;
  publish: (id: string) => Promise<void>;
  reject: (id: string, moderationNote?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Accès à l'annuaire.
 *
 * Toutes les requêtes passent par ici : les composants lisent l'état et
 * déclenchent des actions, ils n'appellent jamais `api` directement. Les
 * erreurs sont converties en clés i18n au moment où elles surviennent — c'est
 * le seul endroit qui voit la réponse HTTP, la page ne doit pas avoir à
 * connaître les codes de l'API.
 */
export const useDirectoryStore = create<DirectoryState>((set, get) => ({
  result: null,
  isLoading: false,
  error: null,
  countries: [],
  categories: [],
  current: null,
  submitStatus: 'idle',
  submitError: null,
  adminEntries: [],

  /* ---------------------------- Liste publique --------------------------- */

  search: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<DirectoryResult>('/directory', {
        params: {
          country: filters.country ?? undefined,
          category: filters.category ?? undefined,
          q: filters.q?.trim() || undefined,
          page: filters.page,
        },
      });
      set({ result: data, error: null, isLoading: false });
    } catch (err) {
      set({
        result: null,
        error: commonErrorKey(err) ?? 'common.error',
        isLoading: false,
      });
    }
  },

  /**
   * Pays et catégories représentés.
   *
   * Un échec est avalé : sans ces listes la page reste consultable, elle perd
   * seulement ses puces de filtre. Afficher une erreur pour ça donnerait
   * l'impression que l'annuaire est en panne alors qu'il s'affiche.
   */
  loadFilters: async () => {
    try {
      const [countries, categories] = await Promise.all([
        api.get<string[]>('/directory/countries'),
        api.get<DirectoryCategory[]>('/directory/categories'),
      ]);
      set({ countries: countries.data, categories: categories.data });
    } catch {
      set({ countries: [], categories: [] });
    }
  },

  findPublished: async (slug) => {
    set({ isLoading: true, current: null });
    try {
      const { data } = await api.get<Directory>(`/directory/${slug}`);
      set({ current: data, error: null, isLoading: false });
    } catch (err) {
      set({
        error:
          errorCode(err) === 'DIRECTORY_NOT_FOUND'
            ? 'directory.notFound'
            : (commonErrorKey(err) ?? 'common.error'),
        isLoading: false,
      });
    }
  },

  /* ----------------------------- Proposition ----------------------------- */

  submit: async (payload) => {
    set({ submitStatus: 'sending', submitError: null });
    try {
      await api.post('/directory/submissions', payload);
      set({ submitStatus: 'sent' });
    } catch (err) {
      set({
        submitStatus: 'idle',
        submitError:
          errorCode(err) === 'DIRECTORY_ALREADY_SUBMITTED'
            ? 'directory.submit.alreadyListed'
            : (commonErrorKey(err) ?? 'common.error'),
      });
    }
  },

  resetSubmit: () => set({ submitStatus: 'idle', submitError: null }),

  /* ------------------------------ Modération ----------------------------- */

  findAll: async (status) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<DirectoryAdmin[]>('/directory/admin', {
        params: { status },
      });
      set({ adminEntries: data, error: null, isLoading: false });
    } catch (err) {
      set({ error: commonErrorKey(err) ?? 'common.error', isLoading: false });
    }
  },

  findOne: async (id) => {
    set({ isLoading: true, current: null });
    try {
      const { data } = await api.get<DirectoryAdmin>(`/directory/admin/${id}`);
      set({ current: data, error: null, isLoading: false });
    } catch (err) {
      set({ error: commonErrorKey(err) ?? 'common.error', isLoading: false });
    }
  },

  createEntry: async (payload) => {
    const { data } = await api.post<DirectoryAdmin>('/directory/admin', payload);
    set({ adminEntries: [data, ...get().adminEntries] });
  },

  update: async (id, payload) => {
    const { data } = await api.patch<DirectoryAdmin>(`/directory/admin/${id}`, payload);
    replaceEntry(set, get, data);
  },

  publish: async (id) => {
    const { data } = await api.post<DirectoryAdmin>(`/directory/admin/${id}/publish`);
    replaceEntry(set, get, data);
  },

  reject: async (id, moderationNote) => {
    const { data } = await api.post<DirectoryAdmin>(`/directory/admin/${id}/reject`, {
      moderationNote,
    });
    replaceEntry(set, get, data);
  },

  remove: async (id) => {
    await api.delete(`/directory/admin/${id}`);
    set({ adminEntries: get().adminEntries.filter((e) => e.id !== id) });
  },
}));

/**
 * Remplace une entrée de la file de modération par sa version à jour.
 *
 * Substitution plutôt que rechargement complet : la file peut être longue et
 * une relecture y enchaîne les actions, la refetcher à chaque clic ferait
 * sauter la position de défilement.
 *
 * Les mutations d'administration ne capturent pas leurs erreurs : elles
 * partent d'un écran où l'échec doit être visible immédiatement, à l'appelant
 * de décider quoi en faire.
 */
function replaceEntry(
  set: (partial: Partial<DirectoryState>) => void,
  get: () => DirectoryState,
  entry: DirectoryAdmin,
): void {
  set({
    adminEntries: get().adminEntries.map((e) => (e.id === entry.id ? entry : e)),
    current: get().current?.id === entry.id ? entry : get().current,
  });
}
