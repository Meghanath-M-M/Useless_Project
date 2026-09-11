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
      // Save to local storage keyed by tab ID, including metadata for the auction
      const key = `screenshot_${tab.id}`;
      chrome.storage.local.set({ 
        [key]: dataUrl,
        [`title_${tab.id}`]: tab.title,
        [`url_${tab.id}`]: tab.url
      });
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
chrome.runtime.onInstalled.addListener(scheduleCapture);
chrome.runtime.onStartup.addListener(scheduleCapture);

// Move screenshots to the auction block when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `screenshot_${tabId}`;
  chrome.storage.local.get([key, `title_${tabId}`, `url_${tabId}`, 'auctioned_tabs'], (result) => {
    if (result[key]) {
      let auctioned = result.auctioned_tabs || [];
      auctioned.push({
        id: tabId,
        title: result[`title_${tabId}`] || 'Unknown Artifact',
        url: result[`url_${tabId}`] || '',
        closedAt: new Date().getTime()
      });
      
      // Keep only the last 4 closed tabs in the auction house to save space
      if (auctioned.length > 4) {
        const removed = auctioned.shift();
        chrome.storage.local.remove([`screenshot_${removed.id}`, `title_${removed.id}`, `url_${removed.id}`]);
      }
      
      chrome.storage.local.set({ auctioned_tabs: auctioned });
    }
  });
});
