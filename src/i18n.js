import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import mrTranslations from './locales/mr.json';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      mr: {
        translation: mrTranslations
      }
    },
    lng: 'en', // default language
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
