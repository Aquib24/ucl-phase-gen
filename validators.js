function validateTeams(teams) {
if (teams.length !== 36) {
throw new Error("Exactly 36 teams required.");
}

const names = new Set();
teams.forEach(t => {
if (!t.name || !t.country || !t.pot) {
throw new Error("Invalid team row.");
}
if (names.has(t.name)) {
throw new Error("Duplicate team: " + t.name);
}
names.add(t.name);
});
}

function validatePlayers(players, teams) {
players.forEach(p => {
if (!teams.find(t => t.name === p.teamName)) {
throw new Error(`Player ${p.name} references missing team.`);
}
});
}
