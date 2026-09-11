document.addEventListener('DOMContentLoaded', async () => {
  const enterBtn = document.getElementById('enterBtn');
  const entrance = document.getElementById('entrance');
  const museum = document.getElementById('museum');
  const galleryContainer = document.querySelector('.gallery-container');
  const template = document.getElementById('artwork-template');
  
  const curator = new Curator();
  await curator.init();

  enterBtn.addEventListener('click', async () => {
    entrance.classList.add('hidden');
    museum.classList.remove('hidden');
    
    const exhibits = [];
    
    // 1. Entrance Exhibit
    exhibits.push({
      type: 'Welcome',
      title: 'Welcome to the Museum of Tabs',
      content: 'welcome.jpg',
      medium: 'Digital AI Art, ' + new Date().getFullYear()
    });
    
    // 2. Fetch Tabs
    try {
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        // Ignore the museum itself and internal system tabs
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          exhibits.push({
            type: 'Tab',
            tabId: tab.id,
            title: tab.title || 'Unknown Void',
            content: tab.url,
            medium: 'Hyperlink on Chromium Canvas, ' + new Date().getFullYear()
          });
        }
      });
    } catch(err) {
      console.error('Error fetching tabs', err);
    }
    
    // Shuffle exhibits slightly for artistic chaos, but put Welcome first
    exhibits.sort((a, b) => {
      if (a.type === 'Welcome') return -1;
      if (b.type === 'Welcome') return 1;
      return Math.random() - 0.5;
    });

    renderExhibits(exhibits);
  });

  async function renderExhibits(exhibits) {
    let currentRoom = null;
    let itemsInRoom = 0;
    let roomCount = 1;

    const roomNames = [
      "The Hall of Abandoned Intentions",
      "Echoes of Productivity",
      "The Gallery of Regret",
      "Infinite Scroll Sanctuary",
      "The Void of Forgotten Queries",
      "Archives of the Distracted"
    ];

    for (const exhibit of exhibits) {
      if (itemsInRoom >= 4 || !currentRoom) {
        if (currentRoom) {
          const pillar = document.createElement('div');
          pillar.className = 'pillar';
          galleryContainer.appendChild(pillar);
        }

        currentRoom = document.createElement('div');
        currentRoom.className = 'room';
        const roomName = roomNames[(roomCount - 1) % roomNames.length];
        currentRoom.setAttribute('data-room-name', `Room ${roomCount}: ${roomName}`);
        galleryContainer.appendChild(currentRoom);
        roomCount++;
        itemsInRoom = 0;
      }

      const clone = template.content.cloneNode(true);
      const frame = clone.querySelector('.artwork-frame');
      const artContent = clone.querySelector('.art-content');
      const title = clone.querySelector('.title');
      const medium = clone.querySelector('.medium');
      const description = clone.querySelector('.description');
      const rarity = clone.querySelector('.rarity');
      const significance = clone.querySelector('.significance');

      // Populate basic info
      if (exhibit.type === 'Tab') {
        title.textContent = "Exhibit: " + (exhibit.title.substring(0, 35) + (exhibit.title.length > 35 ? '...' : ''));
        
        // Attempt to load screenshot from cache
        const key = `screenshot_${exhibit.tabId}`;
        chrome.storage.local.get([key], (result) => {
          artContent.innerHTML = '';
          if (result[key]) {
            artContent.style.backgroundImage = `url(${result[key]})`;
          } else {
            // Fallback to placeholder digital art if no screenshot exists (e.g. system tabs)
            artContent.style.backgroundImage = `url('missing.jpg')`;
          }
          artContent.style.backgroundSize = 'cover';
          artContent.style.backgroundPosition = 'center';
        });
      } else if (exhibit.type === 'Welcome') {
        artContent.innerHTML = '';
        artContent.style.backgroundImage = `url(${exhibit.content})`;
        artContent.style.backgroundSize = 'cover';
        artContent.style.backgroundPosition = 'center';
        title.textContent = exhibit.title;
      } else {
        artContent.textContent = exhibit.content.substring(0, 150) + (exhibit.content.length > 150 ? '...' : '');
        title.textContent = exhibit.title;
      }

      medium.textContent = exhibit.medium;
      
      // Fake scores
      rarity.textContent = `Artistic Value: ${Math.floor(Math.random() * 10)}/10`;
      significance.textContent = `Significance: ${['Low', 'Negligible', 'Tragic', 'Profound', 'Questionable'][Math.floor(Math.random() * 5)]}`;

      currentRoom.appendChild(clone);
      itemsInRoom++;

      // Fetch AI description asynchronously
      curator.getCuratorialAnalysis(exhibit.type, exhibit.content, exhibit.title).then(text => {
        description.style.opacity = '0';
        description.innerHTML = text;
        setTimeout(() => {
          description.style.transition = 'opacity 1s';
          description.style.opacity = '1';
        }, 50);
      });
    }
    
    if (exhibits.length === 0) {
      galleryContainer.innerHTML = '<div style="margin:auto; text-align:center; font-family:Playfair Display; font-size: 2em; color: #888;">The museum is entirely empty.<br>Your mind is remarkably clear.</div>';
    }
  }
});
