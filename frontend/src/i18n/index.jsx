import React, { createContext, useContext, useState } from 'react';
import tr from './tr';
import en from './en';

const translations = { tr, en };

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('language') || 'tr');

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
