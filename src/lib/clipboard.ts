/**
 * Copie un texte dans le presse-papiers, avec repli.
 *
 * `navigator.clipboard` échoue plus souvent qu'on ne le croit : contexte non
 * sécurisé (HTTP), permission refusée, navigateur intégré à une application
 * (Facebook, Instagram) — des cas courants sur le trafic mobile visé. Le repli
 * historique `execCommand('copy')` est déprécié mais ne demande aucune
 * permission et reste implémenté partout.
 *
 * Renvoie `false` si aucune méthode n'a fonctionné : à l'appelant de proposer
 * autre chose plutôt que d'échouer en silence.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // On tente le repli ci-dessous.
    }
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    // Hors écran plutôt que `display: none` : un champ non rendu n'est pas
    // sélectionnable, et la sélection est ce qui déclenche la copie.
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.setAttribute('readonly', '');
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
