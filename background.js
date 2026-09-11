chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("museum.html") });
});

// Capture logic
let captureTimeout = null;

async function captureActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    
    // Don't capture internal pages
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

    // Capture the visible tab
    chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 50 }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.log("Capture failed", chrome.runtime.lastError);
        return;
      }
      // Save to local storage keyed by tab ID
      const key = `screenshot_${tab.id}`;
      chrome.storage.local.set({ [key]: dataUrl });
    });
  } catch (err) {
    console.error("Error capturing tab", err);
  }
}

function scheduleCapture() {
  if (captureTimeout) clearTimeout(captureTimeout);
  captureTimeout = setTimeout(() => {
    captureActiveTab();
  }, 1500); // wait 1.5 seconds after activation/update to let rendering finish
}

chrome.tabs.onActivated.addListener(scheduleCapture);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    scheduleCapture();
  }
});

// Clean up screenshots when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `screenshot_${tabId}`;
  chrome.storage.local.remove(key);
});
