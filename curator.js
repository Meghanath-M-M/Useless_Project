class Curator {
  constructor() {
    this.apiKey = null;
  }

  async init() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey'], (result) => {
        this.apiKey = result.geminiApiKey || null;
        resolve();
      });
    });
  }

  async getCuratorialAnalysis(itemType, itemContent, itemTitle = '') {
    if (this.apiKey) {
      try {
        return await this.callGeminiAPI(itemType, itemContent, itemTitle);
      } catch (e) {
        console.error("LLM failed, falling back to mock", e);
        return this.getMockAnalysis(itemType, itemContent);
      }
    } else {
      // Small delay to simulate AI
      await new Promise(r => setTimeout(r, 1200));
      return this.getMockAnalysis(itemType, itemContent);
    }
  }

  async callGeminiAPI(itemType, itemContent, itemTitle) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
    
    let prompt = `You are a pretentious, overly academic, and somewhat cynical museum curator. 
You are curating an exhibition of a user's digital clutter (open browser tabs and clipboard history).
Write a museum placard description (2-3 short sentences) for the following item. 
Make it sound deeply philosophical, slightly embarrassing, or absurdly analytical of their mundane digital habits.
Do NOT use quotes. Do NOT start with "This piece".

Item Type: ${itemType}
`;

    if (itemType === 'Tab') {
      prompt += `Tab Title: ${itemTitle}\nTab URL: ${itemContent}`;
    } else {
      prompt += `Clipboard Text: ${itemContent.substring(0, 500)}`;
    }

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 150,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('API Error');

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }

  getMockAnalysis(itemType, itemContent) {
    const mockDescriptions = [
      "A haunting exploration of intent versus execution. The subject opened this hoping to learn, yet it has lingered here, unseen, a digital ghost of ambition.",
      "Notice the stark utilitarianism. It speaks to the human condition's desperate need to hold onto fragmented information, fearing it might someday be useful.",
      "An exquisite example of late-capitalist procrastination. The sheer mundane nature of this artifact forces the viewer to confront their own mortality.",
      "A chaotic juxtaposition of fragmented thought. The curator finds this piece derivative, yet undeniably tragic in its abandonment.",
      "This artifact represents the ephemeral nature of focus. A monument to a fleeting hyperfixation, discarded as quickly as it was acquired.",
      "Observe the brazen disregard for context. We are left to wonder: was this a moment of genius, or merely a slip of the mechanical finger?",
      "An artifact suspended in a purgatory of 'read-it-later'. The artist forces us to question if 'later' is simply a euphemism for never."
    ];
    return mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)];
  }
}
