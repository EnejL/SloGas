import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translation files
import slTranslations from "./translations/sl.json";
import enTranslations from "./translations/en.json";
import itTranslations from "./translations/it.json";
import deTranslations from "./translations/de.json";
import hrTranslations from "./translations/hr.json";


// Storage key for language preference
const LANGUAGE_STORAGE_KEY = "@SloGas:language";

// Configure resources
const resources = {
  sl: { translation: slTranslations },
  en: { translation: enTranslations },
  it: { translation: itTranslations },
  de: { translation: deTranslations },
  hr: { translation: hrTranslations },
};

// Function to get saved language from storage
export const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage || "en"; // Default to English if no saved preference
  } catch (error) {
    console.error("Error loading saved language:", error);
    return "en"; // Fallback to English on error
  }
};

// Function to save language preference to storage
export const saveLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error("Error saving language preference:", error);
  }
};

// Function to get current language (from i18n instance)
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Function to get current language with fallback to saved preference
export const getCurrentLanguageWithFallback = async () => {
  const currentLanguage = i18n.language;
  if (currentLanguage) {
    return currentLanguage;
  }
  // If i18n not initialized yet, get from storage
  return await getSavedLanguage();
};

// Initialize i18n with persistence
const initI18n = async () => {
  const savedLanguage = await getSavedLanguage();
  
  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
};

// Initialize immediately
initI18n();

export default i18n;
