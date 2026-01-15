// Simple roster availability script
// Usage: open index.html in a browser (same folder) and use the UI.

(() => {
  const namesInput = document.getElementById('namesInput');
  const loadBtn = document.getElementById('loadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const markAllBtn = document.getElementById('markAllBtn');
  const unmarkAllBtn = document.getElementById('unmarkAllBtn');
  const exportBtn = document.getElementById('exportBtn');
  const showAvailableOnly = document.getElementById('showAvailableOnly');
  const playersList = document.getElementById('playersList');
  const totalCountEl = document.getElementById('totalCount');
  const availableCountEl = document.getElementById('availableCount');
  const messageEl = document.getElementById('message');

  let players = []; // { name: string, available: boolean }

  function parseNames(input) {
    if (!input) return [];
    // split on newlines, commas, semicolons, pipes, or tabs
    return Array.from(new Set(
      input
        .split(/[\n,;|\t]+/)
        .map(s => s.trim())
        .filter(Boolean)
    ));
  }

  function renderPlayers() {
    playersList.innerHTML = '';
    const showOnly = showAvailableOnly.checked;
    const list = players.filter(p => (!showOnly) || p.available);

    if (list.length === 0) {
      playersList.innerHTML = '<div class="small">No players to show.</div>';
    } else {
      const fragment = document.createDocumentFragment();
      list.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'player';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = p.available;
        checkbox.dataset.index = players.indexOf(p); // persist original index
        checkbox.addEventListener('change', onAvailabilityChange);
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = p.name;
        row.appendChild(checkbox);
        row.appendChild(nameDiv);
        fragment.appendChild(row);
      });
      playersList.appendChild(fragment);
    }
    updateCounts();
  }

  function onAvailabilityChange(e) {
    const idx = Number(e.target.dataset.index);
    if (!Number.isNaN(idx) && players[idx]) {
      players[idx].available = e.target.checked;
      updateCounts();
    }
  }

  function updateCounts() {
    const total = players.length;
    const available = players.filter(p => p.available).length;
    totalCountEl.textContent = total;
    availableCountEl.textContent = available;
    messageEl.textContent = available > 0 ? `${available} available` : '';
  }

  loadBtn.addEventListener('click', () => {
    const raw = namesInput.value;
    const parsed = parseNames(raw);
    players = parsed.map(name => ({ name, available: false }));
    renderPlayers();
    // optional: clear input after loading
    // namesInput.value = '';
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all loaded players?')) return;
    players = [];
    renderPlayers();
    messageEl.textContent = '';
  });

  markAllBtn.addEventListener('click', () => {
    players.forEach(p => p.available = true);
    renderPlayers();
  });

  unmarkAllBtn.addEventListener('click', () => {
    players.forEach(p => p.available = false);
    renderPlayers();
  });

  showAvailableOnly.addEventListener('change', renderPlayers);

  exportBtn.addEventListener('click', async () => {
    const availableNames = players.filter(p => p.available).map(p => p.name);
    if (availableNames.length === 0) {
      alert('No available players to export.');
      return;
    }
    const text = availableNames.join('\n');
    // try clipboard, fallback to download
    try {
      await navigator.clipboard.writeText(text);
      messageEl.textContent = 'Available players copied to clipboard.';
    } catch (err) {
      // fallback: create a downloadable file
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'available-players.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      messageEl.textContent = 'Downloaded available players as a text file.';
    }
  });

  // Allow pressing Ctrl+Enter (Cmd+Enter on macOS) in textarea to load quickly
  namesInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      loadBtn.click();
    }
  });

  // initial render
  renderPlayers();
})();