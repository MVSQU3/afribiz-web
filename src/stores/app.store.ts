import { create } from 'zustand';
import i18n from '../i18n';

type Language = 'fr' | 'en';

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: (i18n.language?.slice(0, 2) as Language) ?? 'fr',
  setLanguage: (lang) => {
    void i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
