const socket = io();
const agentGrid = document.getElementById("agentGrid");
const phaseInfo = document.getElementById("phaseInfo");
const teamAPicks = document.getElementById("teamAPicks");
const teamABans = document.getElementById("teamABans");
const teamBPicks = document.getElementById("teamBPicks");
const teamBBans = document.getElementById("teamBBans");

const agentsByRole = [
  // Controllers
  "Astra", "Brimstone", "Clove", "Harbor", "Omen", "Viper",
  // Sentinels
  "Chamber", "Cypher", "Deadlock", "Killjoy", "Sage", "Vyse",
  // Duelists
  "Iso", "Jett", "Neon", "Phoenix", "Raze", "Reyna", "Yoru", "Waylay",
  // Initiators
  "Breach", "Fade", "Gekko", "Kayo", "Skye", "Sova", "Tejo"
];

const displayNames = { Kayo: "KAY/O" };

let currentTeam = null;
let currentType = null;

const urlParams = new URLSearchParams(window.location.search);
const myTeam = (urlParams.get("team") || "").toUpperCase();
const isSpectator = !["A", "B"].includes(myTeam);
console.log("My team is", myTeam);

function createAgentButton(agent) {
  const btn = document.createElement("button");
  btn.id = agent.toLowerCase();
  const label = displayNames[agent] || agent;
  btn.innerHTML = `<img src="images/${agent.toLowerCase()}.png" alt="${label}"><br>${label}`;
  btn.onclick = () => {
    if (isSpectator) return;

    if (!currentTeam || !currentType) {
      alert("Draft is not active.");
      return;
    }

    if (myTeam !== currentTeam) {
      alert("It's not your team's turn!");
      return;
    }

    showConfirmationPopup(agent, label, currentType);
  };
  return btn;
}

function showConfirmationPopup(agent, label, action) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <img src="images/${agent.toLowerCase()}.png" alt="${label}" />
      <p>Are you sure you want to ${action.charAt(0).toUpperCase() + action.slice(1)} ${label}?</p>
      <div class="modal-buttons">
        <button id="confirmBtn">Yes</button>
        <button id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("confirmBtn").onclick = () => {
    socket.emit("selectAgent", { team: currentTeam, type: currentType, agent });
    document.body.removeChild(modal);
  };

  document.getElementById("cancelBtn").onclick = () => {
    document.body.removeChild(modal);
  };
}

function showFinalResult(teamA, teamB) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <h2>Draft Complete</h2>
      <div style="display: flex; justify-content: space-between; gap: 40px;">
        <div style="flex: 1;">
          <h3 style="color: #4da6ff;">Team A</h3>
          <div class="agent-row">
            ${teamA.map(agent => `<div class="agent-tile picked-A"><img src="images/${agent.toLowerCase()}.png" alt="${agent}" /></div>`).join("")}
          </div>
        </div>
        <div style="flex: 1;">
          <h3 style="color: #ff4d4d;">Team B</h3>
          <div class="agent-row">
            ${teamB.map(agent => `<div class="agent-tile picked-B"><img src="images/${agent.toLowerCase()}.png" alt="${agent}" /></div>`).join("")}
          </div>
        </div>
      </div>
      <div class="modal-buttons" style="margin-top: 15px; justify-content: center;">
        <button onclick="location.reload()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

agentsByRole.forEach(agent => {
  const btn = createAgentButton(agent);
  agentGrid.appendChild(btn);
});

socket.on("stateUpdate", (state) => {
  document.querySelectorAll("#agentGrid button").forEach(btn => {
    btn.className = "";
    btn.disabled = false;
  });

  currentTeam = state.currentPhase?.team || null;
  currentType = state.currentPhase?.type || null;

  phaseInfo.innerText = state.currentPhase
    ? `Current Phase: Team ${currentTeam} ${currentType.toUpperCase()}`
    : "Draft Complete";

  if (state.currentPhase === null && state.phaseIndex >= 14) {
    document.getElementById("results").style.display = "block";
    showFinalResult(state.teamPicks.A, state.teamPicks.B);
  }

  state.picked.forEach(agent => {
    const btn = document.getElementById(agent.toLowerCase());
    if (btn) {
      btn.classList.add(`picked-${findTeam(agent, state.teamPicks)}`);
      btn.disabled = true;
    }
  });

  state.banned.forEach(agent => {
    const btn = document.getElementById(agent.toLowerCase());
    if (btn) {
      btn.classList.add(`banned-${findTeam(agent, state.teamBans)}`);
      btn.disabled = true;
    }
  });

  teamAPicks.innerText = state.teamPicks.A.join(", ");
  teamABans.innerText = state.teamBans.A.join(", ");
  teamBPicks.innerText = state.teamPicks.B.join(", ");
  teamBBans.innerText = state.teamBans.B.join(", ");
});

function findTeam(agent, teamData) {
  if (teamData.A.includes(capitalize(agent))) return "A";
  if (teamData.B.includes(capitalize(agent))) return "B";
  return "";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
