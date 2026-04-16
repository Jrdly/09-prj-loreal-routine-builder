/* =======================
   INITIALIZATION & STATE
   ======================= */

/* Global state for selected products */
let selectedProducts = [];

/* Global state for chat history */
let chatHistory = [];

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Initialize language and RTL support on page load */
function initializeLanguage() {
  // Load language preference (auto-detects browser language if not saved)
  const language = Storage.loadLanguagePreference();

  // Set dir attribute for RTL languages
  const htmlElement = document.documentElement;
  htmlElement.dir = language.rtl ? "rtl" : "ltr";
  htmlElement.lang = language.code;

  // Add language class to body for CSS styling
  document.body.classList.add(`lang-${language.code}`);
  if (language.rtl) {
    document.body.classList.add("rtl");
  }

  console.log(
    `Language initialized: ${language.name} (${language.code}${language.rtl ? ", RTL" : ""})`,
  );
}

/* Load persisted data from localStorage on page load */
function restorePersistedData() {
  // Restore selected products
  selectedProducts = Storage.loadSelectedProducts();
  console.log(`Restored ${selectedProducts.length} selected products`);

  // Restore chat history
  chatHistory = Storage.loadChatHistory();
  console.log(`Restored ${chatHistory.length} chat messages`);
}

/* Run initialization when DOM is ready */
initializeLanguage();
restorePersistedData();

// Initialize selected products list
renderSelectedProductsList();

// Initialize chat (restore conversation history from storage)
initializeChat();

// Attach event listeners
chatForm.addEventListener("submit", handleChatSubmission);
document
  .getElementById("generateRoutine")
  .addEventListener("click", handleGenerateRoutine);

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Check if a product is currently selected */
function isProductSelected(productId) {
  return selectedProducts.some((p) => p.id === productId);
}

/* Toggle product selection on/off */
function toggleProductSelection(product) {
  const index = selectedProducts.findIndex((p) => p.id === product.id);

  if (index > -1) {
    // Product already selected - remove it
    selectedProducts.splice(index, 1);
  } else {
    // Product not selected - add it
    selectedProducts.push(product);
  }

  // Persist to localStorage
  Storage.saveSelectedProducts(selectedProducts);

  // Update visual state
  updateProductCardStates();
  renderSelectedProductsList();
}

/* Update visual state of product cards based on selection */
function updateProductCardStates() {
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    if (isProductSelected(productId)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Render the list of selected products above the Generate Routine button */
function renderSelectedProductsList() {
  const container = document.getElementById("selectedProductsList");

  if (selectedProducts.length === 0) {
    container.innerHTML = '<p class="empty-message">No products selected</p>';
    return;
  }

  const pills = selectedProducts
    .map(
      (product) => `
      <div class="product-pill">
        <span class="pill-label">${product.name}</span>
        <button type="button" class="pill-remove" data-product-id="${product.id}" aria-label="Remove ${product.name}">
          ×
        </button>
      </div>
    `,
    )
    .join("");

  const clearButton =
    selectedProducts.length > 1
      ? '<button type="button" id="clearAllBtn" class="clear-all-btn">Clear All</button>'
      : "";

  container.innerHTML = pills + clearButton;

  // Attach event listeners to remove buttons
  container.querySelectorAll(".pill-remove").forEach((btn) => {
    btn.addEventListener("click", handleRemoveProduct);
  });

  // Attach event listener to clear all button
  const clearBtn = container.querySelector("#clearAllBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      selectedProducts = [];
      Storage.saveSelectedProducts(selectedProducts);
      renderSelectedProductsList();
      updateProductCardStates();
    });
  }
}

/* Handle removing a product from selected list */
function handleRemoveProduct(e) {
  e.preventDefault();
  const productId = parseInt(e.target.dataset.productId);
  toggleProductSelection(selectedProducts.find((p) => p.id === productId));
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}" role="button" tabindex="0" aria-label="Select ${product.name}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="description-overlay" aria-hidden="true">
        <p>${product.description}</p>
      </div>
    </div>
  `,
    )
    .join("");

  // Update visual state for already selected products
  updateProductCardStates();

  // Attach click and keyboard event listeners to all product cards
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = parseInt(card.dataset.productId);
      const product = products.find((p) => p.id === productId);
      if (product) {
        toggleProductSelection(product);
      }
    });

    // Add keyboard support (Enter key to select)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const productId = parseInt(card.dataset.productId);
        const product = products.find((p) => p.id === productId);
        if (product) {
          toggleProductSelection(product);
        }
      }
    });
  });
}

/* Debounce function to delay filter execution */
function debounce(func, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delayMs);
  };
}

/* Combined filter for search and category */
async function applyFilters() {
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const searchQuery = productSearch.value.toLowerCase().trim();

  let filteredProducts = products;

  // Filter by category (if selected)
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory,
    );
  }

  // Filter by search query (search name, brand, and description)
  if (searchQuery) {
    filteredProducts = filteredProducts.filter((product) => {
      const name = product.name.toLowerCase();
      const brand = product.brand.toLowerCase();
      const description = product.description.toLowerCase();

      return (
        name.includes(searchQuery) ||
        brand.includes(searchQuery) ||
        description.includes(searchQuery)
      );
    });
  }

  // Show appropriate message if no results
  if (filteredProducts.length === 0 && (selectedCategory || searchQuery)) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products match your search
      </div>
    `;
  } else if (!selectedCategory && !searchQuery) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;
  } else {
    displayProducts(filteredProducts);
  }
}

