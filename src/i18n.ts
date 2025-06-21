// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // load translation using http -> see /public/locales
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(HttpApi)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    supportedLngs: ['en', 'ar'], // Add all languages you support
    fallbackLng: 'en', // Default language if detection fails or selected lang is not supported
    debug: process.env.NODE_ENV === 'development', // Enable debug output in development

    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // Where to cache the selected language
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Path to your translation files
    },

    react: {
      useSuspense: true, // Recommended for managing loading states
    },
  });

export default i18n;