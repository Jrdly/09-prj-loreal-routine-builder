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
const topicHelper = document.getElementById("topicHelper");
const quickPrompts = document.getElementById("quickPrompts");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Keep the original button markup so loading states can be restored */
const defaultSendButtonHTML = sendBtn.innerHTML;
const defaultGenerateButtonHTML = generateRoutineBtn.innerHTML;

/* Cache products once they are loaded */
let productsCache = [];
let productsLoaded = false;

/* Track the most recent request so the user can retry after a failure */
let lastRequest = null;

/* Flag to prevent duplicate user messages when retrying a request */
let isRetrySubmission = false;

/* Apply a direction to the page and chat UI elements */
function applyDirection(isRtl) {
  const direction = isRtl ? "rtl" : "ltr";

  document.documentElement.dir = direction;
  document.body.dir = direction;

  if (chatWindow) {
    chatWindow.dir = direction;
  }
  if (chatForm) {
    chatForm.dir = direction;
  }
  if (userInput) {
    userInput.dir = direction;
  }
}

/* Initialize RTL/LTR direction from the browser language */
function initializeLanguageDirection() {
  const browserLanguage =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    "en";
  const languageCode = browserLanguage.split("-")[0].toLowerCase();
  const isRtl = /^(ar|he|fa|ur)$/i.test(languageCode);

  document.documentElement.lang = languageCode;
  applyDirection(isRtl);
  document.body.classList.toggle("rtl", isRtl);

  console.log(
    `Browser language detected: ${browserLanguage} (${isRtl ? "RTL" : "LTR"})`,
  );
}

/* Get a friendly label for the current topic */
function getTopicLabel(category) {
  return API_CONFIG.CATEGORY_LABELS[category] || "Beauty";
}

/* Load persisted data from localStorage on page load */
function restorePersistedData() {
  // Restore selected products
  selectedProducts = Storage.loadSelectedProducts();
  console.log(`Restored ${selectedProducts.length} selected products`);

  // Reset chat history on each page load
  chatHistory = [];
  Storage.clearChatHistory();
  console.log("Chat history cleared on page load");
}

/* Update the helper text and quick prompts based on the active topic */
function refreshTopicUI() {
  const topicCategory = getTopicCategory();
  const topicLabel = topicCategory ? getTopicLabel(topicCategory) : "Beauty";

  if (topicHelper) {
    topicHelper.textContent = topicCategory
      ? `Quick prompts for ${topicLabel}. Tap one to ask immediately.`
      : "Pick a category to get quick prompt suggestions.";
  }

  if (quickPrompts) {
    const promptList =
      API_CONFIG.QUICK_PROMPTS[topicCategory] ||
      API_CONFIG.QUICK_PROMPTS.default;

    quickPrompts.innerHTML = promptList
      .map(
        (prompt) => `
          <button type="button" class="quick-prompt-chip" data-prompt="${prompt.replaceAll('"', "&quot;")}">${prompt}</button>
        `,
      )
      .join("");

    quickPrompts.querySelectorAll(".quick-prompt-chip").forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.prompt || "";
        if (!prompt) {
          return;
        }

        userInput.value = prompt;
        userInput.focus();
        chatForm.requestSubmit();
      });
    });
  }
}

/* Run initialization when DOM is ready */
initializeLanguageDirection();
restorePersistedData();
refreshTopicUI();

// Initialize selected products list
renderSelectedProductsList();

// Initialize chat (start fresh on each page load)
initializeChat();

// Attach event listeners
chatForm.addEventListener("submit", handleChatSubmission);
generateRoutineBtn.addEventListener("click", handleGenerateRoutine);

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  if (productsLoaded && productsCache.length > 0) {
    return productsCache;
  }

  const response = await fetch("products.json");
  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`);
  }

  const data = await response.json();
  productsCache = data.products || [];
  productsLoaded = true;
  return productsCache;
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
  refreshTopicUI();
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

  refreshTopicUI();
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
  let contentHTML = isUser ? escapeHtml(message.content) : message.content;
  const messageDirection = document.documentElement.dir || "ltr";

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
    <div class="chat-message ${messageClass}" dir="${messageDirection}">
      <div class="message-content">${contentHTML}</div>
      ${sourcesHTML}
    </div>
  `;
}

/* Escape plain text before inserting it into the DOM */
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* Update the chat and generate buttons while a request is running */
function setLoadingState(isLoading) {
  sendBtn.disabled = isLoading;
  generateRoutineBtn.disabled = isLoading;
  userInput.disabled = isLoading;

  if (isLoading) {
    sendBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i><span class="visually-hidden">Loading</span>';
    generateRoutineBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
  } else {
    sendBtn.innerHTML = defaultSendButtonHTML;
    generateRoutineBtn.innerHTML = defaultGenerateButtonHTML;
  }
}

