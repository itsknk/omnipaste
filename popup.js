const textArea = document.getElementById("input-text");
const pasteBtn = document.getElementById("paste-btn");
const clearBtn = document.getElementById("clear-btn");

// Retrieve saved text from Chrome storage and populate the text area
chrome.storage.local.get("inputText", (result) => {
  const savedInputText = result.inputText;
  textArea.value = savedInputText ?? "";
});

// Save the text to Chrome storage on every keyup event
textArea.addEventListener("keyup", () => {
  const inputText = textArea.value;
  chrome.storage.local.set({ inputText: inputText });
});

// Submit the text on Enter key press (without Shift key)
textArea.addEventListener("keydown", (event) => {
  if (event.code === "Enter" && !event.shiftKey) {
    event.preventDefault();
    pasteBtn.click();
  }
});

// Clear the text area and Chrome storage on Clear button click
clearBtn.addEventListener("click", (event) => {
  event.preventDefault();
  textArea.value = "";
  chrome.storage.local.set({ inputText: "" });
});

// Main logic to paste text into multiple LLM chat platforms
pasteBtn.addEventListener("click", async () => {
  const inputText = textArea.value;
  const selectedUrls = [
    "https://chatgpt.com/*",
    "https://groq.com/*",
    "https://claude.ai/*",
    "https://chat.deepseek.com/*",
    "https://chat.mistral.ai/*",
    "https://gemini.google.com/*",
  ];

  // Query for all tabs matching the selected URLs
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    url: selectedUrls,
  });

  // Execute the paste function in each matched tab
  for (const tab of tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: pasteIntoInputFields,
      args: [inputText],
    });
  }
});

// Function to paste text into the input fields of LLM chat platforms
function pasteIntoInputFields(text) {
  // Select input fields for different platforms
  const inputType1 = document.querySelectorAll(
    'input[type="text"], input[type="search"], textarea, #prompt-textarea'
  );
  const inputType2 = document.querySelectorAll("div[contenteditable] p");

  const isClaudeOrGemini = inputType2.length === 1;
  const geminiButton = document.querySelector(".send-button");

  // Choose the appropriate input field
  const input = isClaudeOrGemini ? inputType2[0] : inputType1[0];

  // Set the text value in the input field
  if (isClaudeOrGemini) {
    input.textContent = text;
  } else {
    input.value = text;
  }

  // Trigger the Enter key event to submit the text
  setTimeout(function () {
    const enterEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      keyCode: 13,
    });
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(enterEvent);
    
    // Click the send button for Gemini
    if (geminiButton) {
      geminiButton.click();
    }
  }, 500);
}
