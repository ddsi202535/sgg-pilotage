import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';

const translations = { fr, ar };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('appLang') || 'fr');

  useEffect(() => {
    localStorage.setItem('appLang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prevLang) => (prevLang === 'fr' ? 'ar' : 'fr'));
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value[k] === undefined) {
        return key;
      }
      value = value[k];
    }
    return value;
  }, [language]);

  const contextValue = useMemo(() => ({ language, toggleLanguage, t }), [language, toggleLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
