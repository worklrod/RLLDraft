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
  const coachesInput = document.getElementById('coachesInput');
  const loadCoachesBtn = document.getElementById('loadCoachesBtn');
  const startDraftBtn = document.getElementById('startDraftBtn');
  const nextPickBtn = document.getElementById('nextPickBtn');
  const currentCoachEl = document.getElementById('currentCoach');
  const rostersEl = document.getElementById('rosters');


  document.getElementById('showDraftBtn').addEventListener('click', function() {
    const playerInput = document.getElementById('namesInput').value;
    const coachInput = document.getElementById('coachesInput').value;
    const draftDiv = document.getElementById('draftOrderList');

    // Parse names
    const parseNames = str => str
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const players = parseNames(playerInput);
    const coaches = parseNames(coachInput);

    if (players.length === 0 || coaches.length === 0) {
        draftDiv.innerHTML = '<span style="color:red;">Please enter both player and coach names.</span>';
        return;
    }

    // Snake draft logic
    let html = '<h3>Draft Order</h3><ol>';
    const numCoaches = coaches.length;
    players.forEach((player, pickNum) => {
        const roundNum = Math.floor(pickNum / numCoaches);
        const indexInRound = pickNum % numCoaches;
        const coach = (roundNum % 2 === 0)
            ? coaches[indexInRound]
            : coaches.slice().reverse()[indexInRound];
        html += `<li>Pick ${pickNum + 1}: <strong>${coach}</strong> selects <strong>${player}</strong></li>`;
    });
    html += '</ol>';
    draftDiv.innerHTML = html;
});

  let players = []; // { name: string, status: 'available' | 'drafted', coach: string | null }
  let coaches = [];
  let coachRosters = {};
  let currentCoachIndex = 0;
  let draftStarted = false;

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
    const list = players.filter(p => (!showOnly) || p.status === 'available');

    if (list.length === 0) {
      playersList.innerHTML = '<div class="small">No players to show.</div>';
    } else {
      const fragment = document.createDocumentFragment();
      list.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'player';
        if (p.status === 'available' && draftStarted) {
          const draftBtn = document.createElement('button');
          draftBtn.textContent = 'Draft';
          draftBtn.addEventListener('click', () => selectPlayer(p.name));
          row.appendChild(draftBtn);
        } else if (p.status === 'drafted') {
          const draftedDiv = document.createElement('div');
          draftedDiv.textContent = `Drafted by ${p.coach}`;
          draftedDiv.className = 'small';
          row.appendChild(draftedDiv);
        }
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = p.name;
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
    const available = players.filter(p => p.status === 'available').length;
    totalCountEl.textContent = total;
    availableCountEl.textContent = available;
    messageEl.textContent = available > 0 ? `${available} available` : '';
  }

  function selectPlayer(playerName) {
    const player = players.find(p => p.name === playerName && p.status === 'available');
    if (!player) return;
    const coach = coaches[currentCoachIndex];
    player.status = 'drafted';
    player.coach = coach;
    coachRosters[coach].push(playerName);
    renderPlayers();
    renderRosters();
    nextPickBtn.click(); // auto next pick
  }

  function updateCurrentCoach() {
    const coach = coaches[currentCoachIndex] || 'None';
    currentCoachEl.textContent = coach;
  }

  function renderRosters() {
    rostersEl.innerHTML = '';
    if (coaches.length === 0) return;
    const fragment = document.createDocumentFragment();
    coaches.forEach(coach => {
      const div = document.createElement('div');
      div.className = 'roster';
      div.innerHTML = `<h3>${coach}</h3><ul>${coachRosters[coach].map(name => `<li>${name}</li>`).join('')}</ul>`;
      fragment.appendChild(div);
    });
    rostersEl.appendChild(fragment);
  }

  loadBtn.addEventListener('click', () => {
    const raw = namesInput.value;
    const parsed = parseNames(raw);
    players = parsed.map(name => ({ name, status: 'available', coach: null }));
    renderPlayers();
    renderRosters();
    // optional: clear input after loading
    // namesInput.value = '';
  });

  loadCoachesBtn.addEventListener('click', () => {
    const raw = coachesInput.value;
    const parsed = parseNames(raw);
    coaches = parsed;
    coachRosters = {};
    coaches.forEach(coach => coachRosters[coach] = []);
    renderRosters();
  });

  startDraftBtn.addEventListener('click', () => {
    if (coaches.length === 0) {
      alert('Load coaches first.');
      return;
    }
    draftStarted = true;
    currentCoachIndex = 0;
    updateCurrentCoach();
    renderPlayers();
  });

  nextPickBtn.addEventListener('click', () => {
    if (!draftStarted) return;
    currentCoachIndex = (currentCoachIndex + 1) % coaches.length;
    updateCurrentCoach();
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all loaded players?')) return;
    players = [];
    coaches = [];
    coachRosters = {};
    draftStarted = false;
    currentCoachIndex = 0;
    updateCurrentCoach();
    renderPlayers();
    renderRosters();
    messageEl.textContent = '';
  });

  // Allow pressing Ctrl+Enter (Cmd+Enter on macOS) in textarea to load quickly
  namesInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      loadBtn.click();
    }
  });

  // initial render
  renderPlayers();
  renderRosters();
  updateCurrentCoach();
})();