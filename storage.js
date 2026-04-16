// Storage module for L'Oréal Routine Builder
// Manages localStorage for products, chat history, and language preferences

const Storage = {
  // Save selected products to localStorage
  saveSelectedProducts: function (productsArray) {
    try {
      const json = JSON.stringify(productsArray);
      localStorage.setItem(STORAGE_KEYS.SELECTED_PRODUCTS, json);
    } catch (error) {
      console.error("Error saving selected products:", error);
    }
  },

  // Load selected products from localStorage
  loadSelectedProducts: function () {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.SELECTED_PRODUCTS);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error("Error loading selected products:", error);
      return [];
    }
  },

  // Clear all selected products
  clearSelectedProducts: function () {
    try {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_PRODUCTS);
    } catch (error) {
      console.error("Error clearing selected products:", error);
    }
  },

  // Save chat history to localStorage
  saveChatHistory: function (messagesArray) {
    try {
      // Keep only the most recent messages to avoid localStorage bloat
      const limited = messagesArray.slice(-API_CONFIG.CONTEXT_LIMIT);
      const json = JSON.stringify(limited);
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, json);
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  },

  // Load chat history from localStorage
  loadChatHistory: function () {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  },

  // Clear chat history
  clearChatHistory: function () {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  },

  // Save language preference
  saveLanguagePreference: function (langCode) {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, langCode);
    } catch (error) {
      console.error("Error saving language preference:", error);
    }
  },

  // Load language preference with fallback to browser language detection
  loadLanguagePreference: function () {
    try {
      // Check if user has saved preference
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
      if (saved && LANGUAGES[saved]) {
        return LANGUAGES[saved];
      }

      // Fall back to browser language
      const browserLang = navigator.language.split("-")[0]; // e.g., 'en' from 'en-US'
      if (LANGUAGES[browserLang]) {
        return LANGUAGES[browserLang];
      }

      // Default to English if browser language not supported
      return LANGUAGES.en;
    } catch (error) {
      console.error("Error loading language preference:", error);
      return LANGUAGES.en;
    }
  },

  // Check if localStorage is available
  isAvailable: function () {
    try {
      const test = "__loreal_storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn("localStorage not available:", error);
      return false;
    }
  },
};
