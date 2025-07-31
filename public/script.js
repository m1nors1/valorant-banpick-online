const socket = io();
const agentGrid = document.getElementById("agentGrid");
const phaseInfo = document.getElementById("phaseInfo");
const teamAPicks = document.getElementById("teamAPicks");
const teamABans = document.getElementById("teamABans");
const teamBPicks = document.getElementById("teamBPicks");
const teamBBans = document.getElementById("teamBBans");

const agents = [
  "Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher", "Deadlock", "Fade", "Gekko", "Harbor",
  "Iso", "Jett", "Kayo", "Killjoy", "Neon", "Omen", "Phoenix", "Raze", "Reyna", "Sage",
  "Skye", "Sova", "Tejo", "Viper", "Vyse", "Waylay", "Yoru"
];

const displayNames = {
  Kayo: "KAY/O"
};

let currentTeam = null;
let currentType = null;
let myTeam = prompt("Enter your team (A or B):").toUpperCase();

function createAgentButton(agent) {
  const btn = document.createElement("button");
  btn.id = agent;
  const label = displayNames[agent] || agent;
  btn.innerHTML = `<img src="images/${agent.toLowerCase()}.png" alt="${label}"><br>${label}`;
  btn.onclick = () => {
    if (currentTeam && currentType && myTeam === currentTeam) {
      socket.emit("selectAgent", { team: currentTeam, type: currentType, agent });
    } else {
      alert("It's not your team's turn!");
    }
  };
  return btn;
}

agents.forEach(agent => {
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

  if (!state.currentPhase) {
    document.getElementById("results").style.display = "block";
  }

  state.picked.forEach(agent => {
    const btn = document.getElementById(capitalize(agent));
    if (btn) {
      btn.classList.add(`picked-${findTeam(agent, state.teamPicks)}`);
      btn.disabled = true;
    }
  });

  state.banned.forEach(agent => {
    const btn = document.getElementById(capitalize(agent));
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