/* Debounced filter function */
const debouncedFilter = debounce(applyFilters, UI_CONFIG.SEARCH_DEBOUNCE_MS);

/* Event listeners for category and search filters */
categoryFilter.addEventListener("change", debouncedFilter);
productSearch.addEventListener("input", debouncedFilter);

/* =======================
   CHAT & API FUNCTIONS
   ======================= */

/* Get current language code */
function getLanguageForAPI() {
  return document.documentElement.lang || "en";
}

/* Render a single chat message with proper formatting */
function renderChatMessage(message, isUser = false) {
  const messageClass = isUser ? "user-message" : "assistant-message";
  let contentHTML = message.content;

  // If this is an assistant message with sources, add them at the end
  let sourcesHTML = "";
  if (
    !isUser &&
    message.sources &&
    message.sources.length > 0 &&
    UI_CONFIG.SHOW_SOURCES
  ) {
    sourcesHTML = `
      <div class="chat-sources">
        <strong>Sources:</strong>
        <ul>
          ${message.sources.map((source) => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a></li>`).join("")}
        </ul>
      </div>
    `;
  }

  return `
    <div class="chat-message ${messageClass}">
      <div class="message-content">${contentHTML}</div>
      ${sourcesHTML}
    </div>
  `;
}

/* Append a chat message to the chat window */
function appendChatMessage(message, isUser = false) {
  const messageHTML = renderChatMessage(message, isUser);
  chatWindow.innerHTML += messageHTML;

  // Auto-scroll to latest message
  if (UI_CONFIG.AUTO_SCROLL_CHAT) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

/* Load persisted chat history into the UI on page load */
function loadChatHistoryIntoUI() {
  if (chatHistory.length === 0) {
    return; // No chat history to restore
  }

  chatHistory.forEach((msg) => {
    appendChatMessage(msg, msg.role === "user");
  });
}

/* Call OpenAI API through Cloudflare Worker */
async function callOpenAIAPI(userMessage) {
  try {
    const requestBody = {
      message: userMessage,
      conversation_history: chatHistory,
      selected_products: selectedProducts,
      language: getLanguageForAPI(),
    };

    const response = await fetch(API_CONFIG.ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Expected: { content: "...", sources: [...] }
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

/* Handle Generate Routine button click */
async function handleGenerateRoutine() {
  if (selectedProducts.length === 0) {
    alert("Please select at least one product before generating a routine.");
    return;
  }

  // Create initial routine request message
  const productsList = selectedProducts
    .map((p) => `${p.name} (${p.brand})`)
    .join(", ");
  const initialMessage = `Please create a personalized skincare/haircare routine based on these selected products: ${productsList}`;

  // Add user message to chat
  const userMsg = { role: "user", content: initialMessage };
  chatHistory.push(userMsg);
  appendChatMessage(userMsg, true);

  // Clear input
  document.getElementById("userInput").value = "";

  // Get API response
  try {
    const response = await callOpenAIAPI(initialMessage);

    // Add assistant response to chat
    const assistantMsg = {
      role: "assistant",
      content: response.content || response,
      sources: response.sources || [],
    };
    chatHistory.push(assistantMsg);
    appendChatMessage(assistantMsg, false);

    // Persist updated chat history
    Storage.saveChatHistory(chatHistory);
  } catch (error) {
    // Show error message to user
    const errorMsg = {
      role: "assistant",
      content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      sources: [],
    };
    chatHistory.push(errorMsg);
    appendChatMessage(errorMsg, false);
  }
}

/* Handle chat form submission */
async function handleChatSubmission(e) {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (!userMessage) {
    return; // Don't submit empty messages
  }

  // Add user message to UI and chat history
  const userMsg = { role: "user", content: userMessage };
  chatHistory.push(userMsg);
  appendChatMessage(userMsg, true);

  // Disable input while waiting for response
  const sendBtn = document.getElementById("sendBtn");
  const wasDisabled = sendBtn.disabled;
  sendBtn.disabled = true;
  userInput.disabled = true;
  userInput.value = "";

  try {
    // Get response from API
    const response = await callOpenAIAPI(userMessage);

    // Add assistant response to chat
    const assistantMsg = {
      role: "assistant",
      content: response.content || response,
      sources: response.sources || [],
    };
    chatHistory.push(assistantMsg);
    appendChatMessage(assistantMsg, false);

    // Persist updated chat history
    Storage.saveChatHistory(chatHistory);
  } catch (error) {
    console.error("Chat submission error:", error);

    // Show error message
    const errorMsg = {
      role: "assistant",
      content: `Sorry, I couldn't process your request. Please try again. (Error: ${error.message})`,
      sources: [],
    };
    chatHistory.push(errorMsg);
    appendChatMessage(errorMsg, false);
  } finally {
    // Re-enable input
    sendBtn.disabled = wasDisabled;
    userInput.disabled = false;
    userInput.focus();
  }
}

/* Initialize chat on page load */
function initializeChat() {
  loadChatHistoryIntoUI();
}
