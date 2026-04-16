// Configuration for L'Oréal Routine Builder

// localStorage key constants
const STORAGE_KEYS = {
  SELECTED_PRODUCTS: "loreal_selected_products",
  CHAT_HISTORY: "loreal_chat_history",
};

// API Configuration
const API_CONFIG = {
  // Replace with your Cloudflare Worker endpoint
  ENDPOINT: "https://open-ai-key.deandrejr50.workers.dev/",
  // OpenAI model to use
  MODEL: "gpt-4o",
  // Concise response instruction used for every AI request
  SYSTEM_PROMPT:
    "You are a skincare routine assistant. Provide concise, practical advice for skincare routines in 2-3 sentences maximum.",
  // Category-specific instructions to keep the assistant on topic
  CATEGORY_PROMPTS: {
    cleanser:
      "Focus only on cleansers, cleansing routines, and skin-barrier-safe cleansing advice.",
    moisturizer:
      "Focus only on moisturizers, hydration, barrier support, and daytime or nighttime moisturizing routines.",
    skincare:
      "Focus on skincare treatments such as serums, retinol, vitamin C, eye care, and complete skincare routines.",
    haircare:
      "Focus only on haircare, shampoo, conditioner, scalp care, and hair routine advice.",
    makeup:
      "Focus only on makeup products, application steps, wear time, and makeup routine advice.",
    "hair color":
      "Focus only on hair color care, color maintenance, and color-safe product advice.",
    "hair styling":
      "Focus only on hair styling products, styling steps, and styling routine advice.",
    "men's grooming":
      "Focus only on men's grooming products and routine steps.",
    suncare:
      "Focus only on sunscreen, SPF, sun protection, and daily sun-care routines.",
    fragrance: "Focus only on fragrance choices, layering, and scent advice.",
    default:
      "Stay on the user's selected beauty topic and do not drift into unrelated categories.",
  },
  // Friendly labels for the active topic
  CATEGORY_LABELS: {
    cleanser: "Cleansers",
    moisturizer: "Moisturizers",
    skincare: "Skincare",
    haircare: "Haircare",
    makeup: "Makeup",
    "hair color": "Hair Color",
    "hair styling": "Hair Styling",
    "men's grooming": "Men's Grooming",
    suncare: "Suncare",
    fragrance: "Fragrance",
  },
  // One-tap prompt suggestions for each topic
  QUICK_PROMPTS: {
    cleanser: [
      "Which cleanser is best for sensitive skin?",
      "How often should I use a cleanser?",
      "Morning or night cleanser routine?",
    ],
    moisturizer: [
      "Which moisturizer should I use first?",
      "What is the best morning moisturizer routine?",
      "Can I layer this with sunscreen?",
    ],
    skincare: [
      "What order should I use these products?",
      "How do I build a simple skincare routine?",
      "Which product should I use at night?",
    ],
    haircare: [
      "What is the best haircare routine for me?",
      "How often should I wash my hair?",
      "Which product should I use first?",
    ],
    makeup: [
      "How should I start a simple makeup routine?",
      "Which makeup step comes first?",
      "What is a quick everyday makeup look?",
    ],
    "hair color": [
      "How do I care for colored hair?",
      "How can I help my hair color last longer?",
      "What products protect hair color best?",
    ],
    "hair styling": [
      "How do I style my hair with these products?",
      "What is the best styling order?",
      "How can I get a quick everyday style?",
    ],
    "men's grooming": [
      "What is a simple grooming routine?",
      "Which product should I use first?",
      "How can I build a quick daily routine?",
    ],
    suncare: [
      "When should I apply sunscreen?",
      "How often should I reapply SPF?",
      "Can I use this with my moisturizer?",
    ],
    fragrance: [
      "How do I choose a fragrance for daily wear?",
      "How can I make fragrance last longer?",
      "What is a good fragrance layering tip?",
    ],
    default: [
      "What should I try first?",
      "Can you suggest a simple routine?",
      "How do I use these products together?",
    ],
  },
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