/* Show a retryable error message inside the chat */
function appendRetryMessage(messageText, onRetry) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-message assistant-message error-message";
  wrapper.innerHTML = `
    <div class="message-content">${escapeHtml(messageText)}</div>
    <button type="button" class="retry-btn">Try again</button>
  `;

  const retryButton = wrapper.querySelector(".retry-btn");
  retryButton.addEventListener("click", onRetry);

  chatWindow.appendChild(wrapper);
  if (UI_CONFIG.AUTO_SCROLL_CHAT) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

/* Retry the most recent failed request */
function retryLastRequest() {
  if (!lastRequest) {
    return;
  }

  if (lastRequest.type === "routine") {
    isRetrySubmission = true;
    handleGenerateRoutine();
    return;
  }

  if (lastRequest.type === "chat") {
    userInput.value = lastRequest.message;
    isRetrySubmission = true;
    chatForm.requestSubmit();
  }
}

/* Add a short instruction to keep AI responses concise */
function getSelectedProductCategory() {
  const categories = [
    ...new Set(selectedProducts.map((product) => product.category)),
  ].filter(Boolean);

  if (categories.length === 1) {
    return categories[0];
  }

  return "";
}

/* Get the current topic category from the filter or selected products */
function getTopicCategory() {
  const filterCategory = categoryFilter.value.trim();
  if (filterCategory) {
    return filterCategory;
  }

  return getSelectedProductCategory();
}

/* Get the current topic category from the filter or selected products */
function getTopicCategory() {
  const filterCategory = categoryFilter.value.trim();
  if (filterCategory) {
    return filterCategory;
  }

  return getSelectedProductCategory();
}

/* Get the prompt that keeps the AI focused on the current category */
function getTopicPrompt() {
  const topicCategory = getTopicCategory();
  return (
    API_CONFIG.CATEGORY_PROMPTS[topicCategory] ||
    API_CONFIG.CATEGORY_PROMPTS.default
  );
}

/* Build a short prompt that keeps the AI concise and on topic */
function buildConcisePrompt(userMessage) {
  const topicPrompt = getTopicPrompt();
  const selectedProductNames = selectedProducts
    .map((product) => product.name)
    .join(", ");

  return [
    API_CONFIG.SYSTEM_PROMPT,
    topicPrompt,
    selectedProductNames ? `Selected products: ${selectedProductNames}` : "",
    `User request: ${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/* Send a request to the Worker and normalize the response */
async function requestRoutineResponse(userMessage) {
  const requestBody = {
    message: buildConcisePrompt(userMessage),
    conversation_history: chatHistory,
    selected_products: selectedProducts,
    language: getLanguageForAPI(),
    concise_mode: true,
    system_prompt: API_CONFIG.SYSTEM_PROMPT,
  };

  const response = await fetch(API_CONFIG.ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let details = "";
    try {
      details = await response.text();
    } catch (error) {
      details = response.statusText;
    }

    throw new Error(
      `API error: ${response.status} ${response.statusText}${details ? ` - ${details}` : ""}`,
    );
  }

  return response.json();
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
  chatWindow.innerHTML = "";
}

/* Handle Generate Routine button click */
async function handleGenerateRoutine() {
  if (selectedProducts.length === 0) {
    isRetrySubmission = false;
    alert("Please select at least one product before generating a routine.");
    return;
  }

  // Create initial routine request message
  const productsList = selectedProducts
    .map((p) => `${p.name} (${p.brand})`)
    .join(", ");
  const initialMessage = `Please create a personalized skincare/haircare routine based on these selected products: ${productsList}`;

  lastRequest = { type: "routine", message: initialMessage };

  if (!isRetrySubmission) {
    // Add user message to chat
    const userMsg = { role: "user", content: initialMessage };
    chatHistory.push(userMsg);
    appendChatMessage(userMsg, true);
  }

  // Clear input
  userInput.value = "";
  setLoadingState(true);

  // Get API response
  try {
    const response = await requestRoutineResponse(initialMessage);

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
    console.error("Generate routine error:", error);
    appendRetryMessage(
      `Sorry, I couldn't generate the routine. ${error.message}`,
      retryLastRequest,
    );
  } finally {
    isRetrySubmission = false;
    setLoadingState(false);
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

  lastRequest = { type: "chat", message: userMessage };

  if (!isRetrySubmission) {
    // Add user message to UI and chat history
    const userMsg = { role: "user", content: userMessage };
    chatHistory.push(userMsg);
    appendChatMessage(userMsg, true);
  }

  // Disable input while waiting for response
  userInput.value = "";
  setLoadingState(true);

  try {
    // Get response from API
    const response = await requestRoutineResponse(userMessage);

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
    appendRetryMessage(
      `Sorry, I couldn't process your request. ${error.message}`,
      retryLastRequest,
    );
  } finally {
    // Re-enable input
    isRetrySubmission = false;
    setLoadingState(false);
    userInput.focus();
  }
}

/* Initialize chat on page load */
function initializeChat() {
  loadChatHistoryIntoUI();
}
