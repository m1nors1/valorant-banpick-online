const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const agentRoles = {
  Jett: "duelist", Phoenix: "duelist", Reyna: "duelist", Raze: "duelist", Yoru: "duelist", Neon: "duelist", Iso: "duelist", Waylay: "duelist",
  Sova: "initiator", Breach: "initiator", Skye: "initiator", Fade: "initiator", Kayo: "initiator", Gekko: "initiator", Tejo: "initiator",
  Omen: "controller", Brimstone: "controller", Viper: "controller", Astra: "controller", Harbor: "controller",
  Killjoy: "sentinel", Cypher: "sentinel", Sage: "sentinel", Chamber: "sentinel", Deadlock: "sentinel", Vyse: "sentinel"
};

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

const getPhase = (index) => {
  let i = 0;
  for (const phase of pickBanPhases) {
    for (let j = 0; j < phase.count; j++) {
      if (i === index) return phase;
      i++;
    }
  }
  return null;
};

let gameState = {
  firstPickedRole: null,
  picked: [],
  banned: [],
  teamPicks: { A: [], B: [] },
  teamBans: { A: [], B: [] },
  phaseIndex: 0,
  currentPhase: null
};

// Option A: Reset on server start
function resetGameState() {
  gameState.phaseIndex = 0;
  gameState.picked = [];
  gameState.banned = [];
  gameState.teamPicks = { A: [], B: [] };
  gameState.teamBans = { A: [], B: [] };
  gameState.firstPickedRole = null;
  gameState.currentPhase = getPhase(0);
}

resetGameState();

// Option B: Reset endpoint
app.get("/reset", (req, res) => {
  resetGameState();
  io.emit("stateUpdate", gameState);
  res.send("Game state reset.");
});

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.emit("stateUpdate", gameState);

  socket.on("selectAgent", ({ team, type, agent }) => {
    const currentPhase = getPhase(gameState.phaseIndex);
    gameState.currentPhase = currentPhase;

    if (!currentPhase || currentPhase.team !== team || currentPhase.type !== type) return;

    const agentLower = agent.toLowerCase();
    if (gameState.picked.includes(agentLower) || gameState.banned.includes(agentLower)) return;

    if (type === "pick") {
      if (gameState.phaseIndex === 1) {
        const expectedRole = gameState.firstPickedRole;
        if (agentRoles[agent] !== expectedRole) return;
      }
      gameState.picked.push(agentLower);
      gameState.teamPicks[team].push(agent);
      if (gameState.phaseIndex === 0) {
        gameState.firstPickedRole = agentRoles[agent];
      }
    } else {
      gameState.banned.push(agentLower);
      gameState.teamBans[team].push(agent);
    }

    gameState.phaseIndex++;
    gameState.currentPhase = getPhase(gameState.phaseIndex);
    io.emit("stateUpdate", gameState);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
