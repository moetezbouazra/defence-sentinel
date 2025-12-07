import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

// the translations
const resources = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  }
};

i18n
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    lng: 'en', // language to use
    interpolation: {
      escapeValue: false // react already does escaping
    }
  });

export default i18n;