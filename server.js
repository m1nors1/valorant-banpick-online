const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Define all phases (14 actions in total)
const pickBanPhases = [
  { team: "B", type: "pick", count: 1 },
  { team: "A", type: "pick", count: 1 },
  { team: "A", type: "ban", count: 1 },
  { team: "B", type: "ban", count: 1 },
  { team: "A", type: "pick", count: 2 },
  { team: "B", type: "pick", count: 1 },
  { team: "B", type: "ban", count: 1 },
  { team: "A", type: "ban", count: 1 },
  { team: "B", type: "pick", count: 2 },
  { team: "A", type: "pick", count: 1 },
  { team: "A", type: "ban", count: 1 },
  { team: "B", type: "pick", count: 1 },
  { team: "B", type: "ban", count: 1 },
  { team: "A", type: "pick", count: 1 }
];

// Expand to 14-phase list
function getPhase(index) {
  let i = 0;
  for (const phase of pickBanPhases) {
    for (let j = 0; j < phase.count; j++) {
      if (i === index) return { team: phase.team, type: phase.type };
      i++;
    }
  }
  return null;
}

// Game state
let gameState = {
  picked: [],
  banned: [],
  teamPicks: { A: [], B: [] },
  teamBans: { A: [], B: [] },
  phaseIndex: 0,
  currentPhase: getPhase(0)
};

// Reset handler
function resetGameState() {
  gameState = {
    picked: [],
    banned: [],
    teamPicks: { A: [], B: [] },
    teamBans: { A: [], B: [] },
    phaseIndex: 0,
    currentPhase: getPhase(0)
  };
}

app.get("/reset", (req, res) => {
  resetGameState();
  io.emit("stateUpdate", gameState);
  res.send("Game reset.");
});

// Socket logic
io.on("connection", (socket) => {
  socket.emit("stateUpdate", gameState);

  socket.on("selectAgent", ({ team, type, agent }) => {
    const current = getPhase(gameState.phaseIndex);
    if (!current || current.team !== team || current.type !== type) return;

    const agentLower = agent.toLowerCase();
    if (gameState.picked.includes(agentLower) || gameState.banned.includes(agentLower)) return;

    if (type === "pick") {
      gameState.picked.push(agentLower);
      gameState.teamPicks[team].push(agent);
    } else {
      gameState.banned.push(agentLower);
      gameState.teamBans[team].push(agent);
    }

    gameState.phaseIndex++;
    gameState.currentPhase = getPhase(gameState.phaseIndex);
    io.emit("stateUpdate", gameState);
  });
});

app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
