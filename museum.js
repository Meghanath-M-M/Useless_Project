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
    
    const exhibitionRooms = [
      { name: "The Grand Entrance", exhibits: [] },
      { name: "Tabs You'll Never Read", exhibits: [] },
      { name: "Copy-Pasted Regrets", exhibits: [] },
      { name: "Sold at Auction (Closed Tabs)", exhibits: [] }
    ];
    
    // Room 1: The Grand Entrance
    exhibitionRooms[0].exhibits.push({
      type: 'Welcome',
      title: 'Welcome to the Museum of Tabs',
      content: 'welcome.jpg',
      medium: 'Digital AI Art, ' + new Date().getFullYear()
    });
    
    // Room 2: Fetch Tabs
    try {
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        // Ignore the museum itself and internal system tabs
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          exhibitionRooms[1].exhibits.push({
            type: 'Tab',
            tabId: tab.id,
            title: tab.title || 'Unknown Void',
            content: tab.url,
            medium: 'Hyperlink on Chromium Canvas, ' + new Date().getFullYear()
          });
        }
      });
      // Shuffle tabs for artistic chaos
      exhibitionRooms[1].exhibits.sort(() => Math.random() - 0.5);
    } catch(err) {
      console.error('Error fetching tabs', err);
    }

    // Room 3: Fetch Clipboard
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        exhibitionRooms[2].exhibits.push({
          type: 'Clipboard',
          title: 'Untitled (Fragment)',
          content: text.trim(),
          medium: 'Digital Text on Ephemeral Storage, ' + new Date().getFullYear()
        });
      }
    } catch (err) {
      console.log('Clipboard access denied or empty', err);
    }

    // Room 4: Fetch Sold (Closed) Tabs
    try {
      const result = await chrome.storage.local.get(['auctioned_tabs']);
      if (result.auctioned_tabs && result.auctioned_tabs.length > 0) {
        result.auctioned_tabs.forEach(closedTab => {
          exhibitionRooms[3].exhibits.push({
            type: 'AuctionedTab',
            tabId: closedTab.id,
            title: closedTab.title,
            content: closedTab.url,
            medium: 'Acquired by Private Collector, ' + new Date(closedTab.closedAt).toLocaleDateString()
          });
        });
        // Reverse to show most recently closed first
        exhibitionRooms[3].exhibits.reverse();
      }
    } catch (err) {
      console.error('Error fetching auctioned tabs', err);
    }

    renderExhibition(exhibitionRooms);
  });

  function renderExhibition(rooms) {
    let roomCount = 1;
    let isFirstRoom = true;

    for (const room of rooms) {
      if (room.exhibits.length === 0) continue; // Skip empty rooms (e.g. if clipboard is empty)

      if (!isFirstRoom) {
        // Inject a pillar between rooms
        const pillar = document.createElement('div');
        pillar.className = 'pillar';
        galleryContainer.appendChild(pillar);
      }
      isFirstRoom = false;

      // Group exhibits into DOM rooms (max 4 per room div for layout)
      let currentRoomDiv = null;
      
      room.exhibits.forEach((exhibit, index) => {
        if (index % 4 === 0) {
          currentRoomDiv = document.createElement('div');
          currentRoomDiv.className = 'room';
          // Only show the room name on the first div of that thematic room
          currentRoomDiv.setAttribute('data-room-name', index === 0 ? `Room ${roomCount}: ${room.name}` : `${room.name} (Cont.)`);
          galleryContainer.appendChild(currentRoomDiv);
        }

        const clone = template.content.cloneNode(true);
        const artContent = clone.querySelector('.art-content');
        const title = clone.querySelector('.title');
        const medium = clone.querySelector('.medium');
        const description = clone.querySelector('.description');
        const rarity = clone.querySelector('.rarity');
        const significance = clone.querySelector('.significance');

        // Populate basic info
        title.textContent = exhibit.type === 'Tab' || exhibit.type === 'AuctionedTab' ? "Exhibit: " + (exhibit.title.substring(0, 35) + (exhibit.title.length > 35 ? '...' : '')) : exhibit.title;
        medium.textContent = exhibit.medium;

        if (exhibit.type === 'Tab' || exhibit.type === 'AuctionedTab') {
          const key = `screenshot_${exhibit.tabId}`;
          chrome.storage.local.get([key], (result) => {
            artContent.innerHTML = '';
            if (result[key]) {
              artContent.style.backgroundImage = `url(${result[key]})`;
            } else {
              artContent.style.backgroundImage = `url('missing.jpg')`;
            }
            artContent.style.backgroundSize = 'cover';
            artContent.style.backgroundPosition = 'center';
            
            // Add SOLD sticker for auctioned tabs
            if (exhibit.type === 'AuctionedTab') {
              artContent.style.filter = 'grayscale(0.8) contrast(1.2)';
              
              const soldSticker = document.createElement('div');
              soldSticker.textContent = 'SOLD AT AUCTION';
              soldSticker.style.position = 'absolute';
              soldSticker.style.top = '50%';
              soldSticker.style.left = '50%';
              soldSticker.style.transform = 'translate(-50%, -50%) rotate(-15deg)';
              soldSticker.style.backgroundColor = '#8a0303';
              soldSticker.style.color = '#fff';
              soldSticker.style.padding = '10px 20px';
              soldSticker.style.fontFamily = "'Playfair Display', serif";
              soldSticker.style.fontSize = '24px';
              soldSticker.style.fontWeight = 'bold';
              soldSticker.style.border = '3px solid #fff';
              soldSticker.style.boxShadow = '0 5px 15px rgba(0,0,0,0.8)';
              soldSticker.style.whiteSpace = 'nowrap';
              soldSticker.style.zIndex = '10';
              
              const canvas = artContent.parentElement;
              canvas.style.position = 'relative'; // Ensure absolute child positions relative to it
              canvas.appendChild(soldSticker);
            }
          });
        } else if (exhibit.type === 'Welcome') {
          artContent.innerHTML = '';
          artContent.style.backgroundImage = `url(${exhibit.content})`;
          artContent.style.backgroundSize = 'cover';
          artContent.style.backgroundPosition = 'center';
        } else if (exhibit.type === 'Clipboard') {
          // Render clipboard beautifully as minimalist typography
          artContent.innerHTML = '';
          artContent.style.backgroundColor = '#111';
          artContent.style.padding = '20px';
          
          const textSpan = document.createElement('span');
          textSpan.style.fontFamily = "'Playfair Display', serif";
          textSpan.style.fontSize = '18px';
          textSpan.style.color = '#d4af37'; // Gold text
          textSpan.style.lineHeight = '1.4';
          textSpan.style.fontStyle = 'italic';
          textSpan.style.textAlign = 'center';
          
          // Truncate to keep it looking artistic and mysterious
          let displayText = exhibit.content;
          if (displayText.length > 100) displayText = displayText.substring(0, 100) + '...';
          textSpan.textContent = `"${displayText}"`;
          
          artContent.appendChild(textSpan);
        }

        currentRoomDiv.appendChild(clone);

        // Fetch AI description and scores asynchronously
        curator.getCuratorialAnalysis(exhibit.type, exhibit.content, exhibit.title).then(analysisObj => {
          description.style.opacity = '0';
          description.innerHTML = analysisObj.description;
          rarity.textContent = analysisObj.rarity;
          significance.textContent = analysisObj.significance;
          setTimeout(() => {
            description.style.transition = 'opacity 1s';
            description.style.opacity = '1';
          }, 50);
        });
      });
      
      roomCount++;
    }
    
    if (rooms.every(r => r.exhibits.length === 0)) {
      galleryContainer.innerHTML = '<div style="margin:auto; text-align:center; font-family:Playfair Display; font-size: 2em; color: #888;">The museum is entirely empty.<br>Your mind is remarkably clear.</div>';
    }
  }
});
