import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'it';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: localStorage.getItem('language') as Language || 'en',
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
); 