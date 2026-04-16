// Configuration for L'Oréal Routine Builder

// Supported languages with RTL flag
const LANGUAGES = {
  en: { name: "English", rtl: false, code: "en" },
  fr: { name: "Français", rtl: false, code: "fr" },
  de: { name: "Deutsch", rtl: false, code: "de" },
  ar: { name: "العربية", rtl: true, code: "ar" },
};

// localStorage key constants
const STORAGE_KEYS = {
  SELECTED_PRODUCTS: "loreal_selected_products",
  CHAT_HISTORY: "loreal_chat_history",
  LANGUAGE_PREFERENCE: "loreal_language_preference",
};

// API Configuration
const API_CONFIG = {
  // Replace with your Cloudflare Worker endpoint
  ENDPOINT: "https://your-worker.workers.dev/chat",
  // OpenAI model to use
  MODEL: "gpt-4o",
  // Conversation context limit (how many recent messages to include)
  CONTEXT_LIMIT: 10,
};

// UI Configuration
const UI_CONFIG = {
  // Chat window height in viewport
  CHAT_WINDOW_HEIGHT: 250,
  // Product grid columns (responsive)
  PRODUCT_GRID_COLS: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  // Search debounce delay (ms)
  SEARCH_DEBOUNCE_MS: 300,
  // Auto-scroll chat on new message
  AUTO_SCROLL_CHAT: true,
  // Show sources section in chat responses
  SHOW_SOURCES: true,
};
