let players = [];
let coaches = [];
let teams = [];
let coachTeamAssignments = {}; // Maps coach to team
let rosters = {}; // Maps coach to player array
let currentCoachIndex = 0;
let skipNextPick = false;
let timerInterval = null;
let timeRemaining = 120;
let draftStarted = false;
let teamSelectionPhase = true;
let draftDirection = 1; // 1 for forward, -1 for reverse (snake draft)
let roundNumber = 1;
let teamsSelected = 0;

/* =========================
   SETUP PHASE
   ========================= */
function setupDraft() {
  const coachInput = document
    .getElementById('coachInput')
    .value
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  const teamInput = document
    .getElementById('teamInput')
    .value
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  if (coachInput.length !== teamInput.length) {
    alert('Number of coaches must match number of teams!');
    return;
  }

  coaches = coachInput;
  teams = teamInput;
  
  // Randomize coach order
  coaches = coaches.sort(() => Math.random() - 0.5);
  
  coachTeamAssignments = {};
  rosters = {};
  currentCoachIndex = 0;
  teamsSelected = 0;

  document.getElementById('setupContainer').style.display = 'none';
  document.getElementById('draftContainer').style.display = 'block';
  
  renderTeamSelection();
}

function renderTeamSelection() {
  const div = document.getElementById('currentPick');
  const coach = coaches[currentCoachIndex];
  const availableTeams = teams.filter(
    t => !Object.values(coachTeamAssignments).includes(t)
  );

  let html = `
    <div class="selection-display">
      <div class="coach-name">${coach}</div>
      <div class="pick-label">Select Your Team (${teamsSelected + 1}/${coaches.length})</div>
      <div class="teams-grid">
  `;

  availableTeams.forEach(team => {
    html += `
      <button class="team-btn" onclick="selectTeam('${coach}', '${team}')">
        ${team}
      </button>
    `;
  });

  html += `</div></div>`;
  div.innerHTML = html;
}

function selectTeam(coach, team) {
  coachTeamAssignments[coach] = team;
  teamsSelected++;
  rosters[coach] = [];

  if (teamsSelected === coaches.length) {
    startPlayerDraft();
  } else {
    currentCoachIndex++;
    renderTeamSelection();
  }
}

function startPlayerDraft() {
  // Players
  players = document
    .getElementById('playerInput')
    .value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, brotherGroup] = line.split('|').map(s => s.trim());
      return {
        name,
        brotherGroup: brotherGroup || null
      };
    });

  currentCoachIndex = 0;
  skipNextPick = false;
  draftStarted = true;
  teamSelectionPhase = false;
  draftDirection = 1;
  roundNumber = 1;

  renderPlayers();
  renderCoaches();
  renderRosters();
  startTimer();
  updateCurrentPick();
}

/* =========================
   TIMER FUNCTIONS
   ========================= */
function startTimer() {
  timeRemaining = 120;
  clearInterval(timerInterval);
  removeWarningEffects();
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining === 90) {
      triggerWarning();
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timeoutMessage();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  document.getElementById('timer').innerHTML = `<strong>Time:</strong> ${display}`;
}

function triggerWarning() {
  playAlarmSound();
  const timerEl = document.getElementById('timer');
  timerEl.classList.add('warning-flash');
}

function removeWarningEffects() {
  const timerEl = document.getElementById('timer');
  timerEl.classList.remove('warning-flash');
}

function playAlarmSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function timeoutMessage() {
  removeWarningEffects();
  alert(`⏰ ${coaches[currentCoachIndex]}, you must PICK IMMEDIATELY!`);
}

/* =========================
   PICK PLAYER
   ========================= */
function pickPlayer(player) {
  const coach = coaches[currentCoachIndex];

  if (player.brotherGroup) {
    const brothers = players.filter(
      p => p.brotherGroup === player.brotherGroup
    );

    brothers.forEach(b => rosters[coach].push(b.name));
    players = players.filter(
      p => p.brotherGroup !== player.brotherGroup
    );

    skipNextPick = true;
  } else {
    rosters[coach].push(player.name);
    players = players.filter(p => p !== player);
  }

  advancePick();
}

function passPick() {
  advancePick();
}

/* =========================
   ADVANCE PICK (SNAKE DRAFT)
   ========================= */
function advancePick() {
  renderPlayers();
  renderRosters();

  // Check if draft is complete
  if (players.length === 0) {
    endDraft();
    return;
  }

  // Move to next coach in current direction
  currentCoachIndex += draftDirection;

  // Check if we need to reverse direction (snake draft)
  if (currentCoachIndex >= coaches.length) {
    // End of forward round, reverse
    roundNumber++;
    draftDirection = -1;
    currentCoachIndex = coaches.length - 1;
  } else if (currentCoachIndex < 0) {
    // Start of reverse round, go forward
    roundNumber++;
    draftDirection = 1;
    currentCoachIndex = 0;
  }

  if (skipNextPick) {
    skipNextPick = false;
    currentCoachIndex += draftDirection;
  }

  renderCoaches();
  startTimer();
  updateCurrentPick();
}

/* =========================
   END DRAFT
   ========================= */
function endDraft() {
  clearInterval(timerInterval);
  removeWarningEffects();
  
  const div = document.getElementById('draftContainer');
  div.innerHTML = `
    <div class="draft-complete">
      <h1 class="final-title">🏆 DRAFT COMPLETE! 🏆</h1>
      <div class="final-rosters">
  `;

  coaches.forEach((coach, index) => {
    div.innerHTML += `
      <div class="final-team-card" style="animation-delay: ${index * 0.2}s;">
        <div class="final-team-header">${coach}</div>
        <div class="final-team-name">${coachTeamAssignments[coach]}</div>
        <div class="final-roster">
          ${rosters[coach].map(p => `<div class="final-player">${p}</div>`).join('')}
        </div>
      </div>
    `;
  });

  div.innerHTML += `
      </div>
      <button onclick="location.reload()" class="restart-btn">Start New Draft</button>
    </div>
  `;
}

/* =========================
   UI RENDERING
   ========================= */
function updateCurrentPick() {
  const coach = coaches[currentCoachIndex];
  const team = coachTeamAssignments[coach];
  
  document.getElementById('currentPick').innerHTML =
    `<div class="current-pick-display">
      <div class="coach-name">${coach}</div>
      <div class="team-name">${team}</div>
      <div class="pick-label">Round ${roundNumber} - Make Your Pick</div>
    </div>`;
}

function renderPlayers() {
  const div = document.getElementById('players');
  div.innerHTML = '';

  players.forEach(player => {
    const el = document.createElement('div');
    el.className = 'player';
    el.textContent =
      player.name +
      (player.brotherGroup ? ` (Brother ${player.brotherGroup})` : '');
    el.onclick = () => pickPlayer(player);
    div.appendChild(el);
  });
}

function renderCoaches() {
  const div = document.getElementById('coaches');
  div.innerHTML = '';

  coaches.forEach((coach, i) => {
    const el = document.createElement('div');
    el.textContent = `${coach} (${coachTeamAssignments[coach]})`;
    if (i === currentCoachIndex) el.className = 'current';
    div.appendChild(el);
  });
}

function renderRosters() {
  const div = document.getElementById('rosters');
  div.innerHTML = '';

  Object.entries(rosters).forEach(([coach, roster]) => {
    const section = document.createElement('div');
    section.innerHTML =
      `<strong>${coach} - ${coachTeamAssignments[coach]}</strong><ul>` +
      roster.map(p => `<li>${p}</li>`).join('') +
      '</ul>';
    div.appendChild(section);
  });
}
