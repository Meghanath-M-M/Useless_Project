document.addEventListener('DOMContentLoaded', () => {
  // Load saved key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });

  // Save key
  document.getElementById('saveBtn').addEventListener('click', () => {
    const key = document.getElementById('apiKey').value.trim();
    chrome.storage.sync.set({ geminiApiKey: key }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Settings saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
