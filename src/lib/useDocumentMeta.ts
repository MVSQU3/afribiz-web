import { useEffect } from 'react';

/**
 * Met à jour le titre et la description du document.
 *
 * Ne remplace **pas** le rendu serveur des aperçus de partage : les robots de
 * WhatsApp, Facebook ou Telegram n'exécutent pas le JavaScript et ne verront
 * jamais ce qui est posé ici (ils sont aiguillés par nginx vers l'API). Ce hook
 * sert à l'onglet du navigateur, aux favoris, à l'historique — et à Google, qui
 * lui exécute le JavaScript.
 *
 * Le titre précédent est restauré au démontage, sinon le titre d'une annonce
 * resterait affiché après un retour vers la recherche.
 */
export function useDocumentMeta(title?: string | null, description?: string | null) {
  useEffect(() => {
    if (!title) return;

    const previousTitle = document.title;
    document.title = title;

    const tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = tag?.content;
    if (tag && description) tag.content = description;

    return () => {
      document.title = previousTitle;
      if (tag && previousDescription !== undefined) tag.content = previousDescription;
    };
  }, [title, description]);
}
