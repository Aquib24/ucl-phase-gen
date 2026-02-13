function populateMatchSelect() {
const sel = document.getElementById("matchSelect");
sel.innerHTML = "";

DataStore.matches.forEach(m => {
sel.innerHTML += `<option value="${m.id}">
MD${m.matchday} — ${m.home} vs ${m.away}

</option>`;
});
}

document.getElementById("playBtn").onclick = () => {

const id = Number(matchSelect.value);

const events = [{
scorer: scorer.value,
assist: assist.value || null
}];

MatchEngine.playMatch(
id,
Number(homeScore.value),
Number(awayScore.value),
events,
motm.value
);

renderTable();
renderLeaders();
};

function renderTable() {
const sorted = [...DataStore.teams].sort((a,b)=>b.points-a.points);
tableView.innerHTML = sorted.map(t =>
`${t.name} — ${t.points} pts<br>`
).join("");
}

function renderLeaders() {
const top = [...DataStore.players].sort((a,b)=>b.goals-a.goals).slice(0,5);
leaderboardView.innerHTML = top.map(p =>
`${p.name} ${p.goals}g<br>`
).join("");
}
