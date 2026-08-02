import { create } from 'zustand';
import { api } from '../lib/api';

/**
 * Identifiants des annonces mises en favori.
 *
 * Gardés dans un store global plutôt que par page : le bouton favori apparaît
 * dans les résultats, sur la fiche et sur la page des favoris, et tous doivent
 * refléter le même état sans multiplier les requêtes.
 */
interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (businessId: string) => Promise<void>;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  loaded: false,

  load: async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      const { data } = await api.get<string[]>('/favorites/ids');
      set({ ids: new Set(data), loaded: true });
    } catch {
      // Les favoris sont un confort : leur échec ne doit rien interrompre.
      set({ loaded: true });
    }
  },

  toggle: async (businessId) => {
    const { ids } = get();
    const wasFavorite = ids.has(businessId);

    // Bascule optimiste : sur une connexion lente, attendre la réponse rendrait
    // le bouton inerte pendant une seconde.
    const next = new Set(ids);
    if (wasFavorite) next.delete(businessId);
    else next.add(businessId);
    set({ ids: next });

    try {
      if (wasFavorite) await api.delete(`/favorites/${businessId}`);
      else await api.post(`/favorites/${businessId}`);
    } catch {
      // Échec : on rétablit l'état réel plutôt que de laisser un faux positif.
      const rollback = new Set(get().ids);
      if (wasFavorite) rollback.add(businessId);
      else rollback.delete(businessId);
      set({ ids: rollback });
    }
  },

  clear: () => set({ ids: new Set(), loaded: false }),
}));
